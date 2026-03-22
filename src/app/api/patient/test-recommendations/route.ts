import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TestRecommendation from '@/models/TestRecommendation';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || authUser.role !== 'user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recommendations = await TestRecommendation.find({ patientId: authUser.userId })
      .populate('doctorId', 'name specialty')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, recommendations });
  } catch (error) {
    console.error('Patient test-recommendations GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || authUser.role !== 'user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status } = await request.json();

    if (!id || !['pending', 'done'].includes(status)) {
      return NextResponse.json({ error: 'id and valid status (pending or done) required' }, { status: 400 });
    }

    const updated = await TestRecommendation.findOneAndUpdate(
      { _id: id, patientId: authUser.userId },
      { $set: { status } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, recommendation: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

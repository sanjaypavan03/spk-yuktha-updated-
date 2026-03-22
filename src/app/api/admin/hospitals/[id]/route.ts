import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Hospital from '@/models/Hospital';
import { getAuthenticatedUser } from '@/lib/auth';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getAuthenticatedUser(request);
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await dbConnect();
        const { id } = await params;

        const deletedToken = await Hospital.findByIdAndDelete(id);

        if (!deletedToken) {
            return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Hospital deleted successfully' });
    } catch (error) {
        console.error('Delete Hospital Error:', error);
        return NextResponse.json({ error: 'Failed to delete hospital' }, { status: 500 });
    }
}

import { getPlanConfig, PlanKey } from '@/lib/plans';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAuthenticatedUser(request);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const { status, plan } = body;

    const updateData: any = {};

    if (status) {
      updateData.status = status;
    }

    if (plan) {
      const planConfig = getPlanConfig(plan as PlanKey);
      updateData.plan = plan;
      updateData.maxDoctors = planConfig.maxDoctors;
      updateData.planActivatedAt = new Date();
    }

    const updated = await Hospital.findByIdAndUpdate(id, { $set: updateData }, { new: true });

    if (!updated) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, hospital: updated });
  } catch (error) {
    console.error('Update Hospital Error:', error);
    return NextResponse.json({ error: 'Failed to update hospital' }, { status: 500 });
  }
}

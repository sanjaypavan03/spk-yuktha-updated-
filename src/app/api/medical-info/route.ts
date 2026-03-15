import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import MedicalInfo from '@/models/MedicalInfo';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const medicalInfo = await MedicalInfo.findOne({ userId: authUser.userId }).lean();
    return NextResponse.json({ success: true, data: medicalInfo || {} });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    const validFields = [
      'bloodGroup', 'knownAllergies', 'allergiesDetails', 'chronicConditions',
      'currentMedications', 'emergencyContact1Name', 'hasPacemakerOrImplant',
      'height', 'weight', 'smokingStatus', 'alcoholUse', 'physicalActivityLevel',
      'pastSurgeries', 'familyMedicalHistory', 'insuranceProvider', 'additionalNotes',
      'emergencyContact2Name'
    ];

    const updateData: any = {};

    validFields.forEach(field => {
      if (body[field] !== undefined) {
        let val = body[field];
        if (Array.isArray(val) && field !== 'pastSurgeries') {
          val = val.join(', ');
        }
        if (typeof val === 'string' && val === null) {
          val = '';
        }
        updateData[field] = val;
      }
    });

    const medicalInfo = await MedicalInfo.findOneAndUpdate(
      { userId: authUser.userId },
      { $set: { ...updateData, userId: authUser.userId } },
      { new: true, upsert: true, runValidators: false, setDefaultsOnInsert: true }
    ).lean();

    await User.findByIdAndUpdate(authUser.userId, { emergencyDetailsCompleted: true });

    return NextResponse.json({ success: true, data: medicalInfo });
  } catch (error: any) {
    return NextResponse.json({ error: 'Database Rejected Update', details: error.message }, { status: 500 });
  }
}

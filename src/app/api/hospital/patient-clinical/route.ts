import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import MedicalInfo from '@/models/MedicalInfo';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);

        // According to requirements, this could be accessed by Doctor or Hospital role?
        // "doctor fills BP, sugar, condition control for a patient" -> implies doctor role inside hospital portal context, or hospital role.
        // Let's allow 'hospital' and 'doctor'.
        if (!authUser || (authUser.role !== 'hospital' && authUser.role !== 'doctor')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const hospitalId = authUser.role === 'hospital' ? authUser.userId : authUser.hospitalId;
        
        const body = await request.json();
        const { patientId, bpReading, fastingBloodSugar, bmi, conditionControlLevel } = body;

        if (!patientId) {
            return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
        }

        const updatedInfo = await MedicalInfo.findOneAndUpdate(
            { patientId: patientId, hospitalId: hospitalId }, // Fix: userId -> patientId + add hospitalId filter
            {
                $set: {
                    bpReading,
                    fastingBloodSugar,
                    bmi,
                    conditionControlLevel,
                    lastClinicalVisitDate: new Date()
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedInfo) {
            return NextResponse.json({ error: 'Medical record not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ success: true, medicalInfo: updatedInfo });

    } catch (error) {
        console.error('Update Patient Clinical Error:', error);
        return NextResponse.json({ error: 'Failed to update clinical details' }, { status: 500 });
    }
}

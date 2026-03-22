import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import IPAdmission from '@/models/IPAdmission';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);
        
        if (!authUser || authUser.role !== 'doctor') {
            return NextResponse.json({ error: 'Unauthorized: Doctor access required' }, { status: 401 });
        }

        const body = await request.json();
        const { admissionId, dischargeNote } = body;

        if (!admissionId || !dischargeNote) {
            return NextResponse.json({ error: 'admissionId and dischargeNote are required' }, { status: 400 });
        }

        const admission = await IPAdmission.findOne({ 
            _id: admissionId,
            doctorId: authUser.userId,
            status: 'admitted'
        });

        if (!admission) {
            return NextResponse.json({ error: 'Active admission not found or not assigned to you' }, { status: 404 });
        }

        // Update admission status
        admission.status = 'discharged';
        admission.dischargeDate = new Date();
        admission.dischargeNote = dischargeNote;
        
        // Add a final progress note
        admission.progressNotes.push({
            note: 'PATIENT DISCHARGED: ' + dischargeNote,
            addedBy: authUser.name || 'Doctor',
            addedAt: new Date()
        });

        await admission.save();

        return NextResponse.json({ 
            success: true, 
            message: 'Patient discharged successfully',
            admission 
        });

    } catch (error: any) {
        console.error('Doctor Discharge Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

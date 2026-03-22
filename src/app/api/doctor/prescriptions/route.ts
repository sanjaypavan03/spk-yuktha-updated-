import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Prescription from '@/models/Prescription';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);
        if (!authUser || authUser.role !== 'doctor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch prescriptions issued by this doctor
        // Using authUser.userId which matches doctorId in Prescription model
        const prescriptions = await Prescription.find({ 
            doctorId: authUser.userId 
        })
        .populate('patientId', 'name email phone firstName lastName')
        .sort({ issuedAt: -1 });

        return NextResponse.json({ success: true, prescriptions });
    } catch (error) {
        console.error('Fetch Doctor Prescriptions Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

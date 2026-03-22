import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Prescription from '@/models/Prescription';
import Appointment from '@/models/Appointment';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ patientId: string }> }
) {
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser || authUser.role !== 'doctor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { patientId } = await params;
        await dbConnect();

        // Security check: Doctor must have an appointment with this patient
        const hasRelationship = await Appointment.findOne({
            doctorId: authUser.userId,
            patientId: patientId
        });

        if (!hasRelationship) {
            return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
        }

        // Fetch all prescriptions for this patient by this hospital/doctor
        // Some might be issued by the hospital generally, but we'll show all historical prescriptions
        // for better clinical context if the doctor is treating them.
        const prescriptions = await Prescription.find({ patientId }).sort({ issuedAt: -1 });

        return NextResponse.json({ success: true, prescriptions });
    } catch (error) {
        console.error('Fetch Patient Prescriptions Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

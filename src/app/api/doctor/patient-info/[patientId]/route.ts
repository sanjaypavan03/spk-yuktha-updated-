import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import MedicalInfo from '@/models/MedicalInfo';
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
        if (!patientId) {
            return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
        }

        await dbConnect();

        // Security check: Doctor must have an appointment with this patient
        const hasRelationship = await Appointment.findOne({
            doctorId: authUser.userId,
            patientId: patientId
        });

        if (!hasRelationship) {
            return NextResponse.json({ error: 'Access Denied: No clinical relationship found' }, { status: 403 });
        }

        const medicalInfo = await MedicalInfo.findOne({ userId: patientId });
        if (!medicalInfo) {
            return NextResponse.json({ error: 'Medical record not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, medicalInfo });
    } catch (error) {
        console.error('Fetch Patient Info Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

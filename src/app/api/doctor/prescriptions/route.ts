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

        const { searchParams } = new URL(request.url);
        const patientId = searchParams.get('patientId');

        if (!patientId) {
            return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
        }

        const hospitalId = authUser.hospitalId;
        if (!hospitalId) {
            return NextResponse.json({ error: 'Hospital context not found' }, { status: 400 });
        }

        // Fetch all prescriptions for this patient by this hospital
        // Verified by hospitalId from JWT
        const prescriptions = await Prescription.find({
            patientId,
            hospitalId: authUser.hospitalId
        }).sort({ issuedAt: -1 });

        return NextResponse.json({ success: true, prescriptions });
    } catch (error) {
        console.error('Fetch Doctor Prescriptions Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

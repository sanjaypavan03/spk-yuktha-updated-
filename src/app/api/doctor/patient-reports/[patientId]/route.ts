import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Appointment from '@/models/Appointment';
import { getReportModel } from '@/models/Report';
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
        await dbConnect(); // Standard DB for Appointment check

        // Security check
        const hasRelationship = await Appointment.findOne({
            doctorId: authUser.userId,
            patientId: patientId
        });

        if (!hasRelationship) {
            return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
        }

        const Report = await getReportModel(); // Reports DB connection
        const reports = await Report.find({ userId: patientId }).sort({ date: -1 });

        return NextResponse.json({ success: true, reports });
    } catch (error) {
        console.error('Fetch Patient Reports Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

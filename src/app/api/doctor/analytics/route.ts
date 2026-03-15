import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Appointment from '@/models/Appointment';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser || authUser.role !== 'doctor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const doctorId = authUser.userId;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        // Appointments Today
        const appointmentsToday = await Appointment.countDocuments({
            doctorId,
            date: { $gte: startOfToday, $lte: endOfToday },
            status: { $ne: 'cancelled' }
        });

        // Appointments This Week
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6); // Saturday
        endOfWeek.setHours(23, 59, 59, 999);

        const appointmentsThisWeek = await Appointment.countDocuments({
            doctorId,
            date: { $gte: startOfWeek, $lte: endOfWeek },
            status: { $ne: 'cancelled' }
        });

        // Total Patients Seen
        const distinctPatients = await Appointment.distinct('patientId', { doctorId });
        const totalPatientsSeen = distinctPatients.length;

        return NextResponse.json({
            success: true,
            data: {
                appointmentsToday,
                appointmentsThisWeek,
                totalPatientsSeen
            }
        });
    } catch (error) {
        console.error('Doctor Analytics Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

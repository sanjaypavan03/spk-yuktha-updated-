import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Appointment from '@/models/Appointment';
import Prescription from '@/models/Prescription';
import Doctor from '@/models/Doctor';
import { getAuthenticatedUser } from '@/lib/auth';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);
        if (!authUser || authUser.role !== 'hospital') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        // 1. Get all doctors for this hospital
        const doctors = await Doctor.find({ hospitalId: authUser.userId });

        // 2. For each doctor, aggregate stats
        const performance = await Promise.all(doctors.map(async (doc) => {
            // Appointments stats
            const appointments = await Appointment.find({
                doctorId: doc._id,
                date: { $gte: monthStart, $lte: monthEnd }
            });

            const appointmentsCount = appointments.length;
            const completedCount = appointments.filter(a => a.status === 'completed').length;
            const completionRate = appointmentsCount > 0 
                ? Math.round((completedCount / appointmentsCount) * 100) 
                : 0;

            // Prescription stats
            const prescriptionsCount = await Prescription.countDocuments({
                doctorId: doc._id,
                issuedAt: { $gte: monthStart, $lte: monthEnd }
            });

            return {
                id: doc._id,
                name: doc.name,
                specialty: doc.specialty,
                appointmentsCount,
                completedCount,
                prescriptionsCount,
                completionRate
            };
        }));

        return NextResponse.json({ success: true, performance });
    } catch (error) {
        console.error('Performance Analytics Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

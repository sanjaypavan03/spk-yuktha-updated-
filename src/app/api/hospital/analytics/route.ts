import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Prescription from '@/models/Prescription';
import Appointment from '@/models/Appointment';
import { getAuthenticatedUser } from '@/lib/auth';
import { planGate } from '@/lib/plan-gate';
import { format, subDays } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser || authUser.role !== 'hospital') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const analyticsGate = planGate(authUser.hospitalPlan, 'performanceReports');
        if (analyticsGate) return analyticsGate;

        await dbConnect();
        const hospitalId = authUser.userId;

        // totalPatients
        const uniquePatients = await Prescription.distinct('patientId', { hospitalId });
        const totalPatients = uniquePatients.length;

        // totalPrescriptions
        const totalPrescriptions = await Prescription.countDocuments({ hospitalId });

        // appointmentsThisMonth
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const appointmentsThisMonth = await Appointment.countDocuments({
            hospitalId,
            date: { $gte: startOfMonth }
        });

        // completedAppointments & noShowCount
        const completedAppointments = await Appointment.countDocuments({ hospitalId, status: 'completed' });
        const noShowCount = await Appointment.countDocuments({ hospitalId, status: 'no_show' });

        // noShowRate
        const totalResolved = completedAppointments + noShowCount;
        const noShowRate = totalResolved > 0 ? Math.round((noShowCount / totalResolved) * 100) : 0;

        // prescriptionsLast7Days
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const startOf7DaysAgo = subDays(new Date(today), 6);
        startOf7DaysAgo.setHours(0, 0, 0, 0);

        const recentPrescriptions = await Prescription.find({
            hospitalId,
            createdAt: { $gte: startOf7DaysAgo, $lte: today }
        });

        const prescriptionsLast7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = subDays(today, 6 - i);
            const dateStr = format(d, 'yyyy-MM-dd');

            const count = recentPrescriptions.filter(
                pres => format(new Date(pres.createdAt), 'yyyy-MM-dd') === dateStr
            ).length;

            return {
                day: format(d, 'EEE'), // e.g. 'Mon'
                date: dateStr,
                count
            };
        });

        return NextResponse.json({
            success: true,
            totalPatients,
            totalPrescriptions,
            appointmentsThisMonth,
            completedAppointments,
            noShowCount,
            noShowRate,
            prescriptionsLast7Days
        });

    } catch (error) {
        console.error('Hospital Analytics Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

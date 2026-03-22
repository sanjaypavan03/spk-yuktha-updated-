import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Appointment from '@/models/Appointment';
import Prescription from '@/models/Prescription';
import PillTracking from '@/models/PillTracking';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser || authUser.role !== 'doctor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const doctorId = authUser.userId;

        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Appointments Today
        const appointmentsToday = await Appointment.countDocuments({
            doctorId,
            date: { $gte: startOfToday, $lte: endOfToday },
            status: { $ne: 'cancelled' }
        });

        // 2. Total Patients Seen (Unique)
        const distinctPatients = await Appointment.distinct('patientId', { doctorId });
        const totalPatientsSeen = distinctPatients.length;

        // 3. Prescriptions This Month
        const prescriptionsThisMonth = await Prescription.countDocuments({
            doctorId,
            issuedAt: { $gte: startOfMonth }
        });

        // 4. Avg Adherence of Patients (Last 30 Days)
        // We calculate this across all patients the doctor has ever seen
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const adherenceData = await PillTracking.aggregate([
            {
                $match: {
                    patientId: { $in: distinctPatients },
                    date: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: null,
                    totalPills: { $sum: 1 },
                    takenPills: { $sum: { $cond: [{ $eq: ["$taken", true] }, 1, 0] } }
                }
            }
        ]);

        let avgAdherence = 0;
        if (adherenceData.length > 0 && adherenceData[0].totalPills > 0) {
            avgAdherence = Math.round((adherenceData[0].takenPills / adherenceData[0].totalPills) * 100);
        }

        return NextResponse.json({
            success: true,
            data: {
                appointmentsToday,
                totalPatientsSeen,
                prescriptionsThisMonth,
                avgAdherence
            }
        });
    } catch (error) {
        console.error('Doctor Analytics Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

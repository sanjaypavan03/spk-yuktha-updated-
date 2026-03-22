import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Prescription from '@/models/Prescription';
import PillTracking from '@/models/PillTracking';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser || authUser.role !== 'user') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const prescriptions = await Prescription.find({
            patientId: authUser.userId,
            status: 'Active'
        });

        const alerts = [];

        for (const p of prescriptions) {
            // Count PillTracking entries where date >= today and taken is false
            const remainingCount = await PillTracking.countDocuments({
                prescriptionId: p._id,
                date: { $gte: today },
                taken: false
            });

            // Parse frequency string: 'once'=1, 'twice'/'bd'=2, 'thrice'/'tds'=3, 'four'/'qid'=4, default=1
            const freqLower = (p.frequency || '').toLowerCase();
            let dailyFrequency = 1;
            if (freqLower.includes('twice') || freqLower.includes('bd')) dailyFrequency = 2;
            else if (freqLower.includes('thrice') || freqLower.includes('tds')) dailyFrequency = 3;
            else if (freqLower.includes('four') || freqLower.includes('qid')) dailyFrequency = 4;

            const daysRemaining = remainingCount / dailyFrequency;

            if (daysRemaining <= 3) {
                alerts.push({
                    prescriptionId: p._id,
                    medicineName: p.medicineName,
                    dosage: p.dosage,
                    daysRemaining,
                    remainingCount
                });
            }
        }

        return NextResponse.json({
            success: true,
            alerts
        });

    } catch (error) {
        console.error('Refill Alerts Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

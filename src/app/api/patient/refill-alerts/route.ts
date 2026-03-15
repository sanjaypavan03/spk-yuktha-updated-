import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Prescription from '@/models/Prescription';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser || authUser.role !== 'user') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Let's assume there's a pill tracker or we calculate based on prescribedAmount - taken.
        // For simplicity, returning mock data or data assuming `pillsRemaining` exists on Prescription.
        const prescriptions = await Prescription.find({
            patientId: authUser.userId,
            status: 'active'
        });

        // Mock logic: Prescriptions with < 3 days remaining based on total quantity and frequency
        const alerts = prescriptions.filter(p => {
            // Simplified threshold check. In reality, requires tracking daily intake against total quantity.
            // If we have `pillsRemaining` and `frequency` (e.g. 2 pills/day), threshold is 6 pills.
            const pillsRemaining = (p as any).pillsRemaining || 5;
            const frequencyNum = 2; // e.g. twice daily 
            return pillsRemaining <= frequencyNum * 3;
        });

        return NextResponse.json({
            success: true,
            alerts
        });

    } catch (error) {
        console.error('Refill Alerts Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

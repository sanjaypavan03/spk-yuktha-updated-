import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PillTracking from '@/models/PillTracking';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser || authUser.role !== 'user') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Calculate 30-day PillTracking adherence 0-100
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const trackings = await PillTracking.find({
            patientId: authUser.userId,
            date: { $gte: thirtyDaysAgo }
        });

        if (trackings.length === 0) {
            return NextResponse.json({
                success: true,
                score: 0,
                trend: 'stable'
            });
        }

        const takenCount = trackings.filter(t => t.taken).length;
        const totalCount = trackings.length;
        const score = Math.round((takenCount / totalCount) * 100);

        // Calculate previous 30 days to determine trend
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const prevTrackings = await PillTracking.find({
            patientId: authUser.userId,
            date: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
        });

        let trend = 'stable';
        if (prevTrackings.length > 0) {
            const prevTakenCount = prevTrackings.filter(t => t.taken).length;
            const prevTotalCount = prevTrackings.length;
            const prevScore = Math.round((prevTakenCount / prevTotalCount) * 100);

            if (score > prevScore + 5) trend = 'up';
            else if (score < prevScore - 5) trend = 'down';
        }

        return NextResponse.json({
            success: true,
            score,
            trend
        });

    } catch (error) {
        console.error('Health Score Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

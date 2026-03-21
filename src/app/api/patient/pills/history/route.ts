import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PillTracking from '@/models/PillTracking';
import { getAuthenticatedUser } from '@/lib/auth';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get history for the last 7 days (including today's completed ones)
        const sevenDaysAgo = startOfDay(subDays(new Date(), 7));

        const history = await PillTracking.find({
            patientId: user.userId,
            date: { $gte: sevenDaysAgo },
            $or: [{ taken: true }, { skipped: true }]
        }).sort({ date: -1, scheduledTime: 1 });

        // Group by date
        const groupedHistory: Record<string, any[]> = {};
        
        history.forEach(pill => {
            const dateStr = pill.date.toISOString().split('T')[0];
            if (!groupedHistory[dateStr]) {
                groupedHistory[dateStr] = [];
            }
            groupedHistory[dateStr].push(pill);
        });

        return NextResponse.json({ history: groupedHistory });
    } catch (error: any) {
        console.error("History API Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

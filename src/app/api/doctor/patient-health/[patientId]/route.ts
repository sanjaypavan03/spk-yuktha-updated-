import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PillTracking from '@/models/PillTracking';
import Appointment from '@/models/Appointment';
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
        await dbConnect();

        // Security check
        const hasRelationship = await Appointment.findOne({
            doctorId: authUser.userId,
            patientId: patientId
        });

        if (!hasRelationship) {
            return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
        }

        // 1. Calculate 30-day score
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const trackings = await PillTracking.find({
            patientId: patientId,
            date: { $gte: thirtyDaysAgo }
        });

        let score = 0;
        if (trackings.length > 0) {
            const takenCount = trackings.filter(t => t.taken).length;
            score = Math.round((takenCount / trackings.length) * 100);
        }

        // 2. Fetch last 7 days for the chart
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setHours(0, 0, 0, 0);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        const chartData = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(sevenDaysAgo);
            day.setDate(sevenDaysAgo.getDate() + i);
            
            const nextDay = new Date(day);
            nextDay.setDate(day.getDate() + 1);

            const dayTrackings = await PillTracking.find({
                patientId: patientId,
                date: { $gte: day, $lt: nextDay }
            });

            chartData.push({
                name: day.toLocaleDateString('en-US', { weekday: 'short' }),
                taken: dayTrackings.filter(t => t.taken).length,
                total: dayTrackings.length,
                skipped: dayTrackings.filter(t => t.skipped).length,
                pending: dayTrackings.filter(t => !t.taken && !t.skipped).length
            });
        }

        return NextResponse.json({ success: true, score, chartData });
    } catch (error) {
        console.error('Fetch Patient Health Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

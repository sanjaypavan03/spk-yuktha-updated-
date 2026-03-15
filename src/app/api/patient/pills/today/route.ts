import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PillTracking from '@/models/PillTracking';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get pills for TODAY based on server time (UTC normalized to 00:00)
        // In a real app, we might want to respect user timezone passed in headers
        // For now, we assume matching Date objects set to midnight

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Also fetch for tomorrow just in case of timezone overlap locally, 
        // OR just strict Day matching. Let's do strict day matching on the Date object stored.

        const pills = await PillTracking.find({
            patientId: user.userId,
            date: today
        }).sort({ scheduledTime: 1 }); // Sort by time (AM/PM string sort works reasonably well for simple format)

        return NextResponse.json({ pils: pills });

    } catch (error: any) {
        console.error('Error fetching pills:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

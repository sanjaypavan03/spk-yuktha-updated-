import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PillTracking from '@/models/PillTracking';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { taken } = body;

        const pill = await PillTracking.findOne({
            _id: params.id,
            patientId: user.userId // Security: Ensure pill belongs to user
        });

        if (!pill) {
            return NextResponse.json({ error: 'Pill entry not found' }, { status: 404 });
        }

        pill.taken = taken;
        if (taken) {
            pill.takenAt = new Date();
        } else {
            pill.takenAt = undefined;
        }

        await pill.save();

        return NextResponse.json({ success: true, pill });

    } catch (error: any) {
        console.error('Error updating pill:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

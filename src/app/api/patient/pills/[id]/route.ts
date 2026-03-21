import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PillTracking from '@/models/PillTracking';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { taken, skipped } = body;

        const pill = await PillTracking.findOne({
            _id: id,
            patientId: user.userId // Security: Ensure pill belongs to user
        });

        if (!pill) {
            return NextResponse.json({ error: 'Pill entry not found' }, { status: 404 });
        }

        if (taken !== undefined) {
            pill.taken = taken;
            if (taken) {
                pill.takenAt = new Date();
                pill.skipped = false; // Cannot be taken and skipped
            } else {
                pill.takenAt = undefined;
            }
        }

        if (skipped !== undefined) {
            pill.skipped = skipped;
            if (skipped) {
                pill.taken = false; // Cannot be taken and skipped
                pill.takenAt = undefined;
            }
        }

        await pill.save();

        return NextResponse.json({ success: true, pill });

    } catch (error: any) {
        console.error('Error updating pill:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

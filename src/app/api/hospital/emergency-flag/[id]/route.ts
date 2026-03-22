import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import EmergencyFlag from '@/models/EmergencyFlag';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);
        if (!authUser || authUser.role !== 'hospital') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const body = await request.json();
        const { resolved } = body;

        const flag = await EmergencyFlag.findOne({
            _id: resolvedParams.id,
            hospitalId: authUser.userId
        });

        if (!flag) {
            return NextResponse.json({ error: 'Emergency flag not found' }, { status: 404 });
        }

        if (resolved === true) {
            flag.resolved = true;
            flag.resolvedAt = new Date();
        } else if (resolved === false) {
            flag.resolved = false;
            flag.resolvedAt = undefined;
        }

        await flag.save();
        return NextResponse.json({ success: true, flag });
    } catch (error) {
        console.error('Emergency Flag PATCH Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Doctor from '@/models/Doctor';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getAuthenticatedUser(request);
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await dbConnect();
        const { id } = await params;

        const doctors = await Doctor.find({ hospitalId: id })
            .select('_id name email specialty')
            .sort({ name: 1 });

        return NextResponse.json({ success: true, doctors });
    } catch (error) {
        console.error('Fetch Hospital Doctors Error:', error);
        return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Hospital from '@/models/Hospital';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();
        const hospitals = await Hospital.find({}, 'name location city address').lean();
        return NextResponse.json({ success: true, hospitals });
    } catch (error) {
        console.error('Failed to fetch hospitals directory:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

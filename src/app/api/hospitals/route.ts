import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Hospital from '@/models/Hospital';

export async function GET() {
    try {
        await dbConnect();

        // Returning public info for dropdown
        const hospitals = await Hospital.find()
            .select('_id name contactNumber')
            .sort({ name: 1 });

        return NextResponse.json({
            success: true,
            hospitals
        });
    } catch (error) {
        console.error('Get Hospitals Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

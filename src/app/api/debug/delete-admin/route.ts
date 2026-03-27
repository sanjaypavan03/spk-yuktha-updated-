import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Admin from '@/models/Admin';

export async function GET(request: NextRequest) {
    if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Prohibited' }, { status: 403 });
    await dbConnect();
    const result = await Admin.deleteMany({});
    return NextResponse.json({ success: true, message: `All admins deleted: ${result.deletedCount}` });
}

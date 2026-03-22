import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Receptionist from '@/models/Receptionist';
import ReceptionistAuth from '@/models/ReceptionistAuth';
import bcrypt from 'bcrypt';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser || (authUser.role !== 'hospital' && authUser.role !== 'admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await request.json();
        const { receptionistId, password } = body;

        if (!receptionistId || !password) {
            return NextResponse.json({ error: 'Receptionist ID and password are required' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // Verify receptionist exists and belongs to this hospital (if caller is hospital)
        const receptionist = await Receptionist.findById(receptionistId);
        if (!receptionist) {
            return NextResponse.json({ error: 'Receptionist not found' }, { status: 404 });
        }

        if (authUser.role === 'hospital' && receptionist.hospitalId.toString() !== authUser.userId) {
            return NextResponse.json({ error: 'Forbidden. This receptionist belongs to another hospital.' }, { status: 403 });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Upsert ReceptionistAuth
        await ReceptionistAuth.findOneAndUpdate(
            { receptionistId },
            { passwordHash },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true, message: 'Password set successfully' });
    } catch (error) {
        console.error('Set Receptionist Password Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

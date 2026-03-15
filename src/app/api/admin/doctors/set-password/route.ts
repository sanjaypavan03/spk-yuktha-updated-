import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Doctor from '@/models/Doctor';
import DoctorAuth from '@/models/DoctorAuth';
import bcrypt from 'bcrypt';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser || authUser.role !== 'hospital') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await request.json();
        const { doctorId, password } = body;

        if (!doctorId || !password) {
            return NextResponse.json({ error: 'Doctor ID and password are required' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // Verify doctor belongs to this hospital
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
        }

        if (doctor.hospitalId.toString() !== authUser.userId) {
            return NextResponse.json({ error: 'Forbidden. This doctor belongs to another hospital.' }, { status: 403 });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Upsert DoctorAuth
        const doctorAuth = await DoctorAuth.findOneAndUpdate(
            { doctorId },
            { passwordHash },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true, message: 'Password set successfully' });
    } catch (error) {
        console.error('Set Doctor Password Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

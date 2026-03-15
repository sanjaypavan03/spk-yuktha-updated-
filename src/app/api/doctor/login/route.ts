import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Doctor from '@/models/Doctor';
import DoctorAuth from '@/models/DoctorAuth';
import { generateToken, setAuthCookie } from '@/lib/auth';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Find the doctor by email
        const doctor = await Doctor.findOne({ email: normalizedEmail });
        if (!doctor) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Find DoctorAuth
        const doctorAuth = await DoctorAuth.findOne({ doctorId: doctor._id }).select('+passwordHash');
        if (!doctorAuth) {
            return NextResponse.json({ error: 'Invalid credentials or no password set' }, { status: 401 });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, doctorAuth.passwordHash);
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Update last login
        doctorAuth.lastLogin = new Date();
        await doctorAuth.save();

        // Generate token
        const token = await generateToken(doctor._id.toString(), doctor.email, 'doctor');

        // Create response
        const response = NextResponse.json({
            success: true,
            user: {
                id: doctor._id,
                email: doctor.email,
                name: doctor.name,
                role: 'doctor'
            }
        });

        setAuthCookie(response, token);
        return response;

    } catch (error) {
        console.error('Doctor login error:', error);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}

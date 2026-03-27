import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Doctor from '@/models/Doctor';
import DoctorAuth from '@/models/DoctorAuth';
import { generateToken, setAuthCookie } from '@/lib/auth';
import { checkRateLimit, clearRateLimit } from '@/lib/rate-limit';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
        const rateLimitKey = 'login:' + ip;
        const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
        
        if (!allowed) {
            return NextResponse.json(
                { error: 'Too many login attempts. Try again in ' + Math.ceil(retryAfterMs / 60000) + ' minutes.' },
                { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } }
            );
        }

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
        const Hospital = (await import('@/models/Hospital')).default;
        const hospital = await Hospital.findById(doctor.hospitalId).select('plan');

        const token = await generateToken(
            doctor._id.toString(), 
            doctor.email, 
            'doctor',
            doctor.name,
            undefined, // hospitalRoles
            hospital?.plan || 'starter',
            doctor.hospitalId.toString()
        );

        // Create response
        const response = NextResponse.json({
            success: true,
            user: {
                id: doctor._id,
                email: doctor.email,
                name: doctor.name,
                role: 'doctor',
                hospitalId: doctor.hospitalId
            }
        });

        setAuthCookie(response, token);
        clearRateLimit(rateLimitKey);
        return response;

    } catch (error) {
        console.error('Doctor login error:', error);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}

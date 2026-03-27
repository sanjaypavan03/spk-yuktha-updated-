import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Receptionist from '@/models/Receptionist';
import ReceptionistAuth from '@/models/ReceptionistAuth';
import { generateToken, setAuthCookie } from '@/lib/auth';
import { checkRateLimit, clearRateLimit } from '@/lib/rate-limit';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
        const rateLimitKey = 'login:receptionist:' + ip;
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

        // Find the receptionist by email
        const receptionist = await Receptionist.findOne({ email: normalizedEmail });
        if (!receptionist) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Find ReceptionistAuth
        const receptionistAuth = await ReceptionistAuth.findOne({ receptionistId: receptionist._id }).select('+passwordHash');
        if (!receptionistAuth) {
            return NextResponse.json({ error: 'Invalid credentials or no password set' }, { status: 401 });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, receptionistAuth.passwordHash);
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Update last login
        receptionistAuth.lastLogin = new Date();
        await receptionistAuth.save();

        // Generate token
        const Hospital = (await import('@/models/Hospital')).default;
        const hospital = await Hospital.findById(receptionist.hospitalId).select('plan');

        const token = await generateToken(
            receptionist._id.toString(),
            receptionist.email,
            'receptionist',
            receptionist.name,
            undefined,       // hospitalRoles
            hospital?.plan || 'starter',       // hospitalPlan  
            receptionist.hospitalId.toString()  // hospitalId
        );

        // Create response
        const response = NextResponse.json({
            success: true,
            user: {
                id: receptionist._id,
                email: receptionist.email,
                name: receptionist.name,
                role: 'receptionist',
                hospitalId: receptionist.hospitalId
            }
        });

        setAuthCookie(response, token);
        clearRateLimit(rateLimitKey);
        return response;

    } catch (error) {
        console.error('Receptionist login error:', error);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}

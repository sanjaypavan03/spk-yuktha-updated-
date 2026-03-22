import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Admin from '@/models/Admin';
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

        // Normalized email
        const normalizedEmail = email.trim().toLowerCase();

        // Check if admin exists
        const admin = await Admin.findOne({ email: normalizedEmail }).select('+password');

        if (!admin) {
            // Security: Don't reveal account existence
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isMatch = await admin.comparePassword(password);

        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Generate Admin Token
        const token = await generateToken(admin._id.toString(), admin.email, 'admin');

        const response = NextResponse.json({
            success: true,
            user: {
                id: admin._id.toString(),
                email: admin.email,
                name: admin.name,
                role: 'admin',
            },
            message: 'Admin login successful',
        });

        setAuthCookie(response, token);
        clearRateLimit(rateLimitKey);

        return response;
    } catch (error: any) {
        console.error('Admin Login Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Hospital from '@/models/Hospital';
import { generateToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        // Safe body parsing
        let body;
        try {
            body = await request.json();
            console.log('🔍 Hospital Login Request Body:', JSON.stringify(body, null, 2));
        } catch (e) {
            console.error('❌ Failed to parse request body');
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const { email, password } = body;

        if (!email || !password) {
            console.log('❌ Missing attributes in request: email or password');
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();
        console.log('🔍 Searching for hospital:', normalizedEmail);

        // Check if hospital exists
        const hospital = await Hospital.findOne({ email: normalizedEmail }).select('+password');

        if (!hospital) {
            console.warn(`❌ Hospital not found in DB: ${normalizedEmail}`);
            // Return 401 for security (don't reveal user existence)
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        console.log('✅ Hospital found:', hospital._id, 'Status:', hospital.status);

        // Log sensitive info existence (NOT VALUE)
        console.log('🔍 Has password hash:', !!hospital.password);
        console.log('🔍 Roles raw:', hospital.roles);

        if (hospital.status === 'Disabled') {
            return NextResponse.json({ error: 'Account is disabled. Contact Admin.' }, { status: 403 });
        }

        if (!hospital.password) {
            console.error('❌ CRITICAL: Hospital user has no password hash set');
            return NextResponse.json({ error: 'Server configuration error: No password set' }, { status: 500 });
        }

        // Defensive bcrypt
        let isMatch = false;
        try {
            console.log('🔍 Verifying password...');
            isMatch = await hospital.comparePassword(password);
            console.log('🔍 Password match result:', isMatch);
        } catch (bcryptErr) {
            console.error('❌ Bcrypt comparison error:', bcryptErr);
            return NextResponse.json({ error: 'Authentication processing failed' }, { status: 500 });
        }

        if (!isMatch) {
            console.warn('❌ Password mismatch');
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Generate Token with Role and HospitalType
        const hospitalId = hospital._id.toString();
        console.log('🔑 Hospital Login: Generating token for hospital ID:', hospitalId);
        console.log('🔑 Hospital Login: Hospital name:', hospital.name);
        console.log('🔑 Hospital Login: Hospital email:', hospital.email);

        // SAFELY extract roles
        let safeRoles: string[] = [];
        if (hospital.roles && Array.isArray(hospital.roles)) {
            // Deep copy to remove Mongoose proxies BEFORE passing to auth util
            safeRoles = JSON.parse(JSON.stringify(hospital.roles));
        }

        console.log('🔑 Hospital Login: Safe Roles to embed:', safeRoles);

        let token;
        try {
            token = await generateToken(
                hospitalId,
                hospital.email,
                'hospital',
                safeRoles
            );
        } catch (tokenErr) {
            console.error('❌ Token generation failed:', tokenErr);
            return NextResponse.json({ error: 'Failed to generate session' }, { status: 500 });
        }

        console.log('✅ Hospital Login: Token generated successfully');

        const response = NextResponse.json({
            success: true,
            user: {
                id: hospital._id.toString(),
                email: hospital.email,
                name: hospital.name,
                role: 'hospital',
                hospitalRoles: safeRoles,
            },
            message: 'Login successful',
        });

        setAuthCookie(response, token);

        return response;

    } catch (error: any) {
        // Detailed final catch
        console.error('🔥 Hospital Login CRASH (Global Catch):', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

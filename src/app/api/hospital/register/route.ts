import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Hospital from '@/models/Hospital';
import bcrypt from 'bcrypt';
import { generateToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const { name, email, password, phone, address, city, state } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Hospital Name, Email, and Password are required.' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
        }

        const existing = await Hospital.findOne({ email: email.toLowerCase() });
        if (existing) {
            return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
        }

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        const hospital = await Hospital.create({
            name,
            email: email.toLowerCase(),
            password: passwordHash,
            contactNumber: phone || '',
            status: 'Active',
            roles: ['doctor'],
        });

        const token = await generateToken(
            hospital._id.toString(),
            hospital.email,
            'hospital',
            hospital.name,
            ['doctor']
        );

        const response = NextResponse.json({
            success: true,
            hospital: { id: hospital._id, name: hospital.name, email: hospital.email }
        });

        setAuthCookie(response, token);

        return response;
    } catch (error: any) {
        console.error('Hospital Registration Error:', error);
        return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
    }
}

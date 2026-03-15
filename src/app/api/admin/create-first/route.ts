import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Admin from '@/models/Admin';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        // Check if any admin exists
        const count = await Admin.countDocuments();
        if (count > 0) {
            return NextResponse.json({ error: 'Admin account already exists' }, { status: 403 });
        }

        const { email, password, name } = await request.json();

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Email, Password, and Name required' }, { status: 400 });
        }

        // Manual password hashing
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const admin = await Admin.create({
            email,
            password: hashedPassword,
            name,
        });

        return NextResponse.json({
            success: true,
            message: 'Super Admin created successfully. Please login.',
            admin: { id: admin._id, email: admin.email }
        });

    } catch (error: any) {
        console.error('Create First Admin Error:', error);
        return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
    }
}

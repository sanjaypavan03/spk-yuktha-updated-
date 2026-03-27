/**
 * Patient Self-Registration Route
 * POST /api/auth/patient/register
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import MedicalInfo from '@/models/MedicalInfo';
import { generateToken, setAuthCookie } from '@/lib/auth';
import { generateQRCode } from '@/lib/qr';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const body = await request.json();
        const { email, password, name, firstName, lastName } = body;

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const nameParts = name.trim().split(' ');
        const finalFirstName = firstName || nameParts[0] || name;
        const finalLastName = lastName || nameParts.slice(1).join(' ') || 'User';

        // 1. Create the user first
        const newUser = await User.create({
            email: normalizedEmail,
            password: hashedPassword,
            name: name.trim(),
            firstName: finalFirstName,
            lastName: finalLastName,
            qrCode: generateQRCode(),
            hospitalId: null, // Self-registered
            emergencyDetailsCompleted: false,
        });

        // 2. Generate and save emergency token (FIX 1 requirement)
        const emergencyToken = uuidv4();
        await User.findByIdAndUpdate(newUser._id, { emergencyToken });

        // Initialize MedicalInfo and EmergencyToken
        try {
            const EmergencyToken = (await import('@/models/EmergencyToken')).default;
            await MedicalInfo.create({
                patientId: newUser._id,
                hospitalId: null // Self-registered
            });
            await EmergencyToken.create({
                patientId: newUser._id,
                token: emergencyToken,
                tier: 1,
                isActive: true
            });
        } catch (medicalError) {
            console.error('Initialization failed:', medicalError);
        }

        const token = await generateToken(newUser._id.toString(), newUser.email, 'user', newUser.name);
        const response = NextResponse.json({
            success: true,
            user: {
                id: newUser._id,
                email: newUser.email,
                name: newUser.name,
                emergencyToken
            }
        }, { status: 201 });

        setAuthCookie(response, token);
        return response;

    } catch (error: any) {
        console.error('Registration Error:', error);
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }
}

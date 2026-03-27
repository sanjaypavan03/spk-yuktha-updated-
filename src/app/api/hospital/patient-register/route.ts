import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import MedicalInfo from '@/models/MedicalInfo';
import { getAuthenticatedUser } from '@/lib/auth';
import { generateQRCode } from '@/lib/qr';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);
        
        if (!authUser || (authUser.role !== 'hospital' && authUser.role !== 'receptionist')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, email, phone, dateOfBirth } = body;

        // Validation
        if (!name || !email || !phone) {
            return NextResponse.json({ error: 'name, email, and phone are required' }, { status: 400 });
        }

        // Check if user already exists
        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });
        
        if (existingUser) {
            return NextResponse.json({ 
                error: 'Patient already registered', 
                existingId: existingUser._id 
            }, { status: 409 });
        }

        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(2, 10);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        // Name decomposition logic matching signup pattern
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || name;
        const lastName = nameParts.slice(1).join(' ') || 'Patient';
        const hospitalId = authUser.role === 'hospital' ? authUser.userId : authUser.hospitalId;

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            firstName,
            lastName,
            phone,
            dateOfBirth: dateOfBirth || undefined,
            password: hashedPassword,
            qrCode: generateQRCode(),
            hospitalId: hospitalId, // ← FIX: set the hospital ID
            emergencyDetailsCompleted: false
        });

        // Generate and save emergency token
        const emergencyToken = (await import('uuid')).v4();
        await User.findByIdAndUpdate(user._id, { emergencyToken });

        // Initialize MedicalInfo and EmergencyToken
        try {
            const EmergencyToken = (await import('@/models/EmergencyToken')).default;
            await MedicalInfo.create({
                userId: user._id
            });
            await EmergencyToken.create({
                patientId: user._id,
                token: emergencyToken,
                tier: 1,
                isActive: true
            });
        } catch (medicalError) {
            console.error('Initialization failed:', medicalError);
        }

        return NextResponse.json({ 
            success: true, 
            patient: user, 
            tempPassword,
            hospitalId: authUser.role === 'hospital' ? authUser.userId : authUser.hospitalId
        });

    } catch (error: any) {
        console.error('Patient Registration Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

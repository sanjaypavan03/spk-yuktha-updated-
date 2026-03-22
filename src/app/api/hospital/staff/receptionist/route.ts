import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Receptionist from '@/models/Receptionist';
import { getAuthenticatedUser } from '@/lib/auth';

// GET: List all receptionists for the hospital
export async function GET(request: NextRequest) {
    try {
        const hospital = await getAuthenticatedUser(request);
        if (!hospital || hospital.role !== 'hospital') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await dbConnect();

        const receptionists = await Receptionist.find({ hospitalId: hospital.userId });

        return NextResponse.json({ success: true, receptionists });
    } catch (error: any) {
        console.error('Fetch receptionists error:', error);
        return NextResponse.json({ error: 'Failed to fetch receptionists' }, { status: 500 });
    }
}

// POST: Add new receptionist
export async function POST(request: NextRequest) {
    try {
        const hospitalAuth = await getAuthenticatedUser(request);
        if (!hospitalAuth || hospitalAuth.role !== 'hospital') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await dbConnect();

        const { name, email, phone } = await request.json();

        if (!name || !email) {
            return NextResponse.json({ error: 'Name and Email are required' }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if already exists
        const existingRec = await Receptionist.findOne({ email: normalizedEmail });
        if (existingRec) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
        }

        const receptionist = await Receptionist.create({
            hospitalId: hospitalAuth.userId,
            name,
            email: normalizedEmail,
            phone
        });

        return NextResponse.json({ success: true, receptionist });
    } catch (error: any) {
        console.error('Add receptionist error:', error);
        return NextResponse.json({ error: 'Failed to add receptionist' }, { status: 500 });
    }
}

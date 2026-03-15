import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Doctor from '@/models/Doctor';
import Pharmacy from '@/models/Pharmacy';
import { getAuthenticatedUser } from '@/lib/auth';

// GET: List all staff (Doctors & Pharmacies) for the hospital
export async function GET(request: NextRequest) {
    try {
        const hospital = await getAuthenticatedUser(request);
        if (!hospital || hospital.role !== 'hospital') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await dbConnect();

        const doctors = await Doctor.find({ hospitalId: hospital.userId });
        const pharmacies = await Pharmacy.find({ hospitalId: hospital.userId });

        return NextResponse.json({ doctors, pharmacies });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
    }
}

// POST: Add new staff member
export async function POST(request: NextRequest) {
    try {
        const hospitalAuth = await getAuthenticatedUser(request);
        if (!hospitalAuth || hospitalAuth.role !== 'hospital') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await dbConnect();
        const { type, name, email, specialty, location } = await request.json();

        if (type === 'Doctor') {
            if (!name || !email) return NextResponse.json({ error: 'Name and Email required' }, { status: 400 });

            const doctor = await Doctor.create({
                hospitalId: hospitalAuth.userId,
                name,
                email,
                specialty
            });
            return NextResponse.json({ success: true, staff: doctor });
        } else if (type === 'Pharmacy') {
            if (!name) return NextResponse.json({ error: 'Pharmacy name required' }, { status: 400 });

            const pharmacy = await Pharmacy.create({
                hospitalId: hospitalAuth.userId,
                name,
                location
            });
            return NextResponse.json({ success: true, staff: pharmacy });
        }

        return NextResponse.json({ error: 'Invalid staff type' }, { status: 400 });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ error: 'Email already registered for another staff member' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to add staff member' }, { status: 500 });
    }
}

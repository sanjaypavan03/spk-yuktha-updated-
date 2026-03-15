import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Medicine from '@/models/Medicine';
import MedicalRecord from '@/models/MedicalRecord';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const hospital = await getAuthenticatedUser(request);
        if (!hospital || hospital.role !== 'hospital') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (!hospital.hospitalRoles?.includes('pharmacy')) {
            return NextResponse.json({ error: 'Only Pharmacies can dispense medicines' }, { status: 403 });
        }

        await dbConnect();
        const { userId, name, dosage, time, instructions } = await request.json();

        if (!userId || !name || !dosage || !time) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Create Medicine entry for User Tracker (Mark as already taken/dispensed?)
        // Usually dispense means "giving the physical medicine". 
        // We add it to the tracker so the user can then "take" it daily.
        const medicine = await Medicine.create({
            userId,
            name,
            dosage,
            time,
            instructions,
            taken: false,
            dispensedBy: hospital.email,
        });

        // 2. Create Medical Record for history
        await MedicalRecord.create({
            userId,
            hospitalId: hospital.userId,
            prescribedBy: hospital.email, // In pharmacy case, it's dispensed by
            medicines: [{
                name,
                dosage,
                frequency: time,
                instructions,
                status: 'Dispensed'
            }]
        });

        return NextResponse.json({
            success: true,
            medicine,
            message: 'Medicine dispensed and recorded successfully'
        });

    } catch (error: any) {
        console.error('Dispense Error:', error);
        return NextResponse.json({ error: 'Failed to dispense medicine' }, { status: 500 });
    }
}

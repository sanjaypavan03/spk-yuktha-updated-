import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/lib/auth';

/**
 * GET /api/receptionist/patients
 * List all patients registered to the receptionist's hospital
 */
export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);
        
        if (!authUser || authUser.role !== 'receptionist') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const hospitalId = authUser.hospitalId;

        if (!hospitalId) {
            return NextResponse.json({ error: 'Hospital ID not found' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q') || '';

        const filter: any = { hospitalId: hospitalId };
        
        if (q) {
            filter.$or = [
                { name:  { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
                { phone: { $regex: q, $options: 'i' } },
            ];
        }

        const patients = await User.find(filter)
            .select('name email phone firstName lastName createdAt dateOfBirth qrCode')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ success: true, data: patients });

    } catch (error: any) {
        console.error('Fetch Receptionist Patients Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

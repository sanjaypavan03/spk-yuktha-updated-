import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Doctor from '@/models/Doctor';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);

        if (!authUser || authUser.role !== 'doctor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const doctor = await Doctor.findById(authUser.userId).populate('hospitalId', 'name');
        if (!doctor) {
            return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            user: {
                id: doctor._id,
                email: doctor.email,
                name: doctor.name,
                specialty: doctor.specialty,
                hospitalId: doctor.hospitalId?._id || null,
                hospitalName: doctor.hospitalId?.name || null,
                role: 'doctor'
            }
        });

    } catch (error) {
        console.error('Doctor me error:', error);
        return NextResponse.json({ error: 'Failed to fetch doctor profile' }, { status: 500 });
    }
}

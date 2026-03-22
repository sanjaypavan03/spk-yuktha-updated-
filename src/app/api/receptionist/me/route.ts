import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Receptionist from '@/models/Receptionist';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);

        if (!authUser || authUser.role !== 'receptionist') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const receptionist = await Receptionist.findById(authUser.userId).populate('hospitalId', 'name plan');
        if (!receptionist) {
            return NextResponse.json({ error: 'Receptionist not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            user: {
                id: receptionist._id,
                email: receptionist.email,
                name: receptionist.name,
                phone: receptionist.phone,
                hospitalId: receptionist.hospitalId?._id,
                hospitalName: (receptionist.hospitalId as any)?.name,
                role: 'receptionist'
            }
        });

    } catch (error) {
        console.error('Receptionist me error:', error);
        return NextResponse.json({ error: 'Failed to fetch receptionist profile' }, { status: 500 });
    }
}

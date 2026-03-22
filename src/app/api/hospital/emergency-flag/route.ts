import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import EmergencyFlag from '@/models/EmergencyFlag';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);
        
        if (!authUser || (authUser.role !== 'hospital' && authUser.role !== 'receptionist')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { patientId, reason } = body;

        if (!patientId || !reason) {
            return NextResponse.json({ error: 'patientId and reason are required' }, { status: 400 });
        }

        const flag = await EmergencyFlag.create({
            patientId,
            hospitalId: authUser.userId,
            reason,
            flaggedAt: new Date(),
            resolved: false
        });

        return NextResponse.json({ success: true, flag });

    } catch (error: any) {
        console.error('Create Emergency Flag Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);
        
        if (!authUser || (authUser.role !== 'hospital' && authUser.role !== 'receptionist')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const resolved = searchParams.get('resolved') === 'true';

        const flags = await EmergencyFlag.find({ 
            hospitalId: authUser.userId,
            resolved 
        })
        .populate('patientId', 'name firstName lastName')
        .sort({ flaggedAt: -1 });

        return NextResponse.json({ success: true, flags });

    } catch (error: any) {
        console.error('Fetch Emergency Flags Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);
        
        if (!authUser || (authUser.role !== 'hospital' && authUser.role !== 'receptionist')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'Flag ID is required' }, { status: 400 });
        }

        const flag = await EmergencyFlag.findOneAndUpdate(
            { _id: id, hospitalId: authUser.userId },
            { $set: { resolved: true, resolvedAt: new Date() } },
            { new: true }
        );

        if (!flag) {
            return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, flag });

    } catch (error: any) {
        console.error('Resolve Emergency Flag Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

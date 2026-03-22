import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ClinicalNote from '@/models/ClinicalNote';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);
        
        if (!authUser || authUser.role !== 'user') {
            return NextResponse.json({ error: 'Unauthorized: Patient access required' }, { status: 401 });
        }

        const notes = await ClinicalNote.find({ 
            patientId: authUser.userId,
            isVisibleToPatient: true
        })
        .populate('doctorId', 'name specialty')
        .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, notes });

    } catch (error: any) {
        console.error('Fetch Patient Clinical Notes Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

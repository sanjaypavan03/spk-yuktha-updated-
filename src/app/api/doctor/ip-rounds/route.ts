import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import IPAdmission from '@/models/IPAdmission';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);
        
        if (!authUser || authUser.role !== 'doctor') {
            return NextResponse.json({ error: 'Unauthorized: Doctor access required' }, { status: 401 });
        }

        const admissions = await IPAdmission.find({ 
            doctorId: authUser.userId, 
            status: 'admitted' 
        })
        .populate('patientId', 'name email firstName lastName phone')
        .populate('hospitalId', 'name')
        .sort({ admissionDate: 1 });

        const rounds = admissions.map(a => {
            const admission = a.toObject();
            const daysAdmitted = Math.floor((Date.now() - new Date(admission.admissionDate).getTime()) / 86400000);
            return {
                ...admission,
                daysAdmitted
            };
        });

        return NextResponse.json({ success: true, rounds });

    } catch (error: any) {
        console.error('Fetch Doctor IP Rounds Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);
        
        if (!authUser || authUser.role !== 'doctor') {
            return NextResponse.json({ error: 'Unauthorized: Doctor access required' }, { status: 401 });
        }

        const body = await request.json();
        const { admissionId, note } = body;

        if (!admissionId || !note) {
            return NextResponse.json({ error: 'admissionId and note are required' }, { status: 400 });
        }

        const admission = await IPAdmission.findOne({ 
            _id: admissionId,
            doctorId: authUser.userId 
        });

        if (!admission) {
            return NextResponse.json({ error: 'Admission not found or not assigned to you' }, { status: 404 });
        }

        admission.progressNotes.push({
            note,
            addedBy: authUser.name || 'Doctor',
            addedAt: new Date()
        });

        await admission.save();

        return NextResponse.json({ success: true, message: 'Progress note added' });

    } catch (error: any) {
        console.error('Add IP Round Note Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

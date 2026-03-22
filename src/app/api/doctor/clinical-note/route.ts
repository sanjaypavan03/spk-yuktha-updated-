import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ClinicalNote from '@/models/ClinicalNote';
import Doctor from '@/models/Doctor';
import Appointment from '@/models/Appointment';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);
        
        if (!authUser || authUser.role !== 'doctor') {
            return NextResponse.json({ error: 'Unauthorized: Doctor access required' }, { status: 401 });
        }

        const body = await request.json();
        const { patientId, content, noteType = 'general', isVisibleToPatient = false, appointmentId } = body;

        if (!patientId || !content) {
            return NextResponse.json({ error: 'patientId and content are required' }, { status: 400 });
        }

        // Get doctor's metadata (hospitalId)
        const doc = await Doctor.findById(authUser.userId);
        if (!doc) {
            return NextResponse.json({ error: 'Doctor record not found' }, { status: 404 });
        }

        const note = await ClinicalNote.create({
            patientId,
            doctorId: authUser.userId,
            hospitalId: doc.hospitalId,
            noteType,
            content,
            isVisibleToPatient,
            appointmentId: appointmentId || undefined
        });

        return NextResponse.json({ success: true, note });

    } catch (error: any) {
        console.error('Create Clinical Note Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);
        
        if (!authUser || authUser.role !== 'doctor') {
            return NextResponse.json({ error: 'Unauthorized: Doctor access required' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const patientId = searchParams.get('patientId');

        if (!patientId) {
            return NextResponse.json({ error: 'patientId query parameter is required' }, { status: 400 });
        }

        // Verify clinical relationship (Appointment check)
        const hasRelationship = await Appointment.findOne({ 
            doctorId: authUser.userId, 
            patientId: patientId 
        });

        if (!hasRelationship) {
            return NextResponse.json({ error: 'Forbidden: No clinical relationship verified' }, { status: 403 });
        }

        const notes = await ClinicalNote.find({ 
            doctorId: authUser.userId, 
            patientId: patientId 
        }).sort({ createdAt: -1 });

        return NextResponse.json({ success: true, notes });

    } catch (error: any) {
        console.error('Fetch Doctor Clinical Notes Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

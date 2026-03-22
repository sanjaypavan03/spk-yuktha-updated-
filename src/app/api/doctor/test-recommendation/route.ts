import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TestRecommendation from '@/models/TestRecommendation';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser || authUser.role !== 'doctor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { patientId, testName, urgency, notes } = body;

        if (!patientId || !testName) {
            return NextResponse.json({ error: 'Patient ID and Test Name are required' }, { status: 400 });
        }

        await dbConnect();
        
        // Fetch doctor to get hospitalId
        const Doctor = (await import('@/models/Doctor')).default;
        const doctor = await Doctor.findById(authUser.userId);
        if (!doctor) {
            return NextResponse.json({ error: 'Doctor record not found' }, { status: 404 });
        }

        const recommendation = await TestRecommendation.create({
            patientId,
            doctorId: authUser.userId,
            hospitalId: doctor.hospitalId,
            testName,
            urgency,
            notes,
            status: 'pending'
        });

        return NextResponse.json({ success: true, recommendation });
    } catch (error) {
        console.error('Create Test Recommendation Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    // This GET can be used by both patients (via patient version) and doctors (to see history)
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser || (authUser.role !== 'doctor' && authUser.role !== 'user')) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const patientId = searchParams.get('patientId');

        await dbConnect();
        
        const filter: any = {};
        if (authUser.role === 'user') filter.patientId = authUser.userId;
        else if (patientId) filter.patientId = patientId;
        else filter.doctorId = authUser.userId;

        const recommendations = await TestRecommendation.find(filter)
            .populate('doctorId', 'name specialty')
            .populate('hospitalId', 'name')
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, recommendations });
    } catch (error) {
        console.error('Fetch Test Recommendations Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

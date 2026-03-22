import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import IPAdmission from '@/models/IPAdmission';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import { getAuthenticatedUser } from '@/lib/auth';
import { planGate } from '@/lib/plan-gate';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);
        
        if (!authUser || (authUser.role !== 'hospital' && authUser.role !== 'receptionist')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const ipGate = planGate(authUser.hospitalPlan, 'ipAdmissions');
        if (ipGate) return ipGate;

        const body = await request.json();
        const { patientId, doctorId, ward, bedNumber, admissionReason, admissionDate } = body;

        // Validation
        if (!patientId || !doctorId || !ward || !bedNumber || !admissionReason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify patient exists
        const patient = await User.findById(patientId);
        if (!patient) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }

        // Verify doctor belongs to this hospital
        const targetHospitalId = authUser.role === 'hospital' ? authUser.userId : authUser.hospitalId;
        const doctor = await Doctor.findOne({ _id: doctorId, hospitalId: targetHospitalId });
        if (!doctor) {
            return NextResponse.json({ error: 'Doctor not found or does not belong to this hospital' }, { status: 400 });
        }

        const admission = await IPAdmission.create({
            patientId,
            hospitalId: targetHospitalId,
            doctorId,
            ward,
            bedNumber,
            admissionReason,
            admissionDate: admissionDate || new Date(),
            status: 'admitted'
        });

        return NextResponse.json({ success: true, admission });

    } catch (error: any) {
        console.error('Create IP Admission Error:', error);
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
        const status = searchParams.get('status') || 'admitted';

        const admissions = await IPAdmission.find({ 
            hospitalId: authUser.role === 'receptionist' ? authUser.hospitalId : authUser.userId,
            status 
        })
        .populate('patientId', 'name email firstName lastName phone')
        .populate('doctorId', 'name specialty')
        .sort({ admissionDate: -1 });

        return NextResponse.json({ success: true, admissions });

    } catch (error: any) {
        console.error('Fetch Hospital IP Admissions Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

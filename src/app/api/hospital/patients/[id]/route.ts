import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import MedicalInfo from '@/models/MedicalInfo';
import { getAuthenticatedUser } from '@/lib/auth';

/**
 * GET /api/hospital/patients/[id]
 * Get detailed patient info, verified by hospital ownership
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);
        
        if (!authUser || (authUser.role !== 'hospital' && authUser.role !== 'receptionist')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const hospitalId = authUser.role === 'hospital' ? authUser.userId : authUser.hospitalId;

        // Verify patient ownership
        const patient = await User.findOne({ _id: id, hospitalId: hospitalId })
            .select('-password');
            
        if (!patient) {
            return NextResponse.json({ error: 'Patient not found or belongs to another hospital' }, { status: 404 });
        }

        // Fetch medical info too
        const medicalInfo = await MedicalInfo.findOne({ userId: id });

        return NextResponse.json({ 
            success: true, 
            patient,
            medicalInfo 
        });

    } catch (error: any) {
        console.error('Fetch Patient Detail Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

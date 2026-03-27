import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);
        
        if (!authUser || (authUser.role !== 'hospital' && authUser.role !== 'receptionist')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const hospitalId = authUser.role === 'hospital' ? authUser.userId : authUser.hospitalId;

        if (!hospitalId) {
            return NextResponse.json({ error: 'Hospital ID not found in session' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q');
        const phone = searchParams.get('phone');

        if (phone) {
            const patient = await User.findOne({ 
                phone: phone.trim(),
                hospitalId: hospitalId 
            })
                .select('_id name firstName lastName email phone dateOfBirth qrCode bloodGroup');
            
            if (!patient) {
                return NextResponse.json({ error: 'Patient not found or belongs to another hospital' }, { status: 404 });
            }

            return NextResponse.json({ success: true, patient });
        }

        if (!q || q.length < 2) {
            return NextResponse.json({ error: 'Search query must be at least 2 characters' }, { status: 400 });
        }

        const patients = await User.find({
            hospitalId: hospitalId,
            $or: [
                { phone: { $regex: q, $options: 'i' } },
                { name: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } }
            ]
        })
        .select('_id name firstName lastName email phone dateOfBirth qrCode')
        .limit(10);

        return NextResponse.json({ success: true, patients });

    } catch (error: any) {
        console.error('Patient Search Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

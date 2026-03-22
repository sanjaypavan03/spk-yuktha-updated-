import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Hospital from '@/models/Hospital';
import { getPlanConfig } from '@/lib/plans';

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        console.log('🏥 Hospital Me: Authenticated user:', JSON.stringify(user, null, 2));

        if (!user || user.role !== 'hospital') {
            console.log('❌ Hospital Me: Unauthorized - user:', user);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        console.log('🏥 Hospital Me: Fetching hospital with ID:', user.userId);
        console.log('🏥 Hospital Me: ID type:', typeof user.userId);

        const hospital = await Hospital.findById(user.userId);
        console.log('🏥 Hospital Me: Query result:', hospital ? 'FOUND' : 'NOT FOUND');

        if (!hospital) {
            console.log('❌ Hospital Me: Hospital NOT FOUND in database for ID:', user.userId);
            // Try to find all hospitals to debug
            const allHospitals = await Hospital.find({}).limit(5);
            console.log('📋 Available hospital IDs:', allHospitals.map(h => h._id.toString()));
            return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
        }

        console.log('✅ Hospital Me: Found hospital:', hospital.name, 'ID:', hospital._id);
        return NextResponse.json({
            id: hospital._id,
            name: hospital.name,
            email: hospital.email,
            roles: hospital.roles,
            plan: hospital.plan || 'starter',
            maxDoctors: hospital.maxDoctors || 3,
            features: getPlanConfig(hospital.plan || 'starter').features,
            planActivatedAt: hospital.planActivatedAt,
            planExpiresAt: hospital.planExpiresAt,
        });

    } catch (error: any) {
        console.error('❌ Hospital Me Error:', error.message);
        console.error('Stack:', error.stack);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

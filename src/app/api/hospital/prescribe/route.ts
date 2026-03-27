import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Prescription from '@/models/Prescription';
import User from '@/models/User';
import Hospital from '@/models/Hospital';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        console.log('💊 Prescription Request Received');
        await dbConnect();

        // 1. Authentication Check
        const authUser = await getAuthenticatedUser(request);
        const role = authUser?.role;
        if (!authUser || (role !== 'hospital' && role !== 'doctor')) {
            console.warn('❌ Unauthorized prescription attempt');
            return NextResponse.json({ error: 'Unauthorized: Hospital or Doctor access required' }, { status: 401 });
        }

        let resolvedHospitalId = '';
        let resolvedDoctorId = undefined;
        let resolvedDoctorName = 'Hospital Staff';

        if (role === 'hospital') {
            resolvedHospitalId = authUser.userId;
        } else if (role === 'doctor') {
            const Doctor = (await import('@/models/Doctor')).default;
            const doctor = await Doctor.findById(authUser.userId);
            if (!doctor) {
                return NextResponse.json({ error: 'Doctor record not found' }, { status: 404 });
            }
            resolvedHospitalId = doctor.hospitalId.toString();
            resolvedDoctorId = authUser.userId;
            resolvedDoctorName = doctor.name;
        }

        console.log('🏥 Resolved Hospital ID:', resolvedHospitalId);
        if (resolvedDoctorId) console.log('🩺 Resolved Doctor ID:', resolvedDoctorId);

        // 2. Body Validation
        let body;
        try {
            body = await request.json();
        } catch (e) {
            console.error('❌ Failed to parse body');
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        console.log('📝 Request Body:', JSON.stringify(body, null, 2));

        const { userId, medicines, instructions } = body;

        if (!userId || !medicines || !Array.isArray(medicines) || medicines.length === 0) {
            console.error('❌ Missing or invalid medicines array');
            return NextResponse.json({
                error: 'Missing required fields: userId and medicines array'
            }, { status: 400 });
        }

        // 3. Patient Lookup
        console.log('🔍 verifying patient:', userId);
        let patient;
        try {
            patient = await User.findById(userId);
        } catch (err) {
            console.error('❌ Invalid User ID format:', err);
            return NextResponse.json({ error: 'Invalid Patient ID' }, { status: 400 });
        }

        if (!patient) {
            console.error('❌ Patient not found in DB');
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }
        console.log('✅ Patient found:', patient.name);

        // 4. Create Prescription
        const prescriptionData = {
            patientId: userId,
            hospitalId: resolvedHospitalId,
            doctorId: resolvedDoctorId,
            doctorName: resolvedDoctorName,
            medicines: medicines.map(m => ({
                name: m.name,
                dosage: m.dosage,
                frequency: m.frequency,
                duration: m.duration || 7,
                route: m.route || 'Oral'
            })),
            instructions: instructions || '',
            creatorEmail: authUser.email
        };

        console.log('💾 Saving Prescription:', prescriptionData);

        const newPrescription = await Prescription.create(prescriptionData);

        console.log('✅ Prescription Saved! ID:', newPrescription._id);

        // 5. Generate Pill Tracking Schedule
        try {
            const frequencyMap: Record<string, string[]> = {
                OD: ['08:00'],
                BD: ['08:00', '20:00'],
                TDS: ['08:00', '14:00', '20:00'],
                QID: ['07:00', '12:00', '17:00', '21:00'],
            };

            const pillEntries: any[] = [];
            
            // Get "today" in IST correctly
            const now = new Date();
            const istOffset = 330 * 60 * 1000;
            const istNow = new Date(now.getTime() + istOffset);
            
            for (const med of newPrescription.medicines) {
                const times = frequencyMap[med.frequency.toUpperCase()] || ['08:00'];
                const days = med.duration || 7;

                for (let day = 0; day < days; day++) {
                    const date = new Date(istNow);
                    date.setDate(date.getDate() + day);
                    const dateStr = date.toISOString().split('T')[0];

                    for (const time of times) {
                        pillEntries.push({
                            patientId: userId,
                            prescriptionId: newPrescription._id,
                            medicineName: med.name,
                            dosage: med.dosage,
                            scheduledTime: time,
                            date: dateStr,
                            status: 'pending',
                            tzOffset: 330,
                        });
                    }
                }
            }

            // Lazy import to avoid circular dependency issues
            const PillTracking = (await import('@/models/PillTracking')).default;
            await PillTracking.insertMany(pillEntries);
            console.log(`✅ Generated ${pillEntries.length} pill tracking entries for multi-medicine prescription`);

        } catch (genError) {
            console.error('⚠️ Failed to generate pill tracking entries:', genError);
        }

        return NextResponse.json({
            success: true,
            message: 'Prescription issued successfully',
            prescription: newPrescription
        }, { status: 200 });

    } catch (error: any) {
        console.error('🔥 Prescription API CRASH:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);
        if (!authUser || (authUser.role !== 'hospital' && authUser.role !== 'doctor')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const prescriptions = await Prescription.find({ patientId: userId }).sort({ issuedAt: -1 });
        return NextResponse.json({ success: true, prescriptions });
    } catch (error) {
        console.error('Fetch Prescriptions Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

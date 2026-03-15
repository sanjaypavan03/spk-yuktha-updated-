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
        if (!authUser || authUser.role !== 'hospital') {
            console.warn('❌ Unauthorized prescription attempt');
            return NextResponse.json({ error: 'Unauthorized: Hospital access required' }, { status: 401 });
        }

        const hospitalId = authUser.userId;
        console.log('🏥 Hospital ID from JWT:', hospitalId);

        // 2. Body Validation
        let body;
        try {
            body = await request.json();
        } catch (e) {
            console.error('❌ Failed to parse body');
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        console.log('📝 Request Body:', JSON.stringify(body, null, 2));

        const { userId, name, dosage, time, instructions, route } = body;

        // Map frontend fields (medForm) to schema fields
        // Frontend: userId, name, dosage, time, instructions, route
        // Schema: patientId, medicineName, dosage, frequency, instructions, route

        if (!userId || !name || !dosage || !time) {
            console.error('❌ Missing required fields');
            return NextResponse.json({
                error: 'Missing required fields: userId, name, dosage, or time'
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
            hospitalId: hospitalId,
            medicineName: name,
            dosage: dosage,
            frequency: time, // mapped from 'time'
            instructions: instructions || '',
            route: route || 'Oral',
            creatorEmail: authUser.email
        };

        console.log('💾 Saving Prescription:', prescriptionData);

        const newPrescription = await Prescription.create(prescriptionData);

        console.log('✅ Prescription Saved! ID:', newPrescription._id);

        // 5. Generate Pill Tracking Schedule (7 Days)
        try {
            const frequency = prescriptionData.frequency.toLowerCase();
            let timeSlots = ["09:00 AM"]; // Default

            if (frequency.includes('twice') || frequency.includes('bd') || frequency.includes('bid') || frequency.includes('2 times')) {
                timeSlots = ["09:00 AM", "09:00 PM"];
            } else if (frequency.includes('thrice') || frequency.includes('tds') || frequency.includes('tid') || frequency.includes('3 times')) {
                timeSlots = ["09:00 AM", "02:00 PM", "09:00 PM"];
            } else if (frequency.includes('four') || frequency.includes('qid') || frequency.includes('4 times')) {
                timeSlots = ["09:00 AM", "01:00 PM", "05:00 PM", "09:00 PM"];
            }

            const pillEntries: any[] = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Generate for 7 days
            for (let i = 0; i < 7; i++) {
                const currentDate = new Date(today);
                currentDate.setDate(today.getDate() + i);

                timeSlots.forEach(time => {
                    pillEntries.push({
                        patientId: userId,
                        prescriptionId: newPrescription._id,
                        medicineName: prescriptionData.medicineName,
                        dosage: prescriptionData.dosage,
                        scheduledTime: time,
                        date: currentDate,
                        taken: false
                    });
                });
            }

            // Lazy import to avoid circular dependency issues if any
            const PillTracking = (await import('@/models/PillTracking')).default;
            await PillTracking.insertMany(pillEntries);
            console.log(`✅ Generated ${pillEntries.length} pill tracking entries for 7 days`);

        } catch (genError) {
            console.error('⚠️ Failed to generate pill tracking entries:', genError);
            // Non-blocking error, prescription is valid
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

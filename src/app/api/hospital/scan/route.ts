import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import MedicalInfo from '@/models/MedicalInfo';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);
        // Only hospital, doctor, or receptionist can view Tier 2 data
        if (!authUser || (authUser.role !== 'hospital' && authUser.role !== 'doctor' && authUser.role !== 'receptionist')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await dbConnect();
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ error: 'QR Token is required' }, { status: 400 });
        }

        // Use EmergencyToken model to verify the QR code
        const EmergencyToken = (await import('@/models/EmergencyToken')).default;
        const emergencyToken = await EmergencyToken.findOne({ token, isActive: true });

        if (!emergencyToken) {
            // Log failed scan attempt
            try {
                const QRScanLog = (await import('@/models/QRScanLog')).default;
                await QRScanLog.create({
                    scannedBy: authUser.userId,
                    scannerRole: authUser.role,
                    hospitalId: authUser.role === 'hospital' ? authUser.userId : authUser.hospitalId,
                    patientId: null,
                    token,
                    tier: 2,
                    ipAddress: request.headers.get('x-forwarded-for') || '',
                    userAgent: request.headers.get('user-agent') || '',
                    accessGranted: false,
                    failReason: 'token_not_found',
                });
            } catch (logError) {
                console.error('Failed to log failed scan attempt:', logError);
            }
            return NextResponse.json({ error: 'Invalid or expired QR Code' }, { status: 404 });
        }

        // Log successful scan
        try {
            const QRScanLog = (await import('@/models/QRScanLog')).default;
            await QRScanLog.create({
                scannedBy: authUser.userId,
                scannerRole: authUser.role,
                hospitalId: authUser.role === 'hospital' ? authUser.userId : authUser.hospitalId,
                patientId: emergencyToken.patientId,
                token,
                tier: 2,
                ipAddress: request.headers.get('x-forwarded-for') || '',
                userAgent: request.headers.get('user-agent') || '',
                accessGranted: true,
            });
        } catch (logError) {
            console.error('Failed to log successful scan attempt:', logError);
        }

        const user = await User.findById(emergencyToken.patientId);

        // Fetch Medical Info
        const medicalInfo = await MedicalInfo.findOne({ userId: user._id });

        if (!medicalInfo) {
            return NextResponse.json({ error: 'Medical records not found' }, { status: 404 });
        }

        // Return Tier 1 + Tier 2
        return NextResponse.json({
            success: true,
            patient: {
                // Base
                id: user._id,
                email: user.email,
                name: medicalInfo.fullLegalName || `${user.firstName} ${user.lastName}`,
                phone: (user as any).phone || '', // Assuming phone added securely

                // Tier 1
                displayNamePreference: medicalInfo.displayNamePreference,
                birthYear: medicalInfo.birthYear,
                bloodGroup: medicalInfo.bloodGroup,
                knownAllergies: medicalInfo.knownAllergies,
                allergiesDetails: medicalInfo.allergiesDetails,
                chronicConditions: medicalInfo.chronicConditions,
                currentMedications: medicalInfo.currentMedications,
                emergencyContact1Name: medicalInfo.emergencyContact1Name,
                emergencyContact1Phone: medicalInfo.emergencyContact1Phone,
                emergencyContact1Relation: medicalInfo.emergencyContact1Relation,
                hasPacemakerOrImplant: medicalInfo.hasPacemakerOrImplant,
                isPregnant: medicalInfo.isPregnant,

                // Tier 2
                fullLegalName: medicalInfo.fullLegalName,
                dob: medicalInfo.dob,
                emergencyContact2Name: medicalInfo.emergencyContact2Name,
                emergencyContact2Phone: medicalInfo.emergencyContact2Phone,
                emergencyContact2Relation: medicalInfo.emergencyContact2Relation,
                primaryDoctorOrHospital: medicalInfo.primaryDoctorOrHospital,
                height: medicalInfo.height,
                weight: medicalInfo.weight,
                smokingStatus: medicalInfo.smokingStatus,
                alcoholUse: medicalInfo.alcoholUse,
                physicalActivityLevel: medicalInfo.physicalActivityLevel,
                pastSurgeries: medicalInfo.pastSurgeries,
                pastHospitalisations: medicalInfo.pastHospitalisations,
                familyMedicalHistory: medicalInfo.familyMedicalHistory,
                implantDetails: medicalInfo.implantDetails,
                insuranceProvider: medicalInfo.insuranceProvider,
                insurancePolicyNumber: medicalInfo.insurancePolicyNumber,
                isBloodDonor: medicalInfo.isBloodDonor,
                organDonorPreference: medicalInfo.organDonorPreference,
                dnrPreference: medicalInfo.dnrPreference,
                additionalNotes: medicalInfo.additionalNotes,

                // Clinical (Doctor fills)
                bpReading: medicalInfo.bpReading,
                fastingBloodSugar: medicalInfo.fastingBloodSugar,
                bmi: medicalInfo.bmi,
                conditionControlLevel: medicalInfo.conditionControlLevel,
                lastClinicalVisitDate: medicalInfo.lastClinicalVisitDate,
            }
        });

    } catch (error: any) {
        console.error('Scan Error:', error);
        return NextResponse.json({ error: 'Failed to process scan' }, { status: 500 });
    }
}

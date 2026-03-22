import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Prescription from '@/models/Prescription';
import Appointment from '@/models/Appointment';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser || authUser.role !== 'doctor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const doctorId = authUser.userId;

        const prescriptions = await Prescription.find({ doctorId }).populate('patientId', 'name email firstName lastName');
        const appointments = await Appointment.find({ doctorId }).populate('patientId', 'name email firstName lastName');

        const patientMap = new Map();

        const addPatient = (patient: any, date: Date, type: 'prescription' | 'appointment') => {
            if (!patient) return;
            const pid = patient._id.toString();

            if (!patientMap.has(pid)) {
                patientMap.set(pid, {
                    id: pid,
                    name: patient.name || `${patient.firstName} ${patient.lastName}`,
                    email: patient.email,
                    lastVisitDate: date,
                    prescriptionCount: 0,
                    prescriptions: []
                });
            }

            const pData = patientMap.get(pid);
            if (new Date(date) > new Date(pData.lastVisitDate)) {
                pData.lastVisitDate = date;
            }
        };

        prescriptions.forEach(p => {
            addPatient(p.patientId, p.createdAt, 'prescription');
            const pData = patientMap.get(p.patientId?._id?.toString());
            if (pData) {
                pData.prescriptionCount++;
                pData.prescriptions.push(p);
            }
        });

        appointments.forEach(a => {
            addPatient(a.patientId, a.date, 'appointment');
        });

        // 2. Fetch MedicalInfo for all found patients to get controlLevel
        const patientIds = Array.from(patientMap.keys());
        const MedicalInfo = (await import('@/models/MedicalInfo')).default;
        const medicalInfos = await MedicalInfo.find({ userId: { $in: patientIds } });
        
        medicalInfos.forEach(info => {
            const pData = patientMap.get(info.userId.toString());
            if (pData) {
                pData.conditionControlLevel = info.conditionControlLevel || 'Stable';
            }
        });

        const patients = Array.from(patientMap.values()).sort((a, b) =>
            new Date(b.lastVisitDate).getTime() - new Date(a.lastVisitDate).getTime()
        );

        return NextResponse.json({ success: true, patients });
    } catch (error) {
        console.error('Doctor Patients Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

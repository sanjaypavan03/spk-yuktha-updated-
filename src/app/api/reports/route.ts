import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { planGate } from '@/lib/plan-gate';
import dbConnect from '@/lib/db';
import { getReportModel } from '@/models/Report';
import Appointment from '@/models/Appointment';
import Notification from '@/models/Notification';
import User from '@/models/User';

export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const memberId = searchParams.get('memberId');

        const Report = await getReportModel();
        const query: any = { userId: authUser.userId };
        if (memberId) query.memberId = memberId;

        const reports = await Report.find(query).sort({ createdAt: -1 });

        return NextResponse.json({ reports });
    } catch (error) {
        console.error('GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (authUser.role === 'hospital') {
            const vaultGate = planGate(authUser.hospitalPlan, 'vault');
            if (vaultGate) return vaultGate;
        }

        const body = await request.json();
        const Report = await getReportModel();

        // If hospital is uploading for a patient, use the provided userId
        let targetUserId = authUser.userId;
        if (authUser.role === 'hospital' && body.userId) {
            targetUserId = body.userId;
        }

        const newReport = await Report.create({
            userId: targetUserId,
            ...body
        });

        // Trigger Notification for Doctor if there's an upcoming appointment OR active IP admission
        try {
            await dbConnect();
            
            // 1. Check upcoming appointment
            const upcoming = await Appointment.findOne({
                patientId: targetUserId,
                status: 'booked',
                date: { $gte: new Date() }
            }).sort({ date: 1 }).populate('patientId', 'name');
            
            let notifiedDoctorId = upcoming?.doctorId;
            let contextMessage = upcoming ? ('before your appointment on ' + new Date(upcoming.date).toLocaleDateString('en-IN')) : '';

            // 2. If no upcoming appt, check active IP admission
            if (!notifiedDoctorId) {
                const IPAdmission = (await import('@/models/IPAdmission')).default;
                const activeIP = await IPAdmission.findOne({
                    patientId: targetUserId,
                    status: 'admitted'
                }).populate('patientId', 'name');

                if (activeIP) {
                    notifiedDoctorId = activeIP.doctorId;
                    contextMessage = '(Inpatient monitored by you)';
                }
            }
            
            if (notifiedDoctorId) {
                const patientName = body.patientName || 'A patient';
                await Notification.create({
                    recipientId: notifiedDoctorId.toString(),
                    recipientRole: 'doctor',
                    type: 'report_upload',
                    title: 'New lab report uploaded',
                    message: `${patientName} has a new lab report available ${contextMessage}`,
                    relatedId: targetUserId.toString(),
                    isRead: false
                });
            }
        } catch (notifErr) {
            console.error('Notification creation failed (non-blocking):', notifErr);
        }

        return NextResponse.json({ report: newReport }, { status: 201 });
    } catch (error) {
        console.error('POST Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        const Report = await getReportModel();
        await Report.deleteOne({ _id: id, userId: authUser.userId });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

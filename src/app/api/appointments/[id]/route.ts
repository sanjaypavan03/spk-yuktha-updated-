import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Appointment from '@/models/Appointment';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser || (authUser.role !== 'hospital' && authUser.role !== 'doctor')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const resolvedParams = await params;
        const appointmentId = resolvedParams.id;
        const body = await request.json();
        const { status, notes } = body;

        const appointment = await Appointment.findById(appointmentId)
            .populate('patientId')
            .populate('hospitalId');

        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        // Optional: check if doctor or hospital owns this appointment
        if (authUser.role === 'hospital' && appointment.hospitalId._id.toString() !== authUser.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (authUser.role === 'doctor' && appointment.doctorId?.toString() !== authUser.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (status) appointment.status = status;
        if (notes !== undefined) appointment.notes = notes;

        await appointment.save();

        if (status === 'completed') {
            const patientPhone = appointment.patientId?.phone || appointment.patientId?.email;
            const hospitalName = appointment.hospitalId?.name;
            console.log('📱 WHATSAPP REMINDER:', patientPhone, 'Appointment complete at', hospitalName);
        }

        return NextResponse.json({ success: true, appointment });
    } catch (error) {
        console.error('Update Appointment Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

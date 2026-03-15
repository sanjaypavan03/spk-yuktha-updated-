import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Appointment from '@/models/Appointment';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser || authUser.role !== 'user') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await request.json();
        const { hospitalId, doctorId, date, timeSlot, reason } = body;

        // Check slot not already taken
        const existingAppointment = await Appointment.findOne({
            hospitalId,
            date: new Date(date),
            timeSlot,
            status: { $ne: 'cancelled' },
        });

        if (existingAppointment) {
            return NextResponse.json({ error: 'Slot already booked' }, { status: 409 });
        }

        const appointment = await Appointment.create({
            patientId: authUser.userId,
            hospitalId,
            doctorId,
            date: new Date(date),
            timeSlot,
            reason,
        });

        return NextResponse.json({ success: true, appointment });
    } catch (error) {
        console.error('Create Appointment Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');

        if (authUser.role === 'user') {
            const appointments = await Appointment.find({ patientId: authUser.userId })
                .populate('hospitalId', 'name')
                .populate('doctorId', 'name specialty')
                .sort({ date: -1, timeSlot: -1 });
            return NextResponse.json({ success: true, appointments });
        }

        if (authUser.role === 'hospital') {
            let query: any = { hospitalId: authUser.userId };
            if (dateParam) {
                if (dateParam === 'today') {
                    const today = new Date();
                    query.date = {
                        $gte: new Date(today.setHours(0, 0, 0, 0)),
                        $lte: new Date(today.setHours(23, 59, 59, 999))
                    };
                } else {
                    query.date = new Date(dateParam);
                }
            }

            const appointments = await Appointment.find(query)
                .populate('patientId', 'name email firstName lastName')
                .populate('doctorId', 'name specialty')
                .sort({ date: 1, timeSlot: 1 });
            return NextResponse.json({ success: true, appointments });
        }

        if (authUser.role === 'doctor') {
            let query: any = { doctorId: authUser.userId };
            if (dateParam) {
                if (dateParam === 'today') {
                    const today = new Date();
                    query.date = {
                        $gte: new Date(today.setHours(0, 0, 0, 0)),
                        $lte: new Date(today.setHours(23, 59, 59, 999))
                    };
                } else {
                    query.date = new Date(dateParam);
                }
            }

            const appointments = await Appointment.find(query)
                .populate('patientId', 'name firstName lastName')
                .sort({ date: 1, timeSlot: 1 });
            return NextResponse.json({ success: true, appointments });
        }

        return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
    } catch (error) {
        console.error('Get Appointments Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

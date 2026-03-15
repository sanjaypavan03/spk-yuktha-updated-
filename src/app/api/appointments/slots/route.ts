import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Appointment from '@/models/Appointment';

// Generate slots from 09:00 AM to 05:00 PM (16 slots)
function generateAllSlots(): string[] {
    const slots: string[] = [];
    const startHour = 9;
    const endHour = 17;

    for (let hour = startHour; hour < endHour; hour++) {
        const isPM = hour >= 12;
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const ampm = isPM ? 'PM' : 'AM';
        const hourStr = displayHour.toString().padStart(2, '0');

        slots.push(`${hourStr}:00 ${ampm}`);
        slots.push(`${hourStr}:30 ${ampm}`);
    }
    return slots;
}

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const hospitalId = searchParams.get('hospitalId');
        const dateParam = searchParams.get('date');

        if (!hospitalId || !dateParam) {
            return NextResponse.json({ error: 'hospitalId and date are required' }, { status: 400 });
        }

        // Find all appointments for this hospital and date that are NOT cancelled
        const startOfDay = new Date(dateParam);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateParam);
        endOfDay.setHours(23, 59, 59, 999);

        const bookedAppointments = await Appointment.find({
            hospitalId,
            date: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: 'cancelled' }
        });

        const bookedSlots = bookedAppointments.map(app => app.timeSlot);
        const allSlots = generateAllSlots();

        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

        return NextResponse.json({
            success: true,
            available: availableSlots,
            booked: bookedSlots
        });
    } catch (error) {
        console.error('Get Appointment Slots Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

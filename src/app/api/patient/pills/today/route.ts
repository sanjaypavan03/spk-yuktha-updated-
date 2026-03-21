import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PillTracking from '@/models/PillTracking';
import Medicine from '@/models/Medicine';
import Prescription from '@/models/Prescription'; // Register model for reference
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get pills for TODAY based on server time (UTC normalized to 00:00)
        // In a real app, we might want to respect user timezone passed in headers
        // For now, we assume matching Date objects set to midnight

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Also fetch for tomorrow just in case of timezone overlap locally, 
        // OR just strict Day matching. Let's do strict day matching on the Date object stored.

        let pills = await PillTracking.find({
            patientId: user.userId,
            date: today
        }).sort({ scheduledTime: 1 });

        // If no pills found for today, check for Medicine templates and generate them
        if (pills.length === 0) {
            const activeMeds = await Medicine.find({
                userId: user.userId,
                isActive: true
            });

            if (activeMeds.length > 0) {
                const mongoose = require('mongoose');
                const trackingEntries = [];

                for (const med of activeMeds) {
                    const times = med.times && med.times.length > 0 ? med.times : [med.time || '09:00 AM'];
                    
                    for (const scheduledTime of times) {
                        trackingEntries.push({
                            patientId: user.userId,
                            medicineName: med.name,
                            dosage: med.dosage,
                            scheduledTime,
                            date: today,
                            taken: false,
                            // Link to the medicine template
                            prescriptionId: med._id
                        });
                    }
                }

                if (trackingEntries.length > 0) {
                    await PillTracking.insertMany(trackingEntries);
                    // Re-fetch to get the new entries with IDs
                    pills = await PillTracking.find({
                        patientId: user.userId,
                        date: today
                    }).sort({ scheduledTime: 1 });
                }
            }
        }

        return NextResponse.json({ pills: pills });

    } catch (error: any) {
        console.error('Error fetching pills:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

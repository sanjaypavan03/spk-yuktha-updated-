/**
 * Medicines Routes
 * GET /api/medicines - Get all medicines for user
 * POST /api/medicines - Create new medicine
 * PATCH /api/medicines/[id] - Update medicine
 * DELETE /api/medicines/[id] - Delete medicine
 */

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import Medicine from '@/models/Medicine';
import PillTracking from '@/models/PillTracking';
import Prescription from '@/models/Prescription'; // Register model for reference
import { getAuthenticatedUser } from '@/lib/auth';

// GET - Fetch all medicines for authenticated user
export async function GET(request: NextRequest) {
  try {
    await db();

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const medicines = await Medicine.find({ userId: authUser.userId }).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        data: medicines,
        count: medicines.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get medicines error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medicines' },
      { status: 500 }
    );
  }
}

// POST - Create new medicine
export async function POST(request: NextRequest) {
  try {
    await db();

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, dosage, times, time, frequency, purpose, instructions, startDate, endDate, taken } = body;

    // Support both 'times' array and single 'time' string for backward compatibility during migration
    const finalTimes = Array.isArray(times) ? times : (time ? [time] : []);

    // Validation
    if (!name || !dosage || finalTimes.length === 0) {
      return NextResponse.json(
        { error: 'Medicine name, dosage, and at least one time are required' },
        { status: 400 }
      );
    }

    // Create medicine template
    const medicine = await Medicine.create({
      userId: authUser.userId,
      name,
      dosage,
      times: finalTimes,
      frequency: frequency || 'Once daily',
      purpose,
      instructions,
      taken: taken !== undefined ? taken : null,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
    });

    // AUTO-GENERATE PillTracking entries for TODAY
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const trackingPromises = finalTimes.map(scheduledTime => 
      PillTracking.create({
        patientId: authUser.userId,
        medicineName: name,
        dosage,
        scheduledTime,
        date: today,
        taken: false,
        // Link to the medicine template
        prescriptionId: medicine._id 
      })
    );

    await Promise.all(trackingPromises);

    return NextResponse.json(
      {
        success: true,
        data: medicine,
        message: 'Medicine added successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create medicine error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create medicine' },
      { status: 500 }
    );
  }
}

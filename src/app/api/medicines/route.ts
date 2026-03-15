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
import { getAuthenticatedUser } from '@/lib/auth';

// GET - Fetch all medicines for authenticated user
export async function GET(request: NextRequest) {
  try {
    await db;

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
    await db;

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, dosage, time, frequency, purpose, instructions, startDate, endDate, taken } = body;

    // Validation
    if (!name || !dosage || !time) {
      return NextResponse.json(
        { error: 'Medicine name, dosage, and time are required' },
        { status: 400 }
      );
    }

    // Create medicine
    const medicine = await Medicine.create({
      userId: authUser.userId,
      name,
      dosage,
      time,
      frequency: frequency || 'Once daily',
      purpose,
      instructions,
      taken: taken !== undefined ? taken : null,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        data: medicine,
        message: 'Medicine added successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create medicine error:', error);
    return NextResponse.json(
      { error: 'Failed to create medicine' },
      { status: 500 }
    );
  }
}

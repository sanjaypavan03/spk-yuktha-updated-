/**
 * Individual Medicine Routes
 * PATCH /api/medicines/[id] - Update medicine
 * DELETE /api/medicines/[id] - Delete medicine
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import db from '@/lib/db';
import Medicine from '@/models/Medicine';
import { getAuthenticatedUser } from '@/lib/auth';

// PATCH - Update a specific medicine
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await db;

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate ID format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid medicine ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Find medicine and verify ownership
    const medicine = await Medicine.findById(id);
    if (!medicine) {
      return NextResponse.json(
        { error: 'Medicine not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (medicine.userId.toString() !== authUser.userId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own medicines' },
        { status: 403 }
      );
    }

    // Update medicine
    const updatedMedicine = await Medicine.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    return NextResponse.json(
      {
        success: true,
        data: updatedMedicine,
        message: 'Medicine updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update medicine error:', error);
    return NextResponse.json(
      { error: 'Failed to update medicine' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific medicine
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await db;

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate ID format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid medicine ID' },
        { status: 400 }
      );
    }

    // Find medicine and verify ownership
    const medicine = await Medicine.findById(id);
    if (!medicine) {
      return NextResponse.json(
        { error: 'Medicine not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (medicine.userId.toString() !== authUser.userId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own medicines' },
        { status: 403 }
      );
    }

    // Delete medicine
    await Medicine.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: 'Medicine deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete medicine error:', error);
    return NextResponse.json(
      { error: 'Failed to delete medicine' },
      { status: 500 }
    );
  }
}

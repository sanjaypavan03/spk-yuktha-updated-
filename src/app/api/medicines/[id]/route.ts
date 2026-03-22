/**
 * Individual Medicine Routes
 * PATCH /api/medicines/[id] - Update medicine
 * DELETE /api/medicines/[id] - Delete medicine
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import db from '@/lib/db';
import Medicine from '@/models/Medicine';
import Prescription from '@/models/Prescription';
import PillTracking from '@/models/PillTracking';
import { getAuthenticatedUser } from '@/lib/auth';

// PATCH - Update a specific medicine
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await db();

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

    // Check both models for the ID
    let item = await Medicine.findById(id);
    if (!item) {
      item = await Prescription.findById(id);
    }

    if (!item) {
      return NextResponse.json(
        { error: 'Medication not found' },
        { status: 404 }
      );
    }

    // Check ownership (handle both userId and patientId)
    const ownerId = (item as any).userId || (item as any).patientId;
    if (ownerId.toString() !== authUser.userId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own medicines' },
        { status: 403 }
      );
    }

    // Update the item in the correct collection
    const Model = (item as any).userId ? Medicine : Prescription;
    const updatedItem = await Model.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    return NextResponse.json(
      {
        success: true,
        data: updatedItem,
        message: 'Medication updated successfully',
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
    console.log('🗑️ Delete medicine request received');
    const dbConn = await db();

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      console.log('❌ Delete failed: Unauthorized');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: rawId } = await params;
    const id = rawId.trim();
    console.log(`🗑️ Deleting medication ID: "${id}" for user: ${authUser.userId}`);

    // Validate ID format
    if (!id || !Types.ObjectId.isValid(id)) {
      console.log('❌ Delete failed: Invalid ID format');
      return NextResponse.json(
        { error: `Invalid medication ID format: ${id}` },
        { status: 400 }
      );
    }

    const objId = new Types.ObjectId(id);

    // Try finding in both collections (Medicine and Prescription)
    // Using both Model methods and direct DB queries for maximum reliability
    let medDoc = await Medicine.findById(id);
    let modelName = 'Medicine';
    
    if (!medDoc) {
      console.log(`ℹ️ Not found in Medicine model, checking Prescription model for ${id}`);
      medDoc = await Prescription.findById(id);
      modelName = 'Prescription';
    }

    // Direct collection fallback if models fail
    if (!medDoc) {
      console.log(`ℹ️ Not found in models, checking direct collections for ${id}`);
      const medicineCol = dbConn.connection.db!.collection('medicines');
      medDoc = await medicineCol.findOne({ _id: objId }) as any;
      modelName = 'Medicines Collection';
      
      if (!medDoc) {
          const prescriptionCol = dbConn.connection.db!.collection('prescriptions');
          medDoc = await prescriptionCol.findOne({ _id: objId }) as any;
          modelName = 'Prescriptions Collection';
      }
    }

    if (!medDoc) {
      console.log(`❌ Delete failed: Medication ${id} not found in any collection or model`);
      return NextResponse.json(
        { error: 'Medication not found in database. Please refresh the page.' },
        { status: 404 }
      );
    }

    // Check ownership - handle both userId (Medicine) and patientId (Prescription)
    const medicalOwnerId = (medDoc as any).userId || (medDoc as any).patientId;
    const medicineOwnerIdStr = medicalOwnerId?.toString();
    const currentUserIdStr = authUser.userId.toString();

    if (medicineOwnerIdStr !== currentUserIdStr) {
      console.log(`❌ Delete failed: Ownership mismatch. Owner: ${medicineOwnerIdStr}, Requester: ${currentUserIdStr}`);
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to delete this medication' },
        { status: 403 }
      );
    }

    // Delete associated PillTracking entries first
    const pillTrackingResult = await PillTracking.deleteMany({ prescriptionId: objId });
    console.log(`📉 Deleted ${pillTrackingResult.deletedCount} tracking records for medication ${id}`);

    // Delete from the correct collection using direct DB call for reliability
    if (modelName.includes('Medicine')) {
      await dbConn.connection.db!.collection('medicines').deleteOne({ _id: objId });
    } else {
      await dbConn.connection.db!.collection('prescriptions').deleteOne({ _id: objId });
    }
    
    console.log(`✅ Medication ${id} deleted successfully from ${modelName}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Medication and all tracking records deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Delete medication error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error while deleting medication' },
      { status: 500 }
    );
  }
}

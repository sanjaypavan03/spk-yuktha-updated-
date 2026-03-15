/**
 * Emergency Token Routes
 * POST /api/emergency-token - Create/store emergency token for user
 * GET /api/emergency-token - Get user's emergency token
 * DELETE /api/emergency-token - Delete/deactivate user's emergency token
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import EmergencyToken from '@/models/EmergencyToken';
import { getAuthenticatedUser } from '@/lib/auth';

// POST - Create or update emergency token
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate new secure token on server side
    const token = crypto.randomUUID();

    // Deactivate any existing active tokens for this user
    await EmergencyToken.updateMany(
      { userId: authUser.userId, isActive: true },
      { isActive: false }
    );

    // Create new token
    const emergencyToken = await EmergencyToken.create({
      token,
      userId: authUser.userId,
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        data: emergencyToken,
        message: 'Emergency token created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create emergency token error:', error);
    return NextResponse.json(
      { error: 'Failed to create emergency token' },
      { status: 500 }
    );
  }
}

// GET - Get user's active emergency token
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const emergencyToken = await EmergencyToken.findOne({
      userId: authUser.userId,
      isActive: true,
    }).sort({ createdAt: -1 });

    if (!emergencyToken) {
      return NextResponse.json(
        {
          success: true,
          data: null,
          message: 'No active emergency token found',
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: emergencyToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get emergency token error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emergency token' },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate user's emergency token
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await EmergencyToken.updateMany(
      { userId: authUser.userId, isActive: true },
      { isActive: false }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Emergency token deactivated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete emergency token error:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate emergency token' },
      { status: 500 }
    );
  }
}

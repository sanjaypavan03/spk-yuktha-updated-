/**
 * User Profile Route
 * GET /api/user/profile - Get current user's profile
 */

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/lib/auth';
import { getQRPublicUrl } from '@/lib/qr';

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

    // Fetch user profile
    const user = await User.findById(authUser.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get QR public URL if QR code exists
    const qrPublicUrl = user.qrCode ? getQRPublicUrl(user.qrCode) : null;

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          qrCode: user.qrCode,
          qrPublicUrl: qrPublicUrl,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

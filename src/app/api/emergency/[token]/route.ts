/**
 * API Route: GET /api/emergency/[token]
 * 
 * Returns emergency information for a given token
 * NO AUTHENTICATION REQUIRED - Public endpoint
 * 
 * Security:
 * - Token must be valid UUID format
 * - Only returns emergency-relevant data (Tier 1)
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import EmergencyToken from '@/models/EmergencyToken';
import MedicalInfo from '@/models/MedicalInfo';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!token || !isValidUUID(token)) {
      return NextResponse.json(
        { error: 'Invalid emergency token format' },
        { status: 400 }
      );
    }

    await dbConnect();

    const emergencyToken = await EmergencyToken.findOne({
      token,
      isActive: true,
    });

    if (!emergencyToken) {
      return NextResponse.json(
        { error: 'Invalid or expired emergency QR' },
        { status: 404 }
      );
    }

    // ── LOG THE SCAN ──
    try {
      const QRScanLog = (await import('@/models/QRScanLog')).default;
      await QRScanLog.create({
        scannedBy: 'public',
        scannerRole: 'anonymous',
        hospitalId: null,
        patientId: emergencyToken.patientId,
        token,
        tier: 1,
        ipAddress: request.headers.get('x-forwarded-for') || (request as any).ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        accessGranted: true,
      });
    } catch (logError) {
      console.error('Failed to log emergency scan:', logError);
    }

    const user = await User.findById(emergencyToken.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User profile associated with this QR code no longer exists' },
        { status: 404 }
      );
    }

    const medicalInfo = await MedicalInfo.findOne({
      userId: emergencyToken.userId,
    });

    if (!medicalInfo) {
      return NextResponse.json(
        { error: 'No medical information found' },
        { status: 404 }
      );
    }

    // Format emergency data (TIER 1 ONLY)
    const emergencyData = {
      userName: medicalInfo.displayNamePreference || (user.firstName ? `${user.firstName} ${user.lastName}` : 'Unknown'),
      birthYear: medicalInfo.birthYear || 'Not provided',
      bloodGroup: medicalInfo.bloodGroup || 'Not provided',
      knownAllergies: medicalInfo.knownAllergies || false,
      allergiesDetails: medicalInfo.allergiesDetails || '',
      chronicConditions: medicalInfo.chronicConditions || '',
      currentMedications: medicalInfo.currentMedications || '',
      emergencyContact1Name: medicalInfo.emergencyContact1Name || '',
      emergencyContact1Phone: medicalInfo.emergencyContact1Phone || '',
      emergencyContact1Relation: medicalInfo.emergencyContact1Relation || '',
      hasPacemakerOrImplant: medicalInfo.hasPacemakerOrImplant || false,
      isPregnant: medicalInfo.isPregnant || false,
    };

    return NextResponse.json(emergencyData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error in emergency info API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Validate UUID v4 format
 */
function isValidUUID(token: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(token);
}

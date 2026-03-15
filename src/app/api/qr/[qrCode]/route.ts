/**
 * Public QR Code Route
 * GET /api/qr/[qrCode] - Get public medical information for QR code
 * No authentication required - Emergency access feature
 */

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import User from '@/models/User';
import MedicalInfo from '@/models/MedicalInfo';
import { isValidQRCode } from '@/lib/qr';
import { getReportModel } from '@/models/Report';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrCode: string }> }
) {
  try {
    await db;

    const { qrCode } = await params;

    // Validate QR code format
    if (!isValidQRCode(qrCode)) {
      return NextResponse.json(
        { error: 'Invalid QR code format' },
        { status: 400 }
      );
    }

    // Find user by QR code
    const user = await User.findOne({ qrCode });
    if (!user) {
      return NextResponse.json(
        { error: 'QR code not found or has been deactivated' },
        { status: 404 }
      );
    }

    // Fetch medical information for this user
    const medicalInfo = await MedicalInfo.findOne({ userId: user._id });

    // Fetch reports for this user
    const ReportModel = await getReportModel();
    const reports = await ReportModel.find({ userId: user._id })
      .select('title type date clinic fileDataUri analysis')
      .sort({ date: -1 })
      .limit(5)
      .lean();

    // Return only public medical information
    // Do NOT expose passwords, email, or private user data
    const publicData = {
      success: true,
      patient: {
        name: `${user.firstName} ${user.lastName}`,
      },
      reports: reports.map((r: any) => ({
        id: r._id,
        title: r.title,
        type: r.type,
        date: r.date,
        clinic: r.clinic,
        fileDataUri: r.fileDataUri,
        // Only include summary if available
        summary: r.analysis?.executiveSummary || ''
      })),
      medical: medicalInfo
        ? {
          fullName: medicalInfo.fullName || '',
          age: medicalInfo.age || '',
          weight: medicalInfo.weight || '',
          dob: medicalInfo.dob || '',
          bodyCondition: medicalInfo.bodyCondition || '',
          badHabits: medicalInfo.badHabits || '',
          hasPastSurgery: medicalInfo.hasPastSurgery || false,
          surgery1Name: medicalInfo.surgery1Name || '',
          surgery1Date: medicalInfo.surgery1Date || '',
          surgery2Name: medicalInfo.surgery2Name || '',
          surgery2Date: medicalInfo.surgery2Date || '',
          surgery3Name: medicalInfo.surgery3Name || '',
          surgery3Date: medicalInfo.surgery3Date || '',
          bloodGroup: medicalInfo.bloodGroup || 'Not specified',
          allergies: medicalInfo.allergies || '',
          chronicConditions: medicalInfo.chronicConditions || '',
          medicalNotes: medicalInfo.medicalNotes || '',
          emergencyContact: medicalInfo.emergencyContact || null,
          medications: medicalInfo.medications || '',
        }
        : {
          fullName: '',
          age: '',
          weight: '',
          dob: '',
          bodyCondition: '',
          badHabits: '',
          hasPastSurgery: false,
          surgery1Name: '',
          surgery1Date: '',
          surgery2Name: '',
          surgery2Date: '',
          surgery3Name: '',
          surgery3Date: '',
          bloodGroup: 'Not specified',
          allergies: '',
          chronicConditions: '',
          medicalNotes: '',
          emergencyContact: null,
          medications: '',
        },
    };

    // Set cache headers - Cache for 5 minutes
    // This is safe because QR codes point to immutable emergency data
    return NextResponse.json(publicData, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  } catch (error) {
    console.error('QR code retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve QR information' },
      { status: 500 }
    );
  }
}

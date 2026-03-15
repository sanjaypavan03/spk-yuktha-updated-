/**
 * Login Route Handler
 * POST /api/auth/login
 * Authenticates user and returns JWT token
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { generateToken, setAuthCookie } from '@/lib/auth';
import { getQRPublicUrl } from '@/lib/qr';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 ========== LOGIN ATTEMPT ==========');
    await dbConnect();

    const body = await request.json();
    const { email, password } = body;

    console.log('📥 Received login request');
    console.log('📧 Email received:', email);
    console.log('🔑 Password received:', password ? `[${password.length} chars]` : 'MISSING');

    // Validation
    if (!email || !password) {
      console.log('❌ Missing credentials - email:', !!email, 'password:', !!password);
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Normalize email: trim and lowercase (same as signup)
    const normalizedEmail = email.trim().toLowerCase();
    console.log('📧 Normalized email for query:', normalizedEmail);

    // 1. Try to find in User collection
    console.log('🔍 Checking User collection...');
    let identity = await User.findOne({ email: normalizedEmail }).select('+password');
    let role: 'user' | 'admin' = 'user';

    // 2. If not found in User, try Admin collection
    if (!identity) {
      console.log('🔍 User not found, checking Admin collection...');
      const Admin = (await import('@/models/Admin')).default;
      identity = await Admin.findOne({ email: normalizedEmail }).select('+password');
      if (identity) {
        console.log('✅ Admin found in Admin collection');
        role = 'admin';
      }
    }

    if (!identity) {
      console.log('❌ UNIFIED LOGIN: Identity not found in any collection');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    console.log(`✅ Identity found with role: ${role}`);
    console.log('🔍 Comparing passwords...');

    // Check password
    const isPasswordValid = await (identity as any).comparePassword(password);
    console.log('🔍 Password comparison result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ INCORRECT PASSWORD');
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }

    console.log('✅ Password verified successfully');

    // Generate JWT token with appropriate role
    const token = await generateToken(identity._id.toString(), identity.email, role);
    console.log(`✅ Unified Login successful for ${role}:`, identity.email);

    // Construct common fields for the response
    const userData: any = {
      id: identity._id,
      email: identity.email,
      name: identity.name,
      role: role,
    };

    // Add extra user-specific fields if it's a regular user
    if (role === 'user') {
      const user = identity as any;
      userData.firstName = user.firstName;
      userData.lastName = user.lastName;
      userData.qrCode = user.qrCode;
      userData.qrPublicUrl = user.qrCode ? getQRPublicUrl(user.qrCode) : null;
      userData.emergencyDetailsCompleted = user.emergencyDetailsCompleted;
    }

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        user: userData,
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} login successful`,
      },
      { status: 200 }
    );

    // Set HTTP-only cookie
    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}

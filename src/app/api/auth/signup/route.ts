/**
 * Signup Route Handler
 * POST /api/auth/signup
 * Creates a new user and returns JWT token with QR code
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import MedicalInfo from '@/models/MedicalInfo';
import { generateToken, setAuthCookie } from '@/lib/auth';
import { generateQRCode, getQRPublicUrl } from '@/lib/qr';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    console.log('📝 ========== SIGNUP ATTEMPT ==========');
    await dbConnect();

    const body = await request.json();
    console.log('📦 FULL REQUEST BODY:', JSON.stringify(body, null, 2));
    console.log('📦 Body keys:', Object.keys(body));
    console.log('📦 Body values:', {
      email: body.email,
      password: body.password ? `[${body.password.length} chars]` : 'MISSING',
      name: body.name,
      firstName: body.firstName,
      lastName: body.lastName,
    });

    const { email, password, name, firstName, lastName } = body;

    // Validation
    if (!email || !password || !name) {
      console.log('❌ Missing required fields - email:', !!email, 'password:', !!password, 'name:', !!name);
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      console.log('❌ Password too short:', password.length);
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Normalize email: trim and lowercase
    const normalizedEmail = email.trim().toLowerCase();
    console.log('📧 Normalized email:', normalizedEmail);
    console.log('🔑 Password length:', password.length);

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      console.log('❌ User already exists in DB:', normalizedEmail);
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      );
    }

    // Generate unique QR code and emergency token
    const qrCode = generateQRCode();
    const emergencyToken = uuidv4();

    // Split name into firstName and lastName if not provided
    const nameParts = name.trim().split(' ');
    const finalFirstName = firstName || nameParts[0] || name;
    // Ensure lastName is not empty - use "User" as default if empty
    const finalLastName = lastName || nameParts.slice(1).join(' ') || 'User';

    console.log('💾 Preparing user data:');
    console.log('  - email:', normalizedEmail);
    console.log('  - name:', name.trim());
    console.log('  - firstName:', finalFirstName);
    console.log('  - lastName:', finalLastName);
    console.log('  - password length:', password.length);
    console.log('  - qrCode:', qrCode);

    // Manual password hashing
    let hashedPassword;
    try {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    } catch (hashError: any) {
      console.error('Bcrypt Hashing Error:', hashError);
      return NextResponse.json({ error: 'Password hashing failed' }, { status: 500 });
    }

    // Create new user
    console.log('💾 Creating user in database...');
    let user;
    try {
      user = await User.create({
        email: normalizedEmail,
        password: hashedPassword,
        name: name.trim(),
        firstName: finalFirstName,
        lastName: finalLastName,
        qrCode,
        emergencyToken,
        emergencyDetailsCompleted: false,
      });
      console.log('✅ User.create() succeeded');
      console.log('✅ Created user ID:', user._id);
      console.log('✅ Created user email:', user.email);
    } catch (createError: any) {
      console.error('❌ User.create() failed:', createError);
      console.error('❌ Error name:', createError.name);
      console.error('❌ Error message:', createError.message);
      console.error('❌ Error code:', createError.code);
      if (createError.errors) {
        console.error('❌ Validation errors:', JSON.stringify(createError.errors, null, 2));
      }
      throw createError;
    }

    // Verify password was hashed
    const savedUser = await User.findById(user._id).select('+password');
    console.log('✅ User created successfully');
    console.log('📧 Saved email:', savedUser?.email);
    console.log('🔐 Password hash exists:', !!savedUser?.password);
    console.log('🔐 Password hash length:', savedUser?.password?.length || 0);
    console.log('🔐 Password starts with $2b$:', savedUser?.password?.startsWith('$2b$') || false);
    console.log('🔐 Password hash preview:', savedUser?.password?.substring(0, 30) + '...' || 'N/A');

    // Verify we can compare the password
    if (savedUser?.password) {
      try {
        const testCompare = await bcrypt.compare(password, savedUser.password);
        console.log('🔍 Test password comparison after signup:', testCompare);
        if (!testCompare) {
          console.error('❌ WARNING: Password comparison failed immediately after signup!');
          console.error('❌ This means the password was not hashed correctly!');
        }
      } catch (compareError) {
        console.error('❌ Test comparison error:', compareError);
      }
    }

    // Create empty medical info record for this user
    console.log('💾 Creating medical info record and emergency token entry...');
    try {
      const MedicalInfo = (await import('@/models/MedicalInfo')).default;
      const EmergencyToken = (await import('@/models/EmergencyToken')).default;

      await MedicalInfo.create({
        userId: user._id,
      });

      await EmergencyToken.create({
        userId: user._id,
        token: emergencyToken,
        isActive: true,
        tier: 1 // Default to Tier 1
      });
      console.log('✅ Medical info and Emergency token created successfully');
    } catch (medicalError: any) {
      console.error('❌ MedicalInfo/EmergencyToken.create() failed:', medicalError);
    }

    // Generate JWT token
    console.log('🔑 Generating JWT token...');
    const token = await generateToken(user._id.toString(), user.email);
    console.log('✅ JWT token generated');

    // Construct response
    const qrPublicUrl = getQRPublicUrl(qrCode);

    const userResponse = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      qrCode: qrCode,
      qrPublicUrl: qrPublicUrl,
      emergencyDetailsCompleted: user.emergencyDetailsCompleted,
    };

    console.log('📤 Preparing response with user:', {
      ...userResponse,
      id: userResponse.id,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: userResponse,
        message: 'Signup successful. Please complete your emergency details.',
      },
      { status: 201 }
    );

    // Set HTTP-only cookie
    console.log('🍪 Setting auth cookie...');
    setAuthCookie(response, token);
    console.log('✅ Signup complete - returning response');

    return response;
  } catch (error: any) {
    console.error('❌ ========== SIGNUP ERROR ==========');
    console.error('❌ Error type:', error?.constructor?.name);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error code:', error?.code);
    console.error('❌ Full error:', error);

    // Log validation errors if they exist
    if (error.errors) {
      console.error('❌ Validation errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}:`, error.errors[key].message);
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      console.error('❌ Duplicate key error (user already exists)');
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {}).map((err: any) => err.message).join(', ');
      console.error('❌ Validation error details:', validationErrors);
      return NextResponse.json(
        { error: `Validation failed: ${validationErrors}` },
        { status: 400 }
      );
    }

    // Return detailed error for debugging
    return NextResponse.json(
      {
        error: 'Failed to create user',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

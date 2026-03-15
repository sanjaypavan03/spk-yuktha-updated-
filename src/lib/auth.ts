/**
 * JWT and Authentication Utilities
 * Handles token generation, verification, and user authentication
 */

import { SignJWT, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be defined and at least 32 characters long');
}

const secret = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'hospital' | 'doctor';
  hospitalRoles?: string[];
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token for a user, admin, or hospital
 */
export async function generateToken(
  userId: string,
  email: string,
  role: 'user' | 'admin' | 'hospital' | 'doctor' = 'user',
  hospitalRoles?: string[]
): Promise<string> {
  const payload: any = { userId, email, role };
  if (hospitalRoles) {
    // CRITICAL FIX: Mongoose arrays are Proxies that confuse structuredClone/SignJWT.
    // We must strictly sanitize this to a plain JS array of strings.
    try {
      payload.hospitalRoles = JSON.parse(JSON.stringify(hospitalRoles));
    } catch (e) {
      console.error("Sanitization failed for hospitalRoles, defaulting to empty array", e);
      payload.hospitalRoles = [];
    }
  }

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(secret);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extract JWT token from request headers or cookies
 */
export function extractToken(request: NextRequest): string | null {
  // First try to get from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    }
  }

  // Then try to get from cookies
  const token = request.cookies.get('auth-token')?.value;
  return token || null;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'hospital' | 'doctor';
  hospitalRoles?: string[];
}

/**
 * Get authenticated user from request
 * Returns userInfo if token is valid, null otherwise
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  const token = extractToken(request);
  if (!token) {
    console.log('🔒 No token found in request');
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    console.log('🔒 Invalid token');
    return null;
  }

  console.log('✅ Authenticated identity:', payload.email, 'Role:', payload.role);
  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role || 'user', // Default to user for backward compatibility
    hospitalRoles: payload.hospitalRoles,
  };
}

/**
 * Set JWT token in HTTP-only cookie
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';

  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Clear auth cookie
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.delete('auth-token');
}

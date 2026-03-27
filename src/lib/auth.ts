/**
 * JWT and Authentication Utilities
 * Handles token generation, verification, and user authentication
 */

import { SignJWT, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

console.log('--- DEBUG: JWT_SECRET length:', (process.env.JWT_SECRET || '').length);
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('--- DEBUG: JWT_SECRET is invalid:', JWT_SECRET);
  throw new Error('JWT_SECRET must be defined and at least 32 characters long');
}

const secret = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'hospital' | 'doctor' | 'receptionist';
  name?: string;
  hospitalRoles?: string[];
  hospitalPlan?: 'starter' | 'growth' | 'pro';
  hospitalId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token for a user, admin, or hospital
 */
export async function generateToken(
  userId: string,
  email: string,
  role: 'user' | 'admin' | 'hospital' | 'doctor' | 'receptionist' = 'user',
  name?: string,
  hospitalRoles?: string[],
  hospitalPlan?: string,
  hospitalId?: string
): Promise<string> {
  const payload: any = { userId, email, role };
  if (name) payload.name = name;
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

  if (hospitalPlan) {
    payload.hospitalPlan = hospitalPlan;
  }

  if (hospitalId) {
    payload.hospitalId = hospitalId;
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
  role: 'user' | 'admin' | 'hospital' | 'doctor' | 'receptionist';
  name?: string;
  hospitalRoles?: string[];
  hospitalPlan?: string;
  hospitalId?: string;
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
    name: payload.name,
    role: (payload.role as any) || 'user', // Default to user for backward compatibility
    hospitalRoles: payload.hospitalRoles,
    hospitalPlan: payload.hospitalPlan,
    hospitalId: payload.hospitalId,
  };
}

/**
 * Set JWT token in HTTP-only cookie
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';

  // The `window` object is not available on the server side where Next.js API routes run.
  // To determine if the host is localhost, we would typically need access to the `NextRequest` object.
  // Since `setAuthCookie` only receives `NextResponse`, we'll make an assumption
  // or require the caller to pass the hostname if this logic needs to be dynamic based on the request.
  // For now, we'll apply the logic as requested, assuming `isLocalhost` can be determined
  // or that this function is called in a context where `window` is available (e.g., client-side, which is unlikely for setting httpOnly cookies).
  // Given the instruction, we'll interpret it as a direct replacement for the domain logic.
  const isLocalhost = process.env.NODE_ENV !== 'production'; // Simplified assumption for server-side context
  const domain = isLocalhost ? undefined : '.yuktha.health';

  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    domain: domain,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clear auth cookie
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? '.yuktha.health' : undefined,
    maxAge: 0,
  });
}

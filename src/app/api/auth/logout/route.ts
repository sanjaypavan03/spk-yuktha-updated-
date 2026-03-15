/**
 * Logout Route Handler
 * POST /api/auth/logout
 * Clears the auth cookie
 */

import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    { status: 200 }
  );

  clearAuthCookie(response);

  return response;
}


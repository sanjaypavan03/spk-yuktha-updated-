import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from './lib/auth';

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // API routes protection
    if (pathname.startsWith('/api/')) {
        // Allow public auth and emergency routes
        if (
            pathname.startsWith('/api/auth/login') ||
            pathname.startsWith('/api/auth/signup') ||
            pathname.startsWith('/api/doctor/login') ||
            pathname.startsWith('/api/receptionist/login') ||
            pathname.startsWith('/api/hospital/login') ||
            pathname.startsWith('/api/admin/login') ||
            pathname.startsWith('/api/hospital/register') ||
            pathname.startsWith('/api/emergency/') ||
            pathname.startsWith('/api/appointments/slots') ||
            pathname.startsWith('/api/hospitals') ||
            pathname.startsWith('/api/debug-hooks') ||
            pathname.startsWith('/api/qr/')
        ) {
            return NextResponse.next();
        }

        // Protect all other API routes
        const token = extractToken(request);

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized: No token provided' },
                { status: 401 }
            );
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.json(
                { error: 'Unauthorized: Invalid token' },
                { status: 401 }
            );
        }

        // Attach userId and role to request headers for use in route handlers
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', payload.userId);
        requestHeaders.set('x-user-email', payload.email);
        requestHeaders.set('x-user-role', payload.role || 'user'); // Fallback to 'user'

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    }

    // Hospital Applicaton Protection (Strict)
    if (pathname.startsWith('/hospital') && !pathname.startsWith('/hospital/login') && !pathname.startsWith('/hospital/register')) {
        const token = extractToken(request);

        if (!token) {
            return NextResponse.redirect(new URL('/hospital/login', request.url));
        }

        const payload = await verifyToken(token);
        if (!payload || payload.role !== 'hospital') {
            return NextResponse.redirect(new URL('/hospital/login', request.url));
        }

        return NextResponse.next();
    }

    // Doctor Application Protection (Strict)
    if (pathname.startsWith('/doctor') && !pathname.startsWith('/doctor/login')) {
        const token = extractToken(request);

        if (!token) {
            return NextResponse.redirect(new URL('/doctor/login', request.url));
        }

        const payload = await verifyToken(token);
        if (!payload || payload.role !== 'doctor') {
            return NextResponse.redirect(new URL('/doctor/login', request.url));
        }

        return NextResponse.next();
    }

    // Receptionist Application Protection (Strict)
    if (pathname.startsWith('/receptionist') && !pathname.startsWith('/receptionist/login')) {
        const token = extractToken(request);

        if (!token) {
            return NextResponse.redirect(new URL('/receptionist/login', request.url));
        }

        const payload = await verifyToken(token);
        if (!payload || payload.role !== 'receptionist') {
            return NextResponse.redirect(new URL('/receptionist/login', request.url));
        }

        return NextResponse.next();
    }

    // Patient Application Protection (Strict)
    if (pathname.startsWith('/dashboard')) {
        const token = extractToken(request);

        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const payload = await verifyToken(token);
        // Sometimes generic 'user' role is undefined in older setups, better check if it's explicitly wrong.
        if (!payload || (payload.role && payload.role !== 'user')) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/api/:path*',
        '/dashboard/:path*',
        '/doctor/:path*',
        '/hospital/:path*',
        '/receptionist/:path*'
    ],
};

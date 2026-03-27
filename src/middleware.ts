import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from './lib/auth';

// Helper to get subdomain from hostname
function getSubdomain(hostname: string): string {
  // Remove port if present
  const host = hostname.split(':')[0];
  // Split by dots
  const parts = host.split('.');
  // If it's localhost or IP, no subdomain
  if (parts.length <= 1) return '';
  // For yuktha.health → no subdomain (root)
  // For hospital.yuktha.health → 'hospital'
  // For localhost:3000 → ''
  if (host.includes('localhost') || host.includes('vercel.app')) {
    return '';
  }
  if (parts.length >= 3) {
    return parts[0]; // 'hospital', 'doctor', 'admin'
  }
  return '';
}

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const hostname = request.headers.get('host') || '';
    const subdomain = getSubdomain(hostname);

    // ─── SUBDOMAIN REDIRECTS ───────────────────────────────────────
    // When someone visits hospital.yuktha.health → redirect to /hospital/login or /hospital/dashboard
    // When someone visits doctor.yuktha.health → redirect to /doctor/login
    // When someone visits admin.yuktha.health → redirect to /admin/login

    if (subdomain === 'hospital' && pathname === '/') {
        return NextResponse.redirect(new URL('/hospital/login', request.url));
    }
    if (subdomain === 'doctor' && pathname === '/') {
        return NextResponse.redirect(new URL('/doctor/login', request.url));
    }
    if (subdomain === 'admin' && pathname === '/') {
        return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // ─── SUBDOMAIN ISOLATION ──────────────────────────────────────
    // Block wrong portals on wrong subdomains for security

    // On hospital subdomain: only allow /hospital/*, /receptionist/*, /api/*, /emergency/*
    if (subdomain === 'hospital') {
        const allowed =
            pathname.startsWith('/hospital') ||
            pathname.startsWith('/receptionist') ||
            pathname.startsWith('/api/') ||
            pathname.startsWith('/emergency/') ||
            pathname.startsWith('/qr/') ||
            pathname === '/';
        if (!allowed) {
            return NextResponse.redirect(new URL('/hospital/login', request.url));
        }
    }

    // On doctor subdomain: only allow /doctor/*, /api/*, /emergency/*
    if (subdomain === 'doctor') {
        const allowed =
            pathname.startsWith('/doctor') ||
            pathname.startsWith('/api/') ||
            pathname.startsWith('/emergency/') ||
            pathname.startsWith('/qr/') ||
            pathname === '/';
        if (!allowed) {
            return NextResponse.redirect(new URL('/doctor/login', request.url));
        }
    }

    // On admin subdomain: only allow /admin/*, /api/*
    if (subdomain === 'admin') {
        const allowed =
            pathname.startsWith('/admin') ||
            pathname.startsWith('/api/') ||
            pathname === '/';
        if (!allowed) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    // ─── API ROUTES PROTECTION ────────────────────────────────────
    if (pathname.startsWith('/api/')) {
        // Allow public routes
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
            pathname.startsWith('/api/qr/') ||
            pathname.startsWith('/api/admin/create-first')
        ) {
            return NextResponse.next();
        }

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

        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', payload.userId);
        requestHeaders.set('x-user-email', payload.email);
        requestHeaders.set('x-user-role', payload.role || 'user');

        return NextResponse.next({
            request: { headers: requestHeaders },
        });
    }

    // ─── PAGE ROUTE PROTECTION ────────────────────────────────────

    // Hospital portal
    if (pathname.startsWith('/hospital') && !pathname.startsWith('/hospital/login') && !pathname.startsWith('/hospital/register')) {
        const token = extractToken(request);
        if (!token) return NextResponse.redirect(new URL('/hospital/login', request.url));
        const payload = await verifyToken(token);
        if (!payload || payload.role !== 'hospital') return NextResponse.redirect(new URL('/hospital/login', request.url));
        return NextResponse.next();
    }

    // Doctor portal
    if (pathname.startsWith('/doctor') && !pathname.startsWith('/doctor/login')) {
        const token = extractToken(request);
        if (!token) return NextResponse.redirect(new URL('/doctor/login', request.url));
        const payload = await verifyToken(token);
        if (!payload || payload.role !== 'doctor') return NextResponse.redirect(new URL('/doctor/login', request.url));
        return NextResponse.next();
    }

    // Receptionist portal
    if (pathname.startsWith('/receptionist') && !pathname.startsWith('/receptionist/login')) {
        const token = extractToken(request);
        if (!token) return NextResponse.redirect(new URL('/receptionist/login', request.url));
        const payload = await verifyToken(token);
        if (!payload || payload.role !== 'receptionist') return NextResponse.redirect(new URL('/receptionist/login', request.url));
        return NextResponse.next();
    }

    // Patient dashboard
    if (pathname.startsWith('/dashboard')) {
        const token = extractToken(request);
        if (!token) return NextResponse.redirect(new URL('/login', request.url));
        const payload = await verifyToken(token);
        if (!payload || (payload.role && payload.role !== 'user')) return NextResponse.redirect(new URL('/login', request.url));
        return NextResponse.next();
    }

    // Admin portal
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
        const token = extractToken(request);
        if (!token) return NextResponse.redirect(new URL('/admin/login', request.url));
        const payload = await verifyToken(token);
        if (!payload || payload.role !== 'admin') return NextResponse.redirect(new URL('/admin/login', request.url));
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
        '/receptionist/:path*',
        '/admin/:path*',
        '/',
    ],
};

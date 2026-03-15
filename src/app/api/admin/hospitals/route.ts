import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Hospital from '@/models/Hospital';
import { getAuthenticatedUser } from '@/lib/auth';
import bcrypt from 'bcrypt';

// GET: List all hospitals
export async function GET(request: NextRequest) {
    try {
        const admin = await getAuthenticatedUser(request);
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await dbConnect();

        const hospitals = await Hospital.find({}).sort({ createdAt: -1 });

        return NextResponse.json({ hospitals });
    } catch (error: any) {
        console.error('Fetch Hospitals Error full details:', error);
        return NextResponse.json({
            error: error.message || 'Failed to fetch hospitals',
            details: error.stack || 'No stack trace available'
        }, { status: 500 });
    }
}

// POST: Create a new hospital
export async function POST(request: NextRequest) {
    try {
        const admin = await getAuthenticatedUser(request);
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await dbConnect();
        const { name, email, password, role, roles, contactNumber } = await request.json();

        if (!name || !email || !password || (!role && !roles)) {
            return NextResponse.json({ error: 'Missing field: Name, Email, Password, and Role are required' }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Handle role vs roles for compatibility
        let finalRoles = roles || [];
        if (!roles && role) {
            finalRoles = role === 'Both' ? ['doctor', 'pharmacy'] : [role.toLowerCase()];
        }

        // Check for existing hospital
        const existing = await Hospital.findOne({ email: normalizedEmail });
        if (existing) {
            return NextResponse.json({ error: 'Hospital with this email already exists' }, { status: 409 });
        }

        // Manual password hashing
        let hashedPassword;
        try {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        } catch (hashError: any) {
            console.error('Bcrypt Error:', hashError);
            return NextResponse.json({ error: 'Manual hashing failed: ' + hashError.message }, { status: 500 });
        }

        const hospital = new Hospital({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            roles: finalRoles,
            contactNumber,
            status: 'Active',
        });

        await hospital.save();

        return NextResponse.json({
            success: true,
            hospital: {
                id: hospital._id,
                name: hospital.name,
                email: hospital.email,
                roles: hospital.roles,
                status: hospital.status,
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Create Hospital Error full details:', error);
        return NextResponse.json({
            error: error.message || 'Failed to create hospital',
            details: error.stack || 'No stack trace available'
        }, { status: 500 });
    }
}

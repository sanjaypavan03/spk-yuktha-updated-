import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import IPAdmission from '@/models/IPAdmission';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);

        // Allow hospitals and doctors to add progress notes
        if (!authUser || (authUser.role !== 'hospital' && authUser.role !== 'doctor')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const body = await request.json();
        const { note } = body;

        if (!note) {
            return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
        }

        const admission = await IPAdmission.findById(resolvedParams.id);
        if (!admission) {
            return NextResponse.json({ error: 'Admission not found' }, { status: 404 });
        }

        // Add note to progressNotes array
        admission.progressNotes.push({
            note,
            addedBy: authUser.name || authUser.role,
            addedAt: new Date()
        });

        await admission.save();

        return NextResponse.json({ 
            success: true, 
            message: 'Progress note added',
            admission 
        });
    } catch (error) {
        console.error('Add IP Note Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import IPAdmission from '@/models/IPAdmission';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);
        
        if (!authUser || (authUser.role !== 'hospital' && authUser.role !== 'doctor')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { ward, bedNumber, status, dischargeDate, addNote } = body;

        let update: any = {};
        
        // Handle field updates
        if (ward !== undefined) update.ward = ward;
        if (bedNumber !== undefined) update.bedNumber = bedNumber;
        if (status !== undefined) {
            update.status = status;
            if (status === 'discharged' && !dischargeDate) {
                update.dischargeDate = new Date();
            }
        }
        if (dischargeDate !== undefined) update.dischargeDate = dischargeDate;

        let admission;

        // If addNote is present, we push to the progressNotes array
        if (addNote) {
            const { note, vitals, addedBy } = addNote;
            admission = await IPAdmission.findByIdAndUpdate(
                id,
                { 
                    $set: update,
                    $push: { 
                        progressNotes: { 
                            note, 
                            vitals, 
                            addedBy, 
                            addedAt: new Date() 
                        } 
                    } 
                },
                { new: true }
            );
        } else {
            // Regular field update
            admission = await IPAdmission.findByIdAndUpdate(
                id,
                { $set: update },
                { new: true }
            );
        }

        if (!admission) {
            return NextResponse.json({ error: 'Admission not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, admission });

    } catch (error: any) {
        console.error('Update IP Admission Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

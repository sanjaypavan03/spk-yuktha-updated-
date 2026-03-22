import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Prescription from '@/models/Prescription';
import PillTracking from '@/models/PillTracking';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PATCH(
    request: NextRequest, 
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: prescriptionId } = await params;
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);
        if (!authUser || (authUser.role !== 'doctor' && authUser.role !== 'hospital')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { status } = body;

        if (!status || !['Active', 'Completed', 'Cancelled'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Security: Ensure the doctor is the one who issued it OR it's a hospital admin
        const query: any = { _id: prescriptionId };
        if (authUser.role === 'doctor') {
            query.doctorId = authUser.userId;
        }

        const updatedPrescription = await Prescription.findOneAndUpdate(
            query,
            { status },
            { new: true }
        );

        if (!updatedPrescription) {
            return NextResponse.json({ error: 'Prescription not found or unauthorized' }, { status: 404 });
        }

        // If cancelled, should we also delete or mark pill tracking?
        // Requirement says 'Cancel' prescription.
        if (status === 'Cancelled') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            await PillTracking.deleteMany({ 
                prescriptionId: prescriptionId, 
                taken: false,
                date: { $gte: today }
            });
        }

        return NextResponse.json({ success: true, prescription: updatedPrescription });
    } catch (error) {
        console.error('Update Prescription Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

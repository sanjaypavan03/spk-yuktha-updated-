import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import FamilyMember from '@/models/FamilyMember';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ memberId: string }> }
) {
    try {
        await dbConnect();

        const authUser = await getAuthenticatedUser(request);
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { memberId } = await params;

        const familyMember = await FamilyMember.findOne({
            _id: memberId,
            userId: authUser.userId
        }).lean();

        if (!familyMember) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: familyMember
        });
    } catch (error: any) {
        console.error('❌ Get family member error:', error);
        return NextResponse.json({ error: 'Failed to fetch', details: error.message }, { status: 500 });
    }
}

// DELETE - Remove a family member
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ memberId: string }> }
) {
    try {
        await dbConnect();

        const authUser = await getAuthenticatedUser(request);
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { memberId } = await params;

        const deletedMember = await FamilyMember.findOneAndDelete({
            _id: memberId,
            userId: authUser.userId
        });

        if (!deletedMember) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Family member removed'
        });
    } catch (error: any) {
        console.error('❌ Delete family member error:', error);
        return NextResponse.json({ error: 'Failed to delete', details: error.message }, { status: 500 });
    }
}

// PUT - Update family member details
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ memberId: string }> }
) {
    try {
        await dbConnect();

        const authUser = await getAuthenticatedUser(request);
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { memberId } = await params;
        const body = await request.json();

        // Fields that are allowed to be updated
        const updatableFields = [
            'name', 'relation', 'otherRelation', 'avatarUrl',
            'bloodGroup', 'allergies', 'medications', 'chronicConditions',
            'birthYear', 'weight', 'emergencyContact', 'medicalNotes', 'surgeryHistory',
            'habits', 'physicalState'
        ];

        const updateData: any = {};
        updatableFields.forEach(field => {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        });

        const updatedMember = await FamilyMember.findOneAndUpdate(
            { _id: memberId, userId: authUser.userId },
            { $set: updateData },
            { new: true }
        );

        if (!updatedMember) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: updatedMember
        });
    } catch (error: any) {
        console.error('❌ Update family member error:', error);
        return NextResponse.json({ error: 'Failed to update', details: error.message }, { status: 500 });
    }
}

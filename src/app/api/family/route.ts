import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import FamilyMember from '@/models/FamilyMember';
import { getAuthenticatedUser } from '@/lib/auth';

// GET - Fetch all family members for the user
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const authUser = await getAuthenticatedUser(request);
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const familyMembers = await FamilyMember.find({ userId: authUser.userId }).sort({ createdAt: -1 }).lean();

        return NextResponse.json({
            success: true,
            data: familyMembers
        });
    } catch (error: any) {
        console.error('❌ Get family members error:', error);
        return NextResponse.json({ error: 'Failed to fetch', details: error.message }, { status: 500 });
    }
}

// POST - Add a new family member
export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const authUser = await getAuthenticatedUser(request);
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, relation, otherRelation, avatarUrl } = await request.json();

        if (!name || !relation) {
            return NextResponse.json({ error: 'Name and relation are required' }, { status: 400 });
        }

        const newMember = await FamilyMember.create({
            userId: authUser.userId,
            name,
            relation,
            otherRelation: otherRelation || '',
            avatarUrl: avatarUrl || `https://picsum.photos/seed/${Math.random()}/100/100`
        });

        return NextResponse.json({
            success: true,
            message: 'Family member added',
            data: newMember
        });
    } catch (error: any) {
        console.error('❌ Add family member error:', error);
        return NextResponse.json({ error: 'Failed to add', details: error.message }, { status: 500 });
    }
}

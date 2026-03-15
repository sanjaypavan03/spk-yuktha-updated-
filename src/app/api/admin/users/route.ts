import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const admin = await getAuthenticatedUser(request);
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await dbConnect();

        // Use aggregation to join with MedicalInfo
        const users = await User.aggregate([
            {
                $sort: { createdAt: -1 }
            },
            {
                $lookup: {
                    from: 'medicalinfos', // Collection name for MedicalInfo model
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'medicalInfo'
                }
            },
            {
                $addFields: {
                    medicalInfo: { $arrayElemAt: ['$medicalInfo', 0] }
                }
            },
            {
                $project: {
                    password: 0,
                    __v: 0
                }
            }
        ]);

        return NextResponse.json({ users });
    } catch (error: any) {
        console.error('Fetch Users Error full details:', error);
        return NextResponse.json({
            error: error.message || 'Failed to fetch users',
            details: error.stack || 'No stack trace available'
        }, { status: 500 });
    }
}

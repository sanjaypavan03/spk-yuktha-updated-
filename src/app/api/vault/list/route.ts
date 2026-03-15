import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getReportModel } from '@/models/Report';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser || authUser.role !== 'user') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const categoryFilter = searchParams.get('category');

        let query: any = { userId: authUser.userId };

        if (categoryFilter && categoryFilter !== 'All') {
            let catFilterStr = 'other';
            if (categoryFilter === 'Blood Reports') catFilterStr = 'blood';
            if (categoryFilter === 'Scans & Imaging') catFilterStr = 'imaging';
            if (categoryFilter === 'Prescriptions') catFilterStr = 'prescription';

            query.category = catFilterStr;
        }

        const Report = await getReportModel();
        const reports = await Report.find(query).sort({ date: -1, createdAt: -1 });

        return NextResponse.json({
            success: true,
            reports
        });

    } catch (error) {
        console.error('Vault List Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

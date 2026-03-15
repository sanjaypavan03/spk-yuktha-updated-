import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getReportModel } from '@/models/Report';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser || authUser.role !== 'user') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const body = await request.json();
        const { category, reportTitle, analysisText, rawData } = body;

        if (!category || !reportTitle) {
            return NextResponse.json({ error: 'Category and report Title are required' }, { status: 400 });
        }

        const finalCategory = ['blood', 'imaging', 'prescription', 'other'].includes(category.toLowerCase())
            ? category.toLowerCase() : 'other';

        const Report = await getReportModel();
        const report = await Report.create({
            userId: authUser.userId,
            title: reportTitle,
            category: finalCategory,
            summary: analysisText || 'No detailed analysis produced.',
        });

        const categoryPretty = finalCategory === 'imaging' ? 'Scans & Imaging' :
            finalCategory === 'prescription' ? 'Prescriptions' :
                finalCategory === 'blood' ? 'Blood Reports' : 'Other';

        return NextResponse.json({
            success: true,
            report,
            message: `Saved to Secure Vault under ${categoryPretty}`
        });

    } catch (error) {
        console.error('Vault Save Error:', error);
        return NextResponse.json({ error: 'Failed to save to vault' }, { status: 500 });
    }
}

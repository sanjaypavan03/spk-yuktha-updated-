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
        const { category, reportTitle, analysisText, rawData, parameters, abnormalFindings, clinic, date } = body;

        if (!category || !reportTitle) {
            return NextResponse.json({ error: 'Category and report Title are required' }, { status: 400 });
        }

        const validCategories = ['mri', 'ultrasound', 'blood', 'urine', 'ecg', 'thyroid', 'diabetes', 'allergy', 'others'];
        const finalCategory = validCategories.includes(category.toLowerCase())
            ? category.toLowerCase() : 'others';

        const Report = await getReportModel();
        // Consolidate into the existing schema structure
        const report = await Report.create({
            userId: authUser.userId,
            title: reportTitle,
            type: finalCategory,
            date: date ? new Date(date) : new Date(),
            clinic: clinic || 'Unknown Center',
            analysis: {
                summary: analysisText || 'Analysis complete.',
                parameters: parameters || [],
                abnormalFindings: abnormalFindings || [],
                rawData: rawData
            }
        });

        const categoryPretty = finalCategory.charAt(0).toUpperCase() + finalCategory.slice(1);

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

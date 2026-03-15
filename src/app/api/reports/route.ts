import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getReportModel } from '@/models/Report';

export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const memberId = searchParams.get('memberId');

        const Report = await getReportModel();
        const query: any = { userId: authUser.userId };
        if (memberId) query.memberId = memberId;

        const reports = await Report.find(query).sort({ createdAt: -1 });

        return NextResponse.json({ reports });
    } catch (error) {
        console.error('GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const Report = await getReportModel();

        const newReport = await Report.create({
            userId: authUser.userId,
            ...body
        });

        return NextResponse.json({ report: newReport }, { status: 201 });
    } catch (error) {
        console.error('POST Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        const Report = await getReportModel();
        await Report.deleteOne({ _id: id, userId: authUser.userId });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

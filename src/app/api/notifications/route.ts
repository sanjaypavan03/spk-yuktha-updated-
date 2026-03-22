import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get('unread') === 'true';

        const query: any = { recipientId: authUser.userId };
        if (unreadOnly) {
            query.isRead = false;
        }

        const [notifications, unreadCount] = await Promise.all([
            Notification.find(query).sort({ createdAt: -1 }).limit(50),
            Notification.countDocuments({ recipientId: authUser.userId, isRead: false })
        ]);

        return NextResponse.json({ success: true, notifications, unreadCount });

    } catch (error: any) {
        console.error('Fetch Notifications Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        await dbConnect();
        const authUser = await getAuthenticatedUser(request);
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const markAllRead = searchParams.get('markAllRead') === 'true';
        
        // Use a safe JSON parse for body
        let body = {};
        try {
            if (request.headers.get('content-type')?.includes('application/json')) {
                body = await request.json();
            }
        } catch (e) {}
        
        const { id } = body as any;

        if (markAllRead) {
            await Notification.updateMany(
                { recipientId: authUser.userId },
                { $set: { isRead: true } }
            );
        } else if (id) {
            await Notification.findOneAndUpdate(
                { _id: id, recipientId: authUser.userId },
                { $set: { isRead: true } },
                { new: true }
            );
        } else {
            return NextResponse.json({ error: 'Missing notification ID or markAllRead flag' }, { status: 400 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Update Notification Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

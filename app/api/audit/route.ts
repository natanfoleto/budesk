import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '') ||
            (request.headers.get('cookie') || '').split('token=')[1]?.split(';')[0];

        if (!token || !await verifyJWT(token)) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = Number(searchParams.get('limit')) || 100;
        const entity = searchParams.get('entity');
        const action = searchParams.get('action');

        const where: any = {};
        if (entity) where.entity = entity;
        if (action) where.action = action;

        const logs = await prisma.auditLog.findMany({
            where,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });

        return NextResponse.json({ success: true, data: logs });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch audit logs' }, { status: 500 });
    }
}

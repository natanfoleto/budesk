import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { verifyJWT } from '@/lib/auth';

const createDocumentSchema = z.object({
    title: z.string().min(3),
    url: z.string().url().optional(), // In a real app, logic to upload would go here
    type: z.string().optional(),
    description: z.string().optional(),
    serviceId: z.string().optional(),
    clientId: z.string().optional(),
    vehicleId: z.string().optional(),
});

export async function GET(request: Request) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '') ||
            (request.headers.get('cookie') || '').split('token=')[1]?.split(';')[0];

        if (!token || !await verifyJWT(token)) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = Number(searchParams.get('limit')) || 50;
        const serviceId = searchParams.get('serviceId');

        const where: any = {};
        if (serviceId) where.serviceId = serviceId;

        const documents = await prisma.document.findMany({
            where,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, data: documents });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch documents' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '') ||
            (request.headers.get('cookie') || '').split('token=')[1]?.split(';')[0];
        const payload = token ? await verifyJWT(token) : null;

        if (!payload) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const data = createDocumentSchema.parse(body);

        const document = await prisma.document.create({
            data: {
                ...data,
            }
        });

        // Manual Audit
        await prisma.auditLog.create({
            data: {
                action: 'CREATE',
                entity: 'Document',
                entityId: document.id,
                newData: document as any,
                userId: payload.id as string,
            }
        });

        return NextResponse.json({ success: true, data: document });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Failed to create document' }, { status: 500 });
    }
}

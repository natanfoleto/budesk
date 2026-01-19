import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { verifyJWT } from '@/lib/auth';
import { ServiceStatus } from '@prisma/client';

const createServiceSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    status: z.nativeEnum(ServiceStatus).default(ServiceStatus.ABERTO),
    startDate: z.string().transform((str) => new Date(str)),
    clientId: z.string().optional(),
});

export async function GET(request: Request) {
    try {
        // Auth Check
        const token = request.headers.get('Authorization')?.replace('Bearer ', '') ||
            (request.headers.get('cookie') || '').split('token=')[1]?.split(';')[0];

        if (!token || !await verifyJWT(token)) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = Number(searchParams.get('limit')) || 20;

        const where = status ? { status: status as ServiceStatus } : {};

        const services = await prisma.service.findMany({
            where,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                client: { select: { name: true } },
                transactions: { select: { amount: true, type: true } }, // Simple summary
            }
        });

        return NextResponse.json({ success: true, data: services });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch services' }, { status: 500 });
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
        const data = createServiceSchema.parse(body);

        const service = await prisma.service.create({
            data: {
                ...data,
                createdById: payload.id as string,
            }
        });

        // Manual Audit (since middleware removed for now)
        await prisma.auditLog.create({
            data: {
                action: 'CREATE',
                entity: 'Service',
                entityId: service.id,
                newData: service as any,
                userId: payload.id as string,
            }
        });

        return NextResponse.json({ success: true, data: service });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to create service' }, { status: 500 });
    }
}

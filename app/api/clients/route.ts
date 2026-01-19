import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { verifyJWT } from '@/lib/auth';

const createClientSchema = z.object({
    name: z.string().min(3),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    document: z.string().optional(), // CPF/CNPJ
    address: z.string().optional(),
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
        const search = searchParams.get('search');

        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { document: { contains: search, mode: 'insensitive' } }
            ];
        }

        const clients = await prisma.client.findMany({
            where,
            take: limit,
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { services: true }
                }
            }
        });

        return NextResponse.json({ success: true, data: clients });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch clients' }, { status: 500 });
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
        const data = createClientSchema.parse(body);

        const client = await prisma.client.create({
            data: {
                ...data,
            }
        });

        // Manual Audit
        await prisma.auditLog.create({
            data: {
                action: 'CREATE',
                entity: 'Client',
                entityId: client.id,
                newData: client as any,
                userId: payload.id as string,
            }
        });

        return NextResponse.json({ success: true, data: client });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Failed to create client' }, { status: 500 });
    }
}

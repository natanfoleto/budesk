import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { verifyJWT } from '@/lib/auth';
import { AccountStatus } from '@prisma/client';

const createAccountPayableSchema = z.object({
    description: z.string().min(3),
    amount: z.number().or(z.string().transform(v => Number(v))),
    dueDate: z.string().transform((str) => new Date(str)),
    status: z.nativeEnum(AccountStatus).default(AccountStatus.PENDENTE),
    supplierId: z.string().optional(),
});

export async function GET(request: Request) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '') ||
            (request.headers.get('cookie') || '').split('token=')[1]?.split(';')[0];

        if (!token || !await verifyJWT(token)) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = Number(searchParams.get('limit')) || 50;

        const where: any = {};
        if (status) where.status = status;

        const accounts = await prisma.accountPayable.findMany({
            where,
            take: limit,
            orderBy: { dueDate: 'asc' },
            include: {
                supplier: { select: { name: true } }
            }
        });

        return NextResponse.json({ success: true, data: accounts });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch accounts payable' }, { status: 500 });
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
        const data = createAccountPayableSchema.parse(body);

        const account = await prisma.accountPayable.create({
            data: {
                ...data,
            }
        });

        // Manual Audit
        await prisma.auditLog.create({
            data: {
                action: 'CREATE',
                entity: 'AccountPayable',
                entityId: account.id,
                newData: account as any,
                userId: payload.id as string,
            }
        });

        return NextResponse.json({ success: true, data: account });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Failed to create account payable' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { verifyJWT } from '@/lib/auth';
import { TransactionType, PaymentMethod } from '@prisma/client';

const createTransactionSchema = z.object({
    description: z.string().min(3),
    type: z.nativeEnum(TransactionType),
    amount: z.number().or(z.string().transform(v => Number(v))),
    category: z.string(),
    paymentMethod: z.nativeEnum(PaymentMethod),
    date: z.string().transform((str) => new Date(str)),
    serviceId: z.string().optional(),
    employeeId: z.string().optional(),
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
        const serviceId = searchParams.get('serviceId');
        const limit = Number(searchParams.get('limit')) || 50;

        const where: any = {};
        if (serviceId) where.serviceId = serviceId;

        const transactions = await prisma.financialTransaction.findMany({
            where,
            take: limit,
            orderBy: { date: 'desc' },
            include: {
                service: { select: { title: true } },
                employee: { select: { name: true } },
                supplier: { select: { name: true } }
            }
        });

        return NextResponse.json({ success: true, data: transactions });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch transactions' }, { status: 500 });
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
        const data = createTransactionSchema.parse(body);

        const transaction = await prisma.financialTransaction.create({
            data: {
                ...data,
            }
        });

        // Manual Audit
        await prisma.auditLog.create({
            data: {
                action: 'CREATE',
                entity: 'FinancialTransaction',
                entityId: transaction.id,
                newData: transaction as any,
                userId: payload.id as string,
            }
        });

        return NextResponse.json({ success: true, data: transaction });
    } catch (error: any) {
        console.error('Transaction Error', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to create transaction' }, { status: 500 });
    }
}

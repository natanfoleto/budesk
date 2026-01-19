import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { verifyJWT } from '@/lib/auth';

const createEmployeeSchema = z.object({
    name: z.string().min(3),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    document: z.string().optional(), // CPF
    role: z.string(),
    active: z.boolean().default(true),
    salary: z.number().optional(),
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
        const active = searchParams.get('active'); // 'true' or 'false'

        const where: any = {};
        if (active === 'true') where.active = true;
        if (active === 'false') where.active = false;

        const employees = await prisma.employee.findMany({
            where,
            take: limit,
            orderBy: { name: 'asc' },
        });

        return NextResponse.json({ success: true, data: employees });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch employees' }, { status: 500 });
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
        const data = createEmployeeSchema.parse(body);

        const employee = await prisma.employee.create({
            data: {
                ...data,
            }
        });

        // Manual Audit
        await prisma.auditLog.create({
            data: {
                action: 'CREATE',
                entity: 'Employee',
                entityId: employee.id,
                newData: employee as any,
                userId: payload.id as string,
            }
        });

        return NextResponse.json({ success: true, data: employee });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Failed to create employee' }, { status: 500 });
    }
}

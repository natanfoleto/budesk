import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { verifyJWT } from '@/lib/auth';
import { VehicleType } from '@prisma/client';

const createVehicleSchema = z.object({
    plate: z.string().min(7),
    model: z.string().min(2),
    brand: z.string().min(2),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    type: z.nativeEnum(VehicleType),
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
        const type = searchParams.get('type');

        const where: any = {};
        if (type) where.type = type;

        const vehicles = await prisma.vehicle.findMany({
            where,
            take: limit,
            orderBy: { model: 'asc' },
        });

        return NextResponse.json({ success: true, data: vehicles });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch vehicles' }, { status: 500 });
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
        const data = createVehicleSchema.parse(body);

        const vehicle = await prisma.vehicle.create({
            data: {
                ...data,
            }
        });

        // Manual Audit
        await prisma.auditLog.create({
            data: {
                action: 'CREATE',
                entity: 'Vehicle',
                entityId: vehicle.id,
                newData: vehicle as any,
                userId: payload.id as string,
            }
        });

        return NextResponse.json({ success: true, data: vehicle });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Failed to create vehicle' }, { status: 500 });
    }
}

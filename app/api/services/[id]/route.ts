import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { verifyJWT } from '@/lib/auth';
import { ServiceStatus } from '@prisma/client';

const updateServiceSchema = z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    status: z.nativeEnum(ServiceStatus).optional(),
    endDate: z.string().nullable().optional().transform((str) => str ? new Date(str) : null),
    clientId: z.string().optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '') ||
            (request.headers.get('cookie') || '').split('token=')[1]?.split(';')[0];

        if (!token || !await verifyJWT(token)) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const service = await prisma.service.findUnique({
            where: { id },
            include: {
                client: true,
                transactions: true,
                documents: true,
                vehicleUsage: true
            }
        });

        if (!service) {
            return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: service });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch service' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '') ||
            (request.headers.get('cookie') || '').split('token=')[1]?.split(';')[0];
        const payload = token ? await verifyJWT(token) : null;

        if (!payload) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const data = updateServiceSchema.parse(body);

        const oldService = await prisma.service.findUnique({ where: { id } });

        const service = await prisma.service.update({
            where: { id },
            data: { ...data }
        });

        // Manual Audit
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE',
                entity: 'Service',
                entityId: service.id,
                oldData: oldService as any,
                newData: service as any,
                userId: payload.id as string,
            }
        });

        return NextResponse.json({ success: true, data: service });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Failed to update service' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '') ||
            (request.headers.get('cookie') || '').split('token=')[1]?.split(';')[0];
        const payload = token ? await verifyJWT(token) : null;

        if (!payload) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Check for dependencies or soft delete? 
        // Requirement: DELETE audit.

        const oldService = await prisma.service.findUnique({ where: { id } });

        // We might want to cascade delete or just forbid if transactions exist.
        // For now, standard delete.
        await prisma.service.delete({
            where: { id }
        });

        // Manual Audit
        await prisma.auditLog.create({
            data: {
                action: 'DELETE',
                entity: 'Service',
                entityId: id,
                oldData: oldService as any,
                userId: payload.id as string,
            }
        });

        return NextResponse.json({ success: true, message: 'Service deleted' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Failed to delete service' }, { status: 500 });
    }
}

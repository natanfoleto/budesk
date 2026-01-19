import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '') ||
            (request.headers.get('cookie') || '').split('token=')[1]?.split(';')[0];
        const payload = token ? await verifyJWT(token) : null;

        if (!payload) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const oldData = await prisma.financialTransaction.findUnique({ where: { id } });

        if (!oldData) {
            return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
        }

        await prisma.financialTransaction.delete({
            where: { id }
        });

        await prisma.auditLog.create({
            data: {
                action: 'DELETE',
                entity: 'FinancialTransaction',
                entityId: id,
                oldData: oldData as any,
                userId: payload.id as string,
            }
        });

        return NextResponse.json({ success: true, message: 'Transaction deleted' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Failed to delete transaction' }, { status: 500 });
    }
}

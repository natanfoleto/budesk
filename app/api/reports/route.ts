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

        // 1. Transactions Summary (In vs Out)
        const transactions = await prisma.financialTransaction.findMany();
        const income = transactions.filter(t => t.type === 'ENTRADA').reduce((acc, t) => acc + Number(t.amount), 0);
        const expense = transactions.filter(t => t.type === 'SAIDA').reduce((acc, t) => acc + Number(t.amount), 0);

        // 2. Services by Status
        const services = await prisma.service.groupBy({
            by: ['status'],
            _count: {
                id: true
            }
        });

        // 3. Top Clients (by service count)
        const topClients = await prisma.client.findMany({
            take: 5,
            include: {
                _count: {
                    select: { services: true }
                }
            },
            orderBy: {
                services: {
                    _count: 'desc'
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                financial: { income, expense, net: income - expense },
                services: services.map(s => ({ status: s.status, count: s._count.id })),
                topClients: topClients.map(c => ({ name: c.name, serviceCount: c._count.services }))
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch reports' }, { status: 500 });
    }
}

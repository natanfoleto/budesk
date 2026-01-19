import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signJWT } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';
import { LoginResponse } from '@/lib/types'; // Assuming we exported this or defined it

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = loginSchema.parse(body);

        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Audit Login Attempt (Start)
        // We will update this to separate success/failure logic

        if (!user || !user.active) {
            // Log Failure
            await prisma.loginLog.create({
                data: {
                    email,
                    success: false,
                    ip: request.headers.get('x-forwarded-for') || 'unknown',
                    userAgent: request.headers.get('user-agent') || 'unknown',
                }
            });

            return NextResponse.json(
                { success: false, error: 'Credenciais inválidas ou usuário inativo.' },
                { status: 401 }
            );
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            // Log Failure
            await prisma.loginLog.create({
                data: {
                    email,
                    userId: user.id, // We know the user exists here
                    success: false,
                    ip: request.headers.get('x-forwarded-for') || 'unknown',
                    userAgent: request.headers.get('user-agent') || 'unknown',
                }
            });

            return NextResponse.json(
                { success: false, error: 'Credenciais inválidas.' },
                { status: 401 }
            );
        }

        // Role check not strictly needed for login unless we want to block certain roles, 
        // but the requirement says "Bloquear qualquer acesso não autorizado". 
        // Login gives a token, middleware blocks access.

        const token = await signJWT({
            id: user.id,
            email: user.email,
            role: user.role
        });

        const { password: _, ...userSafe } = user;

        // Log Success
        await prisma.loginLog.create({
            data: {
                email,
                userId: user.id,
                success: true,
                ip: request.headers.get('x-forwarded-for') || 'unknown',
                userAgent: request.headers.get('user-agent') || 'unknown',
            }
        });

        const response = NextResponse.json({
            success: true,
            data: {
                user: userSafe,
                token,
            },
        });

        // Set cookie for middleware
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno ao processar login.' },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth';

const protectedRoutes = ['/dashboard', '/api/users', '/api/services', '/api/financial'];
// Root '/' is public (Login). '/login' no longer exists.
const publicRoutes = ['/', '/api/auth/login', '/register'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow static assets
    if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.includes('.')) {
        return NextResponse.next();
    }

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    // If it's a public route (like login page or login API), verify if already logged in?
    // Optional: If visiting '/' and has token, redirect to dashboard.
    const token = request.cookies.get('token')?.value || request.headers.get('Authorization')?.replace('Bearer ', '');

    if (pathname === '/' && token) {
        // Verify token validity
        const payload = await verifyJWT(token);
        if (payload) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    if (!isProtectedRoute) {
        return NextResponse.next();
    }

    if (!token) {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/', request.url));
    }

    const payload = await verifyJWT(token);

    if (!payload) {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ success: false, error: 'Token inválido.' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/', request.url));
    }

    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.id as string);
    response.headers.set('x-user-role', payload.role as string); // Optional

    return response;
}

export const config = {
    matcher: ['/dashboard/:path*', '/api/:path*', '/'],
};

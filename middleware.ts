import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { verifyJWT } from '@/lib/auth'

const protectedRoutes = ['/dashboard', '/api/users', '/api/services', '/api/financial', '/api/employees']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow static assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.includes('.')) {
    return NextResponse.next()
  }

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  const token = request.cookies.get('token')?.value || request.headers.get('Authorization')?.replace('Bearer ', '')

  // Redirect to dashboard if trying to access login page (now root) with a valid token
  if (pathname === '/' && token) {
    const payload = await verifyJWT(token)
    if (payload) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  if (!token) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  const payload = await verifyJWT(token)

  if (!payload) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ success: false, error: 'Token inválido.' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  const response = NextResponse.next()
  response.headers.set('x-user-id', payload.id as string)
  response.headers.set('x-user-role', payload.role as string) 

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*', '/'],
}

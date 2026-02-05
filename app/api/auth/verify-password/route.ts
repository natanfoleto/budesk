import * as bcrypt from 'bcryptjs'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { verifyJWT } from '@/lib/auth'
import prisma from '@/lib/prisma'

const verifySchema = z.object({
  password: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const token = (await headers()).get('cookie')?.split('token=')[1]?.split(';')[0]
    
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })
    }

    const body = await request.json()
    const { password } = verifySchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json({ success: false, error: 'Senha incorreta' }, { status: 401 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Password verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao verificar senha' },
      { status: 500 }
    )
  }
}

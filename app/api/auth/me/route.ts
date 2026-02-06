
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { verifyJWT } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const payload = await verifyJWT(token)

    if (!payload?.id) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error fetching me:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"

import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") || "monthly-cost"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const year = searchParams.get("year") || new Date().getFullYear().toString()

    if (type === "monthly-cost") {
      // Aggregate salaries and taxes grouped by competencia
      const payments = await prisma.rHPayment.groupBy({
        by: ["competencia"],
        where: {
          competencia: {
            contains: year,
          },
        },
        _sum: {
          totalLiquido: true,
          totalBruto: true,
        },
        _count: {
          id: true,
        },
        orderBy: { competencia: "desc" },
        take: 12,
      })
      
      const reports = await Promise.all(
        payments.map(async (p) => {
          // get sum of employer contributions for this chunk
          const taxes = await prisma.employerContribution.aggregate({
            where: { pagamento: { competencia: p.competencia } },
            _sum: { totalEncargosEmpresa: true },
          })
          
          return {
            competencia: p.competencia,
            qtdFuncionarios: p._count.id,
            totalLiquido: Number(p._sum.totalLiquido || 0),
            totalEncargos: Number(taxes._sum.totalEncargosEmpresa || 0),
            totalGeral: Number(p._sum.totalLiquido || 0) + Number(taxes._sum.totalEncargosEmpresa || 0),
          }
        })
      )
      return NextResponse.json(reports)
    }

    if (type === "employee-cost") {
      let dateFilter = {}
      if (startDate && endDate) {
        dateFilter = {
          dataPagamento: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          }
        }
      }

      const employees = await prisma.employee.findMany({
        select: {
          id: true,
          name: true,
          rhPayments: {
            where: { status: "PAGO", ...dateFilter },
            select: {
              totalLiquido: true,
              totalBruto: true,
              encargos: {
                select: { totalEncargosEmpresa: true }
              }
            }
          }
        }
      })

      const reports = employees.map(emp => {
        const totalLiquido = emp.rhPayments.reduce((acc, p) => acc + Number(p.totalLiquido), 0)
        const totalEncargos = emp.rhPayments.reduce((acc, p) => acc + Number(p.encargos?.totalEncargosEmpresa || 0), 0)
        
        return {
          employeeId: emp.id,
          employeeName: emp.name,
          qtdPagamentos: emp.rhPayments.length,
          totalLiquido,
          totalEncargos,
          totalGeral: totalLiquido + totalEncargos,
        }
      }).filter(r => r.qtdPagamentos > 0)
      
      // Sort desc by total cost
      reports.sort((a, b) => b.totalGeral - a.totalGeral)

      return NextResponse.json(reports)
    }

    return NextResponse.json({ error: "Tipo de relatório não suportado" }, { status: 400 })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao gerar relatório" }, { status: 500 })
  }
}

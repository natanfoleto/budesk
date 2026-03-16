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
      // Aggregate salaries and taxes grouped by competenceMonth
      const payments = await prisma.rHPayment.groupBy({
        by: ["competenceMonth"],
        where: {
          competenceMonth: {
            contains: year,
          },
        },
        _sum: {
          netTotalInCents: true,
          grossTotalInCents: true,
        },
        _count: {
          id: true,
        },
        orderBy: { competenceMonth: "desc" },
        take: 12,
      })
      
      const reports = await Promise.all(
        payments.map(async (p) => {
          // get sum of employer contributions for this chunk
          const taxes = await prisma.employerContribution.aggregate({
            where: { payment: { competenceMonth: p.competenceMonth } },
            _sum: { totalCompanyTaxesInCents: true },
          })
          
          return {
            competenceMonth: p.competenceMonth,
            qtdFuncionarios: p._count.id,
            totalLiquido: Number(p._sum.netTotalInCents || 0),
            totalEncargos: Number(taxes._sum?.totalCompanyTaxesInCents || 0),
            totalGeral: Number(p._sum.netTotalInCents || 0) + Number(taxes._sum?.totalCompanyTaxesInCents || 0),
          }
        })
      )
      return NextResponse.json(reports)
    }

    if (type === "employee-cost") {
      let dateFilter = {}
      if (startDate && endDate) {
        dateFilter = {
          paymentDate: {
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
              netTotalInCents: true,
              grossTotalInCents: true,
              taxes: {
                select: { totalCompanyTaxesInCents: true }
              }
            }
          }
        }
      })

      interface ReportPayment {
        netTotalInCents: number | bigint
        grossTotalInCents: number | bigint
        taxes: { totalCompanyTaxesInCents: number | bigint }[]
      }

      interface ReportEmployee {
        id: string
        name: string
        rhPayments: ReportPayment[]
      }

      const typedEmployees = employees as unknown as ReportEmployee[]

      const reports = typedEmployees.map((emp) => {
        const totalLiquido = emp.rhPayments.reduce(
          (acc, p) => acc + Number(p.netTotalInCents),
          0
        )
        const totalEncargos = emp.rhPayments.reduce((accValue, p) => {
          const taxSum = p.taxes.reduce(
            (sum, t) => sum + Number(t.totalCompanyTaxesInCents),
            0
          )
          return accValue + taxSum
        }, 0)

        return {
          employeeId: emp.id,
          employeeName: emp.name,
          qtdPagamentos: emp.rhPayments.length,
          totalLiquido,
          totalEncargos,
          totalGeral: totalLiquido + totalEncargos,
        }
      }).filter((r) => r.qtdPagamentos > 0)
      
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

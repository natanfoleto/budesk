import "dotenv/config"

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

const rolesData = [
  { name: "Trabalhador Rural", salary: 1804.00 },
  { name: "Auxiliar Adm", salary: 1804.00 },
  { name: "Tecnico Segurança do Trabalho", salary: 3800.00 },
  { name: "Motorista de Onibus", salary: 1950.00 },
  { name: "Motorista de Caminhão", salary: 1950.00 },
  { name: "Operador de Maquinas", salary: 1950.00 },
  { name: "Tratorista", salary: 1950.00 },
  { name: "Fiscal de Campo", salary: 1950.00 },
  { name: "Operador de Pa Carregadeira", salary: 1950.00 },
]

const rawEmployees = [
  { name: "ADAILTON RODRIGUES BORGES", role: "Trabalhador Rural", cpf: "081.792.106-00", startDate: "2026-02-18 00:00:00.000" },
  { name: "ADAO DE JESUS BRITO", role: "Trabalhador Rural", cpf: "121.557.678-11", startDate: "2026-02-18 00:00:00.000" },
  { name: "AILTON PEREIRA LOPES", role: "Trabalhador Rural", cpf: "263.494.088-29", startDate: "2026-02-18 00:00:00.000" },
  { name: "ALDEMIR DE JESUS ALVES", role: "Trabalhador Rural", cpf: "082.665.056-24", startDate: "2026-02-18 00:00:00.000" },
  { name: "ALEXSSANDRO LOPES PEREIRA", role: "Trabalhador Rural", cpf: "180.091.636-19", startDate: "2026-02-18 00:00:00.000" },
  { name: "ANA MARIA DE SOUSA E SILVA", role: "Trabalhador Rural", cpf: "712.198.671-01", startDate: "2026-02-18 00:00:00.000" },
  { name: "ANA PAULA VICENTE", role: "Trabalhador Rural", cpf: "316.362.878-83", startDate: "2026-02-18 00:00:00.000" },
  { name: "ANDERSON PEREIRA DOS SANTOS", role: "Auxiliar Adm", cpf: "496.941.198-04", startDate: "2026-02-18 00:00:00.000" },
  { name: "ARLAN ROSENDO DA MOTA", role: "Trabalhador Rural", cpf: "170.801.866-25", startDate: "2026-02-18 00:00:00.000" },
  { name: "CARLOS DOUGLAS DOS SANTOS DA SILVA", role: "Trabalhador Rural", cpf: "388.726.918-77", startDate: "2026-02-18 00:00:00.000" },
  { name: "CAUA GUIMARAES MOTA", role: "Trabalhador Rural", cpf: "177.750.986-60", startDate: "2026-02-18 00:00:00.000" },
  { name: "CLAUDINO LISBOA RIBEIRO", role: "Trabalhador Rural", cpf: "139.559.656-51", startDate: "2026-02-18 00:00:00.000" },
  { name: "CLEUDMAR RODRIGUES DOS SANTOS", role: "Trabalhador Rural", cpf: "154.273.616-18", startDate: "2026-02-18 00:00:00.000" },
  { name: "DAVI REIS MATOS", role: "Trabalhador Rural", cpf: "092.213.555-00", startDate: "2026-02-18 00:00:00.000" },
  { name: "ELIAS ALVES NUNES", role: "Trabalhador Rural", cpf: "276.581.588-79", startDate: "2026-02-18 00:00:00.000" },
  { name: "ERASMO PEREIRA DOS SANTOS", role: "Fiscal de Campo", cpf: "200.483.698-96", startDate: "2026-02-18 00:00:00.000" },
  { name: "ERBIS PERON", role: "Trabalhador Rural", cpf: "299.431.628-56", startDate: "2026-02-18 00:00:00.000" },
  { name: "EUDES FERREIRA SOARES", role: "Trabalhador Rural", cpf: "162.552.586-96", startDate: "2026-02-18 00:00:00.000" },
  { name: "FABIO DE SOUZA OLIVEIRA", role: "Trabalhador Rural", cpf: "070.078.196-05", startDate: "2026-02-18 00:00:00.000" },
  { name: "FELIPE LOPES DE OLIVEIRA", role: "Trabalhador Rural", cpf: "154.557.606-88", startDate: "2026-02-18 00:00:00.000" },
  { name: "FIDELICIO OLIVEIRA DAS NEVES", role: "Trabalhador Rural", cpf: "279.006.598-54", startDate: "2026-02-18 00:00:00.000" },
  { name: "FRANCIVALDO DA SILVA BACELAR", role: "Trabalhador Rural", cpf: "611.850.133-50", startDate: "2026-02-03 00:00:00.000" },
  { name: "FRANCIVALDO FERREIRA", role: "Trabalhador Rural", cpf: "018.382.093-28", startDate: "2025-01-21 00:00:00.000" },
  { name: "GENIVALDO FERNANDES MOTA", role: "Motorista de Ônibus", cpf: "069.012.386-81", startDate: "2026-02-18 00:00:00.000" },
  { name: "GENIVALDO FERREIRA GUIMARÃES", role: "Fiscal de Campo", cpf: "092.274.716-42", startDate: "2026-02-18 00:00:00.000" },
  { name: "GUSTAVO HENRIQUE DA SILVA", role: "Tecnico Segurança do Trabalho", cpf: "313.749.468-00", startDate: "2026-02-18 00:00:00.000" },
  { name: "ISAK ALMEIDA ARAUJO", role: "Trabalhador Rural", cpf: "179.216.246-42", startDate: "2026-02-18 00:00:00.000" },
  { name: "JEAN LOPES DE OLIVEIRA", role: "Trabalhador Rural", cpf: "154.514.756-60", startDate: "2026-02-18 00:00:00.000" },
  { name: "JEFERSON APARECIDO TEODORO DE OLIVEIRA", role: "Operador de Pa Carregadeira", cpf: "375.506.158-96", startDate: "2025-02-14 00:00:00.000" },
  { name: "JOAO BATISTA NERES FARIAS", role: "Trabalhador Rural", cpf: "117.019.376-54", startDate: "2026-02-18 00:00:00.000" },
  { name: "JORGE LUIZ GERONIMO DE SOUSA", role: "Trabalhador Rural", cpf: "086.140.703-22", startDate: "2026-02-18 00:00:00.000" },
  { name: "JOSE BENICIO DE SOUSA JUNIOR", role: "Trabalhador Rural", cpf: "540.974.768-23", startDate: "2026-02-18 00:00:00.000" },
  { name: "JOSE GONCALVES DAS NEVES", role: "Trabalhador Rural", cpf: "074.754.506-51", startDate: "2026-02-18 00:00:00.000" },
  { name: "JOSE MAILSON COUTINHO DE SOUZA", role: "Trabalhador Rural", cpf: "077.047.616-33", startDate: "2026-02-18 00:00:00.000" },
  { name: "JOSE MANOEL CORREA CARNEIRO", role: "Trabalhador Rural", cpf: "134.264.316-02", startDate: "2026-02-18 00:00:00.000" },
  { name: "JUCIONE NUNES DA MOTA", role: "Trabalhador Rural", cpf: "143.481.006-24", startDate: "2026-02-18 00:00:00.000" },
  { name: "KAEL HENRIQUE DA COSTA FREITAS", role: "Tecnico Segurança do Trabalho", cpf: "467.280.328-78", startDate: "2026-02-18 00:00:00.000" },
  { name: "LUIZ EDUARDO DE SOUSA SILVA", role: "Trabalhador Rural", cpf: "097.272.083-98", startDate: "2025-01-22 00:00:00.000" },
  { name: "LUZIA FERREIRA MOREIRA DA SILVA", role: "Trabalhador Rural", cpf: "118.349.148-41", startDate: "2026-02-18 00:00:00.000" },
  { name: "MARIA EDUARDA COSTA MENDES", role: "Trabalhador Rural", cpf: "423.205.498-70", startDate: "2026-02-18 00:00:00.000" },
  { name: "NAILTON JOSE DA SILVA", role: "Trabalhador Rural", cpf: "040.084.813-97", startDate: "2026-02-18 00:00:00.000" },
  { name: "NILVANIO LOPES DA SILVA", role: "Trabalhador Rural", cpf: "134.756.106-47", startDate: "2026-02-18 00:00:00.000" },
  { name: "RAFAEL RODRIGUES DE SOUSA", role: "Trabalhador Rural", cpf: "706.886.536-42", startDate: "2026-02-18 00:00:00.000" },
  { name: "RAUL CESAR ALVES", role: "Trabalhador Rural", cpf: "263.942.408-42", startDate: "2026-02-18 00:00:00.000" },
  { name: "REINALDO PEREIRA DA SILVA", role: "Trabalhador Rural", cpf: "269.532.628-93", startDate: "2026-02-18 00:00:00.000" },
  { name: "RODRIGO APARECIDO FAGUNDES", role: "Trabalhador Rural", cpf: "372.865.898-73", startDate: "2026-02-18 00:00:00.000" },
  { name: "SAMUEL LOPES DE OLIVEIRA", role: "Trabalhador Rural", cpf: "167.074.566-01", startDate: "2026-02-18 00:00:00.000" },
  { name: "SANDRIEL FERREIRA DAS NEVES", role: "Trabalhador Rural", cpf: "183.924.136-52", startDate: "2026-02-18 00:00:00.000" },
  { name: "UELITON LEANDRO LUCARELLI", role: "Auxiliar Adm", cpf: "221.833.228-02", startDate: "2026-02-18 00:00:00.000" },
  { name: "UILIANS CARLOS DOS SANTOS", role: "Fiscal de Campo", cpf: "378.595.088-85", startDate: "2026-02-18 00:00:00.000" },
  { name: "VALDELINO ALVES DE BARROS", role: "Trabalhador Rural", cpf: "101.539.606-20", startDate: "2026-02-18 00:00:00.000" },
  { name: "VALDINEI CAETANO LEITE", role: "Trabalhador Rural", cpf: "158.012.726-66", startDate: "2026-02-18 00:00:00.000" },
  { name: "VALDIR LOPES DAMACENO", role: "Trabalhador Rural", cpf: "026.040.596-57", startDate: "2026-02-18 00:00:00.000" },
  { name: "WELISON GOMES DE OLIVEIRA BARROS", role: "Trabalhador Rural", cpf: "155.523.446-18", startDate: "2026-02-18 00:00:00.000" },
  { name: "ZILIOVALDO ARAUJO LOPES", role: "Trabalhador Rural", cpf: "142.968.178-09", startDate: "2026-02-18 00:00:00.000" },
  { name: "ALENILDO DA SILVA PEREIRA", role: "Operador de Maquinas", cpf: "110.882.364-56", startDate: "2026-02-18 00:00:00.000" },
  { name: "FABIO DE SOUZA MARTINS", role: "Motorista de Ônibus", cpf: "175.425.838-75", startDate: "2026-02-18 00:00:00.000" },
  { name: "FABIO JOSE BARBOSA", role: "Motorista de Ônibus", cpf: "196.414.478-74", startDate: "2026-02-18 00:00:00.000" },
  { name: "JAIR DE SOUZA MOREIRA", role: "Motorista de Ônibus", cpf: "048.969.228-16", startDate: "2026-02-18 00:00:00.000" },
  { name: "JOÃO PEDRO PEREIRA DA SILVA", role: "Motorista de Caminhão", cpf: "981.059.818-15", startDate: "2026-02-18 00:00:00.000" },
  { name: "JOSIVAN ANTONIO DA SILVA", role: "Operador de Maquinas", cpf: "145.649.594-17", startDate: "2026-02-18 00:00:00.000" },
  { name: "RONALDO CANDIDO", role: "Tratorista", cpf: "258.722.218-43", startDate: "2026-02-18 00:00:00.000" }
]

function normalizeRole(roleName: string): string {
  const norm = roleName.trim()
  if (norm === "Motorista de Ônibus") return "Motorista de Onibus"
  return norm
}

function cleanName(name: string): string {
  return name.replace(/\s+/g, ' ').trim()
}

async function main() {
  console.log("Starting seed-employeers...")

  // 1. Create/Update Jobs (Roles)
  const jobMap = new Map<string, string>()
  for (const role of rolesData) {
    const job = await prisma.job.upsert({
      where: { id: `seed-job-${role.name.replace(/\s+/g, '-').toLowerCase()}` },
      update: { name: role.name, active: true },
      create: { 
        id: `seed-job-${role.name.replace(/\s+/g, '-').toLowerCase()}`,
        name: role.name, 
        active: true 
      },
    })
    jobMap.set(role.name, job.id)
  }

  // 2. Create/Update Employees and Employment Records
  for (const emp of rawEmployees) {
    const normalizedRole = normalizeRole(emp.role)
    const roleConfig = rolesData.find(r => r.name === normalizedRole)
    const jobId = jobMap.get(normalizedRole)
    const salaryInCents = roleConfig ? Math.round(roleConfig.salary * 100) : 0
    const name = cleanName(emp.name)

    if (!jobId) {
      console.warn(`Job not found for role: ${emp.role} (normalized: ${normalizedRole})`)
      continue
    }

    // Upsert Employee
    const employee = await prisma.employee.upsert({
      where: { document: emp.cpf },
      update: {
        name: name,
        role: normalizedRole,
        jobId: jobId,
        active: true,
      },
      create: {
        name: name,
        document: emp.cpf,
        role: normalizedRole,
        jobId: jobId,
        active: true,
      },
    })

    // Create Employment Record (CLT)
    // Check if record already exists for this admission date
    const existingRecord = await prisma.employmentRecord.findFirst({
      where: {
        employeeId: employee.id,
        admissionDate: new Date(emp.startDate),
      },
    })

    if (!existingRecord) {
      await prisma.employmentRecord.create({
        data: {
          employeeId: employee.id,
          admissionDate: new Date(emp.startDate),
          jobTitle: normalizedRole,
          baseSalaryInCents: salaryInCents,
          contractType: "CLT",
          isActive: true,
        },
      })
    } else {
      await prisma.employmentRecord.update({
        where: { id: existingRecord.id },
        data: {
          jobTitle: normalizedRole,
          baseSalaryInCents: salaryInCents,
          isActive: true,
        }
      })
    }
  }

  console.log("Seed-employeers completed successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

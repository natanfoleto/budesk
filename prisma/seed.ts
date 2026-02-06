import "dotenv/config"

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, UserRole } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  // Clear database - delete child tables first
  await prisma.loginLog.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.vehicleUsage.deleteMany()
  await prisma.document.deleteMany()
  await prisma.financialTransaction.deleteMany()
  await prisma.accountPayable.deleteMany()
  await prisma.employeeAdvance.deleteMany()
  await prisma.service.deleteMany()
  await prisma.client.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.user.deleteMany()

  const hashedPassword = await bcrypt.hash('admin', 10)

  const root = await prisma.user.upsert({
    where: { email: 'root@budesk.com' },
    update: {
      role: UserRole.ROOT,
    },
    create: {
      email: 'root@budesk.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: UserRole.ROOT,
      active: true,
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@budesk.com' },
    update: {
      role: UserRole.ADMIN,
    },
    create: {
      email: 'admin@budesk.com',
      name: 'Administrador',
      password: hashedPassword,
      role: UserRole.ADMIN,
      active: true,
    },
  })

  console.log({ root, admin })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

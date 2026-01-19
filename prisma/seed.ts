import { PrismaClient, UserRole } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import "dotenv/config"

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    const hashedPassword = await bcrypt.hash('admin', 10)

    const admin = await prisma.user.upsert({
        where: { email: 'admin@budesk.com' },
        update: {},
        create: {
            email: 'admin@budesk.com',
            name: 'Administrador',
            password: hashedPassword,
            role: UserRole.ADMIN,
            active: true,
        },
    })
    console.log({ admin })
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

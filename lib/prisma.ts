import { PrismaClient } from "@prisma/client";

import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});


const prismaClientSingleton = () => {
    return new PrismaClient({ adapter });
};


// We will use a plain client for now and extend it with a custom audit function helper
// because automatic middleware requires passing User Context which is hard in RSC/Next.js without CLS.
// But we will setup the Singleton correctly.

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
// export default prismaClientSingleton();







const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const certs = await prisma.certificate.findMany();
  console.log(JSON.stringify(certs, null, 2));
}

run().finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.certificate.deleteMany({
    where: { title: "[object Object]" }
  });
  console.log("Deleted broken certificates");
}

run().finally(() => prisma.$disconnect());

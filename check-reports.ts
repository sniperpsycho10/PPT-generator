import { PrismaClient } from '@prisma/client';
async function run() {
  const prisma = new PrismaClient();
  const reports = await prisma.generatedReport.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("Last 5 reports:", reports);
}
run();

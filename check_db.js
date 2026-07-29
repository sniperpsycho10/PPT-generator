const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const submissions = await prisma.submission.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  console.log("Latest 10 submissions:");
  submissions.forEach(s => {
    console.log(`ID: ${s.id} | Type: ${s.type}`);
    console.log(`  beforeImageUrl: ${s.beforeImageUrl}`);
    console.log(`  afterImageUrl: ${s.afterImageUrl}`);
    console.log(`  attachmentUrl: ${s.attachmentUrl}`);
    console.log(`  supportingImages:`, s.supportingImages);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());

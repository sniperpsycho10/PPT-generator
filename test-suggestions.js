const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const suggestions = await prisma.suggestion.findMany({ where: { status: "Accepted" } });
  console.log("Total Accepted Suggestions:", suggestions.length);
  suggestions.forEach(s => {
    console.log(`ID: ${s.id}, submissionId: '${s.submissionId}'`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const suggestions = await prisma.suggestion.findMany();
  for (const s of suggestions) {
    if (s.guestDept.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const dept = await prisma.department.findUnique({ where: { id: s.guestDept } });
      if (dept) {
        await prisma.suggestion.update({
          where: { id: s.id },
          data: { guestDept: dept.name }
        });
        console.log(`Updated suggestion ${s.id} with dept ${dept.name}`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

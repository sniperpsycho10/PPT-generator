import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // 1. Create Default Departments
  const departments = [
    'IT', 'HR', 'Finance', 'Engineering', 'Operations', 'Sales'
  ];

  for (const name of departments) {
    const existing = await prisma.department.findFirst({ where: { name } });
    if (!existing) {
      await prisma.department.create({
        data: {
          name,
          qrCodeHash: `qr-${name.toLowerCase().replace(/ /g, '-')}-${Date.now()}`
        }
      });
    }
  }
  console.log("✓ Departments seeded")

  // 2. Create SuperAdmin
  const adminEmail = 'admin@jspl.com';
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'SuperAdmin' },
    create: {
      email: adminEmail,
      name: 'System Admin',
      passwordHash: hashedPassword,
      role: 'SuperAdmin'
    }
  })
  console.log("✓ SuperAdmin user seeded (admin@jspl.com / admin123)")

  // 3. Create Default Active Cycle
  const existingCycle = await prisma.cycle.findFirst({
    where: { isActive: true }
  });

  if (!existingCycle) {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);

    await prisma.cycle.create({
      data: {
        name: `Current Cycle (${today.getFullYear()})`,
        startDate: today,
        endDate: nextMonth,
        isActive: true
      }
    });
    console.log("✓ Active Cycle seeded")
  } else {
    console.log("✓ Active Cycle already exists")
  }

  console.log("Seeding complete!")
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

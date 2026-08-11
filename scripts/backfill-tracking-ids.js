const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfill() {
  console.log("Starting backfill of tracking IDs for Repetitive Problems...");
  
  const problems = await prisma.submission.findMany({
    where: { type: 'RepetitiveProblem' },
    orderBy: { createdAt: 'asc' }
  });

  const countsByMonth = {};

  for (const problem of problems) {
    if (problem.trackingId) continue; // Skip if already has one

    const date = new Date(problem.createdAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `P-${year}${month}-`;

    if (!countsByMonth[prefix]) {
      countsByMonth[prefix] = 1;
    } else {
      countsByMonth[prefix]++;
    }

    const sequence = String(countsByMonth[prefix]).padStart(3, '0');
    const newTrackingId = `${prefix}${sequence}`;

    await prisma.submission.update({
      where: { id: problem.id },
      data: { trackingId: newTrackingId }
    });

    console.log(`Assigned ${newTrackingId} to ${problem.title}`);
  }

  console.log("Backfill complete!");
  process.exit(0);
}

backfill().catch(e => {
  console.error(e);
  process.exit(1);
});

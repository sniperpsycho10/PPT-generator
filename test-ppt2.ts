import { generateWorkshopPpt } from './src/services/ppt/pptGenerator';
import { PrismaClient } from '@prisma/client';

async function run() {
  const prisma = new PrismaClient();
  const allSubmissions = await prisma.submission.findMany({
    where: { status: 'Accepted' },
    include: {
      department: true,
      user: true,
    }
  });
  console.log("Found", allSubmissions.length, "submissions");
  try {
    const payload = {
      submissions: allSubmissions,
      origin: "http://localhost:4000",
      customColors: { bg: 'F0F4F8', textBody: '333333', textHeading: '0A3D62', accentPrimary: '7DB87F', accentSecondary: 'F4805A', accentTertiary: '4A90E2', isDarkMode: false },
      templateStyle: 'corporate',
      activeCycleRemarks: { bpRemarks: "-", rpRemarks: "-" }
    };
    const result = await generateWorkshopPpt(payload);
    console.log("Success!", result);
  } catch (err) {
    console.error("PPT Generation Error:", err);
  }
}
run();

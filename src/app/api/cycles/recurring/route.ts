import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/authHelpers";

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const data = await req.json();
    const { count, startMonth, startYear } = data;

    if (!count || !startMonth || !startYear) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];
    
    const cyclesToCreate = [];
    let currentMonth = parseInt(startMonth); // 1-12
    let currentYear = parseInt(startYear);

    for (let i = 0; i < parseInt(count); i++) {
      const name = `${monthNames[currentMonth - 1]} ${currentYear}`;
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59); // Last day of month

      cyclesToCreate.push({
        name,
        month: currentMonth.toString(),
        year: currentYear.toString(),
        startDate,
        endDate,
        isActive: i === 0 // only make the first one active by default? or all true? Let's say all true, but they naturally lock via endDate
      });

      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    // Upsert or create many (CreateMany handles duplicates if we ignore them, but Prisma createMany doesn't easily ignore on postgres without skipDuplicates)
    const created = await prisma.cycle.createMany({
      data: cyclesToCreate,
      skipDuplicates: true
    });

    return NextResponse.json({ success: true, count: created.count });
  } catch (error) {
    console.error("Recurring Cycles Error:", error);
    return NextResponse.json({ error: "Failed to generate cycles" }, { status: 500 });
  }
}

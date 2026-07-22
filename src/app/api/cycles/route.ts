import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const cycles = await prisma.cycle.findMany({
      orderBy: { startDate: 'desc' }
    });
    return NextResponse.json({ success: true, data: cycles });
  } catch (error) {
    console.error("Fetch Cycles Error:", error);
    return NextResponse.json({ error: "Failed to fetch cycles" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userRole = (session.user as any).role;
    if (userRole !== 'Admin' && userRole !== 'Super Admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await req.json();
    const { name, month, year, startDate, endDate, isActive, bpRemarks, rpRemarks } = data;

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newCycle = await prisma.cycle.create({
      data: {
        name,
        month,
        year,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive !== undefined ? isActive : true,
        bpRemarks,
        rpRemarks
      }
    });

    // Create a global notification for all users
    const allUsers = await prisma.user.findMany({ select: { id: true } });
    const notifications = allUsers.map((user: { id: string }) => ({
      userId: user.id,
      title: "New Submission Cycle Opened",
      message: `The ${name} cycle is now open for submissions! The deadline is ${new Date(endDate).toLocaleDateString()}.`,
      isRead: false,
      link: "/dashboard/submit-suggestion"
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    return NextResponse.json({ success: true, data: newCycle });
  } catch (error: any) {
    console.error("Create Cycle Error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "A cycle with this name already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create cycle" }, { status: 500 });
  }
}

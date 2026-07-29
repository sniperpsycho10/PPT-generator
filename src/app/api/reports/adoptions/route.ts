import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/authHelpers";

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;

    // Could add role-based filtering here if needed, e.g., Admins see all, Users see their dept
    const adoptions = await prisma.adoption.findMany({
      include: {
        user: {
          include: { department: true }
        },
        submission: {
          include: { department: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: adoptions });
  } catch (error) {
    console.error("Fetch Adoptions Error:", error);
    return NextResponse.json({ error: "Failed to fetch adoptions" }, { status: 500 });
  }
}

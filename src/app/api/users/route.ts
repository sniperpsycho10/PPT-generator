import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authHelpers";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const { userRole } = auth;

    const admins = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        department: {
          select: { name: true }
        }
      },
      orderBy: {
        role: 'desc' // SuperAdmin first usually
      }
    });

    return NextResponse.json({ users: admins, currentUserRole: userRole });
  } catch (error) {
    console.error("Failed to fetch admin users:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

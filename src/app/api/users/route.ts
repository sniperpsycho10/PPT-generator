import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    
    // Security check: only allow Admins to view this
    if (userRole !== 'Admin' && userRole !== 'Super Admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admins = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true
      },
      orderBy: {
        role: 'desc' // Super Admin first usually
      }
    });

    return NextResponse.json({ users: admins, currentUserRole: userRole });
  } catch (error) {
    console.error("Failed to fetch admin users:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

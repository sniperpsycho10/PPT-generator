import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
    const userRole = dbUser?.role;
    
    // Security check: only allow Admins to poll recent suggestions
    if (userRole !== 'Admin' && userRole !== 'Super Admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since");

    if (!since) {
      return NextResponse.json({ error: "Missing 'since' timestamp" }, { status: 400 });
    }

    const dateSince = new Date(since);

    const newSuggestions = await prisma.suggestion.findMany({
      where: {
        createdAt: {
          gt: dateSince
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json(newSuggestions);
  } catch (error) {
    console.error("Failed to fetch recent suggestions:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

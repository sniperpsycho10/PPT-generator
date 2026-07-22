import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Middleware to check Admin role
async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return false;
  
  const userId = (session.user as any).id;
  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!dbUser || (dbUser.role !== 'Admin' && dbUser.role !== 'Super Admin')) {
    return false;
  }
  return true;
}

// GET all teams
export async function GET(req: Request) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const teams = await prisma.team.findMany({
      include: {
        members: {
          select: { id: true, name: true, email: true, role: true, departmentId: true, image: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: teams });
  } catch (error) {
    console.error("Failed to fetch teams:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// POST create a new team
export async function POST(req: Request) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, memberIds } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    const newTeam = await prisma.team.create({
      data: {
        name: name.trim(),
        members: {
          connect: memberIds?.map((id: string) => ({ id })) || []
        }
      },
      include: {
        members: {
          select: { id: true, name: true, email: true, role: true, departmentId: true, image: true }
        }
      }
    });

    if (memberIds && memberIds.length > 0) {
      await prisma.notification.createMany({
        data: memberIds.map((id: string) => ({
          userId: id,
          title: "Added to Team",
          message: `You have been added to the team: ${name.trim()}`,
          link: "/dashboard"
        }))
      });
    }

    return NextResponse.json({ success: true, data: newTeam });
  } catch (error: any) {
    console.error("Failed to create team:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "A team with this name already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

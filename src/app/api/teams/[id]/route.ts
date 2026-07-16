import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, memberIds } = body;
    const { id } = await props.params;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    const updatedTeam = await prisma.team.update({
      where: { id: id },
      data: {
        name: name.trim(),
        members: {
          set: memberIds?.map((memberId: string) => ({ id: memberId })) || []
        }
      },
      include: {
        members: {
          select: { id: true, name: true, email: true, role: true, departmentId: true, image: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: updatedTeam });
  } catch (error: any) {
    console.error("Failed to update team:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "A team with this name already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await props.params;

    await prisma.team.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete team:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

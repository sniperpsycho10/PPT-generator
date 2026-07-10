import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = params.id;
    const { status } = await req.json();

    const updated = await prisma.suggestion.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update suggestion" }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    const params = await props.params;
    const id = params.id;
    
    if (userRole !== 'Admin' && userRole !== 'Super Admin') {
      const sug = await prisma.suggestion.findUnique({ where: { id }, include: { submission: true } });
      if (sug?.suggestedById !== userId && sug?.submission?.userId !== userId) {
        return NextResponse.json({ error: "Unauthorized to delete" }, { status: 403 });
      }
    }

    await prisma.suggestion.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete suggestion" }, { status: 500 });
  }
}

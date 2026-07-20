import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = params.id;
    const { status, assignedTeamId, guestName, guestDept, suggestionText } = await req.json();

    const dataToUpdate: any = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (assignedTeamId !== undefined) dataToUpdate.assignedTeamId = assignedTeamId;
    if (guestName !== undefined) dataToUpdate.guestName = guestName;
    if (guestDept !== undefined) dataToUpdate.guestDept = guestDept;
    if (suggestionText !== undefined) dataToUpdate.suggestionText = suggestionText;

    const updated = await prisma.suggestion.update({
      where: { id },
      data: dataToUpdate
    });

    if (assignedTeamId) {
      const team = await prisma.team.findUnique({
        where: { id: assignedTeamId },
        include: { members: true }
      });
      if (team && team.members.length > 0) {
        await prisma.notification.createMany({
          data: team.members.map((m) => ({
            userId: m.id,
            title: "New Assignment",
            message: `Your team (${team.name}) has been assigned a new suggestion: ${updated.suggestionText || 'View details'}`,
            link: "/dashboard/tracking"
          }))
        });
      }
    }

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

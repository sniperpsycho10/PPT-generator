import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const isAdmin = userRole === 'Admin' || userRole === 'Super Admin';

    const params = await props.params;
    const id = params.id;
    const data = await req.json();

    const suggestion = await prisma.suggestion.findUnique({
      where: { id },
      include: {
        assignedTeam: {
          include: { members: true }
        }
      }
    });

    if (!suggestion) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isMember = suggestion.assignedTeam?.members.some(m => m.id === userId);
    if (!isAdmin && !isMember) {
      return NextResponse.json({ error: "Forbidden: Not in assigned team" }, { status: 403 });
    }

    const parseCost = (val: any) => {
      if (!val || String(val).trim() === "") return null;
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    };

    const parseDate = (val: any) => {
      if (!val || String(val).trim() === "") return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    const updateData: any = {
      implementationStage: data.implementationStage || null,
      safetyImpact: data.safetyImpact || null,
      costImplication: parseCost(data.costImplication),
      executingDepartment: data.executingDepartment || null,
      targetCompletionDate: parseDate(data.targetCompletionDate),
      actualCompletionDate: parseDate(data.actualCompletionDate),
      trackingRemarks: data.trackingRemarks || null,
    };

    if (isAdmin && data.assignedTeamId !== undefined) {
      const newTeamId = data.assignedTeamId === "" ? null : data.assignedTeamId;
      
      // If team changed to a new team, notify members
      if (newTeamId && newTeamId !== suggestion.assignedTeamId) {
        const teamWithMembers = await prisma.team.findUnique({
          where: { id: newTeamId },
          include: { members: true }
        });

        if (teamWithMembers && teamWithMembers.members.length > 0) {
          const notificationData = teamWithMembers.members.map(member => ({
            userId: member.id,
            title: "New Assignment",
            message: `Your team (${teamWithMembers.name}) has been assigned to a new suggestion.`,
            link: `/dashboard/tracking`, // Optional link to redirect users
          }));
          
          await prisma.notification.createMany({
            data: notificationData
          });
        }
      }
      
      updateData.assignedTeamId = newTeamId;
    }

    const updated = await prisma.suggestion.update({
      where: { id },
      data: updateData,
      include: {
        assignedTeam: true,
        progressLog: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Tracking Update Error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to update tracking fields", details: error }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
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

    const progressValue = parseInt(data.progress);
    if (isNaN(progressValue) || progressValue < 0 || progressValue > 100) {
      return NextResponse.json({ error: "Invalid progress value" }, { status: 400 });
    }

    // Create the progress log entry
    const progressLog = await prisma.suggestionProgress.create({
      data: {
        suggestionId: id,
        progress: progressValue,
        notes: data.notes || null,
        photoUrls: data.photoUrls || [],
        attachedFileUrl: data.attachedFileUrl || null,
        attachedFileName: data.attachedFileName || null
      }
    });

    // Update the master suggestion currentProgress
    const updatedSuggestion = await prisma.suggestion.update({
      where: { id },
      data: {
        currentProgress: progressValue
      },
      include: {
        assignedTeam: true,
        progressLog: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json({ success: true, data: updatedSuggestion });
  } catch (error: any) {
    console.error("Progress Update Error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to update progress", details: error }, { status: 500 });
  }
}

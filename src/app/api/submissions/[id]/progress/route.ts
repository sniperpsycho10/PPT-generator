import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const isAdmin = userRole === 'Admin' || userRole === 'SuperAdmin';

    const params = await props.params;
    const id = params.id;
    const data = await req.json();

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        assignedTeam: {
          include: { members: true }
        }
      }
    });

    if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (userRole === 'User') {
      const isMember = submission.assignedTeam?.members.some((m: any) => m.id === userId);
      if (!isMember) {
        return NextResponse.json({ error: "Forbidden: Not in assigned team" }, { status: 403 });
      }
    }

    const progressValue = parseInt(data.progress);
    if (isNaN(progressValue) || progressValue < 0 || progressValue > 100) {
      return NextResponse.json({ error: "Invalid progress value" }, { status: 400 });
    }

    // Create the progress log entry
    await prisma.problemProgress.create({
      data: {
        submissionId: id,
        progress: progressValue,
        notes: data.notes || null,
        photoUrls: data.photoUrls || [],
        attachedFileUrl: data.attachedFileUrl || null,
        attachedFileName: data.attachedFileName || null
      }
    });

    // Update the master submission progress
    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        progress: progressValue,
        // Optional: you can automatically close the trackingStatus if progress is 100
        trackingStatus: progressValue === 100 ? "Closed" : "Open"
      },
      include: {
        assignedTeam: true,
        progressLog: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json({ success: true, data: updatedSubmission });
  } catch (error: any) {
    console.error("Progress Update Error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to update progress", details: error }, { status: 500 });
  }
}

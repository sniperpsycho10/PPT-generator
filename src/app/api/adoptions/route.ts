import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { submissionId } = body;

    if (!submissionId) {
      return NextResponse.json({ error: "Submission ID is required" }, { status: 400 });
    }

    // Check if already adopted
    const existing = await prisma.adoption.findFirst({
      where: {
        userId,
        submissionId
      }
    });

    if (existing) {
      // Toggle off (un-adopt)
      await prisma.adoption.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, adopted: false });
    } else {
      // Adopt
      await prisma.adoption.create({
        data: {
          userId,
          submissionId
        }
      });
      return NextResponse.json({ success: true, adopted: true });
    }

  } catch (error) {
    console.error("Adoption error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

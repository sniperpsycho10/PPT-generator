import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/authHelpers";

export async function POST(req: Request) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const data = await req.json();
    const { text, submissionId, suggestionId } = data;

    if (!text || (!submissionId && !suggestionId)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        text,
        userId,
        submissionId,
        suggestionId
      },
      include: {
        user: { select: { name: true, image: true } }
      }
    });

    return NextResponse.json({ success: true, data: comment });
  } catch (error) {
    console.error("Create Comment Error:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get("submissionId");
    const suggestionId = searchParams.get("suggestionId");

    if (!submissionId && !suggestionId) {
      return NextResponse.json({ error: "Missing reference ID" }, { status: 400 });
    }

    let whereClause: any = { deletedAt: null };
    if (submissionId) whereClause.submissionId = submissionId;
    if (suggestionId) whereClause.suggestionId = suggestionId;

    const comments = await prisma.comment.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, image: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    console.error("Fetch Comments Error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

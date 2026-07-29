import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/authHelpers";

export async function GET(req: Request) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get("submissionId");

    if (!submissionId) {
      return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
    }

    const versions = await prisma.submissionVersion.findMany({
      where: { submissionId },
      include: {
        updatedBy: { select: { name: true, email: true } }
      },
      orderBy: { versionNum: 'desc' }
    });

    return NextResponse.json({ success: true, data: versions });
  } catch (error) {
    console.error("Fetch Versions Error:", error);
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 });
  }
}

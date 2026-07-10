import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userRole = (session.user as any).role;

    if (userRole !== 'Admin' && userRole !== 'Super Admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const params = await props.params;
    const id = params.id;
    const { status } = await req.json();

    if (!['Accepted', 'Rejected', 'Draft', 'Submitted'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await prisma.submission.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ success: true, submission: updated });
  } catch (error) {
    console.error("Status Update Error:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}

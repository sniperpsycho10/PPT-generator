import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    // const session = await getServerSession(authOptions);
    // if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // const userRole = (session.user as any).role;

    // if (userRole !== 'Admin' && userRole !== 'Super Admin') {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    // }

    const params = await props.params;
    const id = params.id;
    const data = await req.json();

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

    const updated = await prisma.suggestion.update({
      where: { id },
      data: {
        implementationStage: data.implementationStage || null,
        safetyImpact: data.safetyImpact || null,
        costImplication: parseCost(data.costImplication),
        executingDepartment: data.executingDepartment || null,
        targetCompletionDate: parseDate(data.targetCompletionDate),
        actualCompletionDate: parseDate(data.actualCompletionDate),
        trackingRemarks: data.trackingRemarks || null,
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Tracking Update Error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to update tracking fields", details: error }, { status: 500 });
  }
}

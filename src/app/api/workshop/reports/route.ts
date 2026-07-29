import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { generateWorkshopPpt } from "@/services/ppt/pptGenerator";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reports = await prisma.generatedReport.findMany({
      orderBy: { createdAt: 'desc' },
      include: { createdBy: true }
    });

    return NextResponse.json({ success: true, data: reports });
  } catch (error) {
    console.error("Fetch Reports Error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();

    // Create a new GeneratedReport in pending state
    const report = await prisma.generatedReport.create({
      data: {
        title: body.template ? `Workshop PPT (${body.template} template)` : `Workshop PPT`,
        status: "Pending",
        progress: 0,
        createdById: userId
      }
    });

    // Start background generation asynchronously (non-blocking)
    // We pass the report.id to the generator so it can update progress.
    generateWorkshopPpt(body, report.id).catch(err => {
      console.error("Async PPT generation failed:", err);
      require('fs').writeFileSync('/home/sniperpsycho7/jspl/ppt-error.log', String(err.stack || err));
      prisma.generatedReport.update({
        where: { id: report.id },
        data: { status: "Failed", progress: 0 }
      }).catch((e: any) => console.error(e));
    });

    return NextResponse.json({ success: true, reportId: report.id });
  } catch (error) {
    console.error("Create Report Error:", error);
    return NextResponse.json({ error: "Failed to initiate PPT generation" }, { status: 500 });
  }
}

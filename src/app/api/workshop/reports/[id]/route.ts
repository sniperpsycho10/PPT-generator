import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;

    const report = await prisma.generatedReport.findUnique({
      where: { id: params.id }
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error("Fetch Report Error:", error);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}

import fs from 'fs';
import path from 'path';

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;

    const report = await prisma.generatedReport.findUnique({
      where: { id: params.id }
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.fileUrl) {
      try {
        if (report.fileUrl.startsWith('/uploads/')) {
          const filePath = path.join(process.cwd(), 'public', report.fileUrl);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      } catch (err) {
        console.error("Error deleting physical PPT file:", err);
      }
    }

    await prisma.generatedReport.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Report Error:", error);
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}

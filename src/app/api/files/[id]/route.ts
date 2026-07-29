import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import fs from "fs/promises";
import path from "path";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const fileHash = params.id;

    const attachment = await prisma.attachment.findUnique({
      where: { hash: fileHash }
    });

    if (!attachment) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fullPath = path.resolve(attachment.filePath);
    
    // Safety check to ensure path is inside data/uploads
    const uploadDir = path.resolve(process.cwd(), "data", "uploads");
    if (!fullPath.startsWith(uploadDir)) {
      return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
    }

    try {
      const fileBuffer = await fs.readFile(fullPath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": attachment.mimeType,
          "Cache-Control": "public, max-age=31536000, immutable" // Cache indefinitely
        }
      });
    } catch (e) {
      return NextResponse.json({ error: "File read error" }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (e) {
    // Ignore error if it exists
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 5MB limit" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only images and PDFs are allowed." }, { status: 400 });
    }

    await ensureUploadDir();
    
    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);
    let mimeType = file.type;

    // Optional: Compress image if it's an image type
    if (file.type.startsWith("image/")) {
      try {
        buffer = await sharp(buffer)
          .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
        mimeType = "image/jpeg";
      } catch (err) {
        console.warn("Sharp image processing failed, using original buffer", err);
      }
    }

    // Hash the (potentially processed) buffer for duplicate detection
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    const existingFile = await prisma.attachment.findUnique({
      where: { hash }
    });

    if (existingFile) {
      return NextResponse.json({ success: true, url: existingFile.url });
    }

    // Save new file
    const extension = mimeType === "image/jpeg" ? ".jpg" : (mimeType === "application/pdf" ? ".pdf" : path.extname(file.name));
    const filename = `${hash}${extension}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    await fs.writeFile(filePath, buffer);

    const url = `/api/files/${hash}`; // Secure API endpoint
    
    await prisma.attachment.create({
      data: {
        filename,
        originalName: file.name,
        mimeType,
        size: buffer.length,
        hash,
        filePath,
        url
      }
    });

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/authHelpers";
import prisma from "@/lib/db";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const allAttachments = await prisma.attachment.findMany();
    const submissions = await prisma.submission.findMany({
      select: {
        beforeImageUrl: true,
        afterImageUrl: true,
        attachmentUrl: true,
        supportingImages: true,
      }
    });

    // Collect all referenced URLs
    const referencedUrls = new Set<string>();
    
    for (const sub of submissions) {
      if (sub.beforeImageUrl) referencedUrls.add(sub.beforeImageUrl);
      if (sub.afterImageUrl) referencedUrls.add(sub.afterImageUrl);
      if (sub.attachmentUrl) referencedUrls.add(sub.attachmentUrl);
      if (sub.supportingImages && Array.isArray(sub.supportingImages)) {
        sub.supportingImages.forEach((img: any) => {
          if (img && typeof img === 'string') referencedUrls.add(img);
        });
      }
    }

    let deletedCount = 0;
    let errorsCount = 0;

    for (const attachment of allAttachments) {
      if (!referencedUrls.has(attachment.url)) {
        // This attachment is orphaned
        try {
          // Delete physical file
          const fullPath = path.resolve(attachment.filePath);
          await fs.unlink(fullPath).catch(() => {});
          
          // Delete DB record
          await prisma.attachment.delete({
            where: { id: attachment.id }
          });
          
          deletedCount++;
        } catch (err) {
          console.error("Error deleting attachment:", attachment.id, err);
          errorsCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup completed. Deleted ${deletedCount} unused files. Errors: ${errorsCount}`
    });

  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}

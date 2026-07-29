import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/authHelpers";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    // Fetch submissions with attachments
    const submissions = await prisma.submission.findMany({
      where: {
        OR: [
          { beforeImageUrl: { not: null } },
          { afterImageUrl: { not: null } },
          { attachmentUrl: { not: null } }
        ]
      },
      select: { id: true, title: true, beforeImageUrl: true, afterImageUrl: true, attachmentUrl: true }
    });

    // We can also fetch SuggestionProgress and ActionItem attachments later if needed,
    // but for now we aggregate submission attachments as an example.
    
    let allAttachments: any[] = [];
    
    submissions.forEach((sub: any) => {
      if (sub.beforeImageUrl) allAttachments.push({ type: 'Before Image', url: sub.beforeImageUrl, source: sub.title, id: sub.id });
      if (sub.afterImageUrl) allAttachments.push({ type: 'After Image', url: sub.afterImageUrl, source: sub.title, id: sub.id });
      if (sub.attachmentUrl) allAttachments.push({ type: 'Attachment', url: sub.attachmentUrl, source: sub.title, id: sub.id });
    });

    return NextResponse.json({ success: true, data: allAttachments });
  } catch (error) {
    console.error("Fetch Attachments Error:", error);
    return NextResponse.json({ error: "Failed to fetch attachments" }, { status: 500 });
  }
}

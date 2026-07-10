import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let guestName = "Anonymous";
    let guestDept = "General";
    let suggestionText = "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      guestName = formData.get("guestName")?.toString() || "Anonymous";
      guestDept = formData.get("guestDept")?.toString() || "General";
      suggestionText = formData.get("suggestionText")?.toString() || "";
    } else {
      const body = await req.json();
      guestName = body.guestName || "Anonymous";
      guestDept = body.guestDept || "General";
      suggestionText = body.suggestionText;
    }

    if (!suggestionText) {
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const host = req.headers.get("host") || "localhost:4000";
        const protocol = req.headers.get("x-forwarded-proto") || "http";
        return NextResponse.redirect(`${protocol}://${host}/feedback?error=missing_text`, { status: 303 });
      }
      return NextResponse.json({ error: "Suggestion text is required" }, { status: 400 });
    }

    const suggestion = await prisma.suggestion.create({
      data: {
        guestName,
        guestDept,
        suggestionText,
        status: "Pending"
      }
    });

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const host = req.headers.get("host") || "localhost:4000";
      const protocol = req.headers.get("x-forwarded-proto") || "http";
      return NextResponse.redirect(`${protocol}://${host}/feedback?success=true`, { status: 303 });
    }

    return NextResponse.json({ success: true, data: suggestion });
  } catch (error) {
    console.error("Failed to submit suggestion:", error);
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const host = req.headers.get("host") || "localhost:4000";
      const protocol = req.headers.get("x-forwarded-proto") || "http";
      return NextResponse.redirect(`${protocol}://${host}/feedback?error=server_error`, { status: 303 });
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const userId = (session.user as any).id;
    
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    const userRole = dbUser?.role;

    let whereClause = {};
    if (userRole !== 'Admin' && userRole !== 'Super Admin') {
      whereClause = {
        OR: [
          { suggestedById: userId },
          { submission: { userId: userId } }
        ]
      };
    }

    const suggestions = await prisma.suggestion.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { submission: true }
    });
    return NextResponse.json({ success: true, data: suggestions });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

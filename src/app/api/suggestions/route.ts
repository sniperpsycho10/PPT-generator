import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/authHelpers";
import { SuggestionSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";


      let bodyData: any = {};
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await req.formData();
        bodyData = {
          guestName: formData.get("guestName")?.toString(),
          guestDept: formData.get("guestDept")?.toString(),
          suggestionText: formData.get("suggestionText")?.toString(),
          submissionId: formData.get("submissionId")?.toString() || null,
        };
      } else {
        bodyData = await req.json();
      }

      const validatedData = SuggestionSchema.safeParse(bodyData);
      
      if (!validatedData.success) {
        if (contentType.includes("application/x-www-form-urlencoded")) {
          const host = req.headers.get("host") || "localhost:4000";
          const protocol = req.headers.get("x-forwarded-proto") || "http";
          return NextResponse.redirect(`${protocol}://${host}/feedback?error=missing_text`, { status: 303 });
        }
        return NextResponse.json({ error: "Validation Failed", details: validatedData.error.format() }, { status: 400 });
      }

      const { guestName, guestDept, suggestionText, submissionId } = validatedData.data;



    const suggestion = await prisma.suggestion.create({
      data: {
        guestName,
        guestDept,
        suggestionText,
        status: "Pending",
        submissionId
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
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId, userRole } = auth;

    let whereClause: any = {};
    if (userRole !== 'Admin' && userRole !== 'SuperAdmin') {
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
      include: { 
        submission: true, 
        assignedTeam: {
          include: {
            members: {
              select: { name: true, email: true }
            }
          }
        } 
      }
    });
    return NextResponse.json({ success: true, data: suggestions });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

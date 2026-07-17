import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const session = await getServerSession(authOptions);
    
    const userEmail = session?.user?.email || "dummy@jspl.com";
    
    let user = await prisma.user.findUnique({ 
      where: { email: userEmail },
      include: { department: true }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail,
          passwordHash: "password123",
          name: session?.user?.name || "Workshop User",
          role: "Pending"
        },
        include: { department: true }
      });
    }

    if (!user.departmentId) {
      return NextResponse.json({ error: "User profile incomplete. Please set your department first." }, { status: 400 });
    }

    const submission = await prisma.submission.create({
      data: {
        userId: user.id,
        departmentId: user.departmentId,
        type: data.type,
        title: data.title,
        description: data.description || "",
        status: data.status || "Submitted",
        
        beforeImageUrl: data.beforeImageUrl || null,
        afterImageUrl: data.afterImageUrl || null,
        attachmentUrl: data.attachmentUrl || null,
        
        // Best Practice
        objective: data.objective,
        problemAddressed: data.problemAddressed,
        methodology: data.methodology,
        impactSavings: data.impactSavings ? parseFloat(data.impactSavings) : null,
        calculationTable: data.calculationTable ? JSON.stringify(data.calculationTable) : null,
        
        // Problem
        equipmentDetails: data.equipmentDetails,
        problemStatement: data.problemStatement,
        impactCalculation: data.impactCalculation,
        whyWhyAnalysis: data.whyWhyAnalysis,
        actionTakenTable: data.actionTakenTable,

        // Supporting Slide
        supportingSlideType: data.supportingSlideType,
        customTable: data.customTable,
        supportingImages: data.supportingImages || [],
      }
    });

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error("Submission Error:", error);
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    let whereClause: any = { status: { in: ["Submitted", "Accepted"] } };
    if (userRole !== 'Admin' && userRole !== 'Super Admin') {
      whereClause.userId = userId;
    }

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: { department: true, suggestions: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, data: submissions });
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}

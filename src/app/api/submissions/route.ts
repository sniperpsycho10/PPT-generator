import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/authHelpers";
import { SubmissionSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { user, userId, userRole } = auth;
    const userEmail = user.email!;
    
    let dbUser = await prisma.user.findUnique({ 
      where: { email: userEmail },
      include: { department: true }
    });
    
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          email: userEmail,
          passwordHash: "password123",
          name: user.name || "Workshop User",
          role: "Pending"
        },
        include: { department: true }
      });
    }

    if (!dbUser.departmentId) {
      return NextResponse.json({ error: "User profile incomplete. Please set your department first." }, { status: 400 });
    }

    const validatedData = SubmissionSchema.safeParse(data);
    if (!validatedData.success) {
      return NextResponse.json({ error: "Validation Failed", details: validatedData.error.format() }, { status: 400 });
    }

    const cleanData = validatedData.data;

    let finalCycleId = cleanData.cycleId;

    if (!finalCycleId) {
      const activeCycle = await prisma.cycle.findFirst({
        where: { isActive: true, endDate: { gte: new Date() }, startDate: { lte: new Date() } },
        orderBy: { endDate: 'asc' }
      });
      if (activeCycle) {
        finalCycleId = activeCycle.id;
      }
    }

    if (finalCycleId) {
      const cycle = await prisma.cycle.findUnique({ where: { id: finalCycleId } });
      if (cycle) {
        const now = new Date();
        const start = new Date(cycle.startDate); start.setHours(0,0,0,0);
        const end = new Date(cycle.endDate); end.setHours(23,59,59,999);
        const isClosed = !cycle.isActive || now > end || now < start;
        
        if (isClosed && userRole !== 'SuperAdmin') {
          return NextResponse.json({ error: "Cannot submit to a locked, future, or ended cycle" }, { status: 403 });
        }
      }
    } else {
      if (userRole !== 'SuperAdmin') {
        return NextResponse.json({ error: "Cannot submit because no active cycle is currently open" }, { status: 403 });
      }
    }

    const submission = await prisma.submission.create({
      data: {
        userId: dbUser.id,
        departmentId: dbUser.departmentId,
        ...cleanData,
        cycleId: finalCycleId || null,
        calculationTable: typeof data.calculationTable === 'string' ? JSON.parse(data.calculationTable || '[]') : data.calculationTable,
        impactCalculation: typeof data.impactCalculation === 'string' ? JSON.parse(data.impactCalculation || '[]') : data.impactCalculation,
        whyWhyAnalysis: typeof data.whyWhyAnalysis === 'string' ? JSON.parse(data.whyWhyAnalysis || '[]') : data.whyWhyAnalysis,
        actionTakenTable: typeof data.actionTakenTable === 'string' ? JSON.parse(data.actionTakenTable || '[]') : data.actionTakenTable,
        customTable: typeof data.customTable === 'string' ? JSON.parse(data.customTable || '[]') : data.customTable,
      }
    });

    await prisma.auditLog.create({
      data: {
        entityId: submission.id,
        entityType: 'Submission',
        action: 'CREATE',
        userId: dbUser.id,
        changedFields: submission as any
      }
    });

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error("Submission Error:", error);
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    
    const skip = (page - 1) * limit;

    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId, userRole } = auth;

    let whereClause: any = { status: { in: ["Submitted", "Accepted"] }, deletedAt: null };
    
    if (userRole === 'User' || userRole === 'Pending') {
      whereClause.userId = userId;
    } else if (userRole === 'Admin') {
      // Admins see their own department's submissions, or everything if they have no department set
      const dbUser = await prisma.user.findUnique({ where: { id: userId } });
      if (dbUser?.departmentId) {
        whereClause.departmentId = dbUser.departmentId;
      }
    }
    // SuperAdmin sees everything, no extra where filters needed


    // Apply search filter
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where: whereClause,
        include: { 
          department: true, 
          user: true,
          suggestions: { include: { assignedTeam: true } },
          adoptions: { include: { user: { include: { department: true } } } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.submission.count({ where: whereClause })
    ]);
    
    return NextResponse.json({ 
      success: true, 
      data: submissions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}

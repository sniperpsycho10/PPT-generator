import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/authHelpers";
import { SubmissionSchema } from "@/lib/validations";

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId, userRole } = auth;

    const params = await props.params;
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    if (userRole !== 'Admin' && userRole !== 'SuperAdmin') {
      const sub = await prisma.submission.findUnique({ where: { id }});
      if (sub?.userId !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Soft delete child records first
    await prisma.suggestion.updateMany({ where: { submissionId: id }, data: { deletedAt: new Date() } });
    const deletedSub = await prisma.submission.update({ where: { id }, data: { deletedAt: new Date() } });
    await prisma.auditLog.create({
      data: {
        entityId: id,
        entityType: 'Submission',
        action: 'DELETE',
        userId: userId,
        changedFields: deletedSub as any
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 });
  }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId, userRole } = auth;

    const params = await props.params;
    const id = params.id;
    const data = await req.json();

    const oldSub = await prisma.submission.findUnique({ where: { id } });
    if (!oldSub) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (userRole !== 'Admin' && userRole !== 'SuperAdmin') {
      if (oldSub.userId !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      if (oldSub.status === 'Accepted' || oldSub.status === 'Rejected') {
        return NextResponse.json({ error: "Cannot edit an accepted or rejected submission" }, { status: 403 });
      }
    }

    if (oldSub.cycleId) {
      const cycle = await prisma.cycle.findUnique({ where: { id: oldSub.cycleId } });
      if (cycle) {
        const now = new Date();
        const start = new Date(cycle.startDate); start.setHours(0,0,0,0);
        const end = new Date(cycle.endDate); end.setHours(23,59,59,999);
        const isClosed = !cycle.isActive || now > end || now < start;
        
        if (isClosed && userRole !== 'SuperAdmin') {
          return NextResponse.json({ error: "Cannot edit submissions in a locked, future, or ended cycle" }, { status: 403 });
        }
      }
    }

    // Preserve status if it is already Accepted/Rejected so Admin edits don't revert it
    const newStatus = (oldSub.status === 'Accepted' || oldSub.status === 'Rejected') && userRole !== 'SuperAdmin' ? oldSub.status : data.status;

    // Handle dynamic department assignment
    const deptName = data.scannedDepartment || "Mechanical";
    let department = await prisma.department.findFirst({ where: { name: deptName }});
    if (!department) {
      department = await prisma.department.create({
        data: { name: deptName, qrCodeHash: `DPT_${Math.random()}` }
      });
    }

    // Minimal edit logic
    const updatedSub = await prisma.submission.update({
      where: { id },
      data: {
        departmentId: department.id,
        title: data.title,
        description: data.description,
        status: newStatus as any,
        objective: data.objective,
        problemAddressed: data.problemAddressed,
        methodology: data.methodology,
        impactSavings: data.impactSavings ? parseFloat(data.impactSavings) : null,
        equipmentDetails: data.equipmentDetails,
        problemStatement: data.problemStatement,
        calculationTable: typeof data.calculationTable === 'string' ? JSON.parse(data.calculationTable || '[]') : data.calculationTable,
        impactCalculation: typeof data.impactCalculation === 'string' ? JSON.parse(data.impactCalculation || '[]') : data.impactCalculation,
        whyWhyAnalysis: typeof data.whyWhyAnalysis === 'string' ? JSON.parse(data.whyWhyAnalysis || '[]') : data.whyWhyAnalysis,
        actionTakenTable: typeof data.actionTakenTable === 'string' ? JSON.parse(data.actionTakenTable || '[]') : data.actionTakenTable,
        beforeImageUrl: data.beforeImageUrl,
        afterImageUrl: data.afterImageUrl,
        attachmentUrl: data.attachmentUrl,
        supportingSlideType: data.supportingSlideType,
        customTable: typeof data.customTable === 'string' ? JSON.parse(data.customTable || '[]') : data.customTable,
        supportingImages: data.supportingImages || [],
        cycleId: data.cycleId || null
      }
    });

    // Save Version History
    const maxVersion = await prisma.submissionVersion.findFirst({ 
      where: { submissionId: id }, 
      orderBy: { versionNum: 'desc' } 
    });
    const nextVersionNum = maxVersion ? maxVersion.versionNum + 1 : 1;

    await prisma.submissionVersion.create({
      data: {
        submissionId: id,
        versionNum: nextVersionNum,
        dataSnapshot: oldSub as any,
        updatedById: userId
      }
    });

    await prisma.auditLog.create({
      data: {
        entityId: id,
        entityType: 'Submission',
        action: 'UPDATE',
        userId: userId,
        changedFields: updatedSub as any
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
  }
}

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId, userRole } = auth;

    const params = await props.params;
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const submission = await prisma.submission.findUnique({ 
      where: { id },
      include: { department: true } 
    });
    if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (userRole !== 'Admin' && userRole !== 'SuperAdmin' && submission.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }


    return NextResponse.json({ success: true, data: submission });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch submission" }, { status: 500 });
  }
}

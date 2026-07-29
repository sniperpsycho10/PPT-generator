import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/authHelpers";
import { CycleSchema } from "@/lib/validations";

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const params = await props.params;
    const data = await req.json();
    
    // We parse as partial because updates might only send some fields.
    const validatedData = CycleSchema.partial().safeParse(data);
    if (!validatedData.success) {
      return NextResponse.json({ error: "Validation Failed", details: validatedData.error.format() }, { status: 400 });
    }
    
    const { name, month, year, startDate, endDate, isActive, bpRemarks, rpRemarks, isArchived } = validatedData.data;

    const cycle = await prisma.cycle.update({
      where: { id: params.id },
      data: {
        name,
        month,
        year,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isActive,
        bpRemarks,
        rpRemarks,
        isArchived
      }
    });

    return NextResponse.json({ success: true, data: cycle });
  } catch (error) {
    console.error("Update Cycle Error:", error);
    return NextResponse.json({ error: "Failed to update cycle" }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const params = await props.params;
    
    // We shouldn't delete cycles that have submissions tied to them, but Prisma relation defaults to restrict.
    // If it fails due to foreign key constraints, we will catch it.
    await prisma.cycle.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Cycle Error:", error);
    if (error.code === 'P2003') {
      return NextResponse.json({ error: "Cannot delete cycle because there are submissions tied to it. Please close it instead." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to delete cycle" }, { status: 500 });
  }
}

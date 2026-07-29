import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/authHelpers";

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const { userId, userRole } = auth;

    const { role, departmentId } = await req.json();
    const params = await props.params;
    const targetUserId = params.id;
    
    // SuperAdmin protection
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (targetUser?.role === 'SuperAdmin' && userRole !== 'SuperAdmin') {
      return NextResponse.json({ success: false, error: "Only SuperAdmins can modify SuperAdmins" }, { status: 403 });
    }

    const dataToUpdate: any = {};
    if (role !== undefined) dataToUpdate.role = role;
    if (departmentId !== undefined) {
      dataToUpdate.departmentId = departmentId === "" ? null : departmentId;
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: dataToUpdate
    });
    
    if (role !== undefined) {
      await prisma.auditLog.create({
        data: {
          entityId: targetUserId,
          entityType: 'User',
          action: 'UPDATE',
          userId: userId,
          changedFields: { newRole: role }
        }
      });
    }
    
    return NextResponse.json({ success: true, data: updatedUser });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const { userId, userRole } = auth;

    const params = await props.params;
    const targetUserId = params.id;

    // SuperAdmin protection
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (targetUser.role === 'SuperAdmin') {
      return NextResponse.json({ success: false, error: "SuperAdmins cannot be deleted" }, { status: 403 });
    }

    if (targetUser.role === 'Admin' && userRole !== 'SuperAdmin') {
      return NextResponse.json({ success: false, error: "Only SuperAdmins can delete Admins" }, { status: 403 });
    }

    const deletedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { deletedAt: new Date() }
    });
    
    await prisma.auditLog.create({
      data: {
        entityId: targetUserId,
        entityType: 'User',
        action: 'DELETE',
        userId: userId,
        changedFields: { email: deletedUser.email }
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (userRole !== 'Admin' && userRole !== 'Super Admin') {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { role } = await req.json();
    const params = await props.params;
    const targetUserId = params.id;
    
    // Super Admin protection
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (targetUser?.role === 'Super Admin' && userRole !== 'Super Admin') {
      return NextResponse.json({ success: false, error: "Only Super Admins can modify Super Admins" }, { status: 403 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role }
    });
    
    return NextResponse.json({ success: true, data: updatedUser });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (userRole !== 'Admin' && userRole !== 'Super Admin') {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const params = await props.params;
    const targetUserId = params.id;

    // Super Admin protection
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (targetUser.role === 'Super Admin') {
      return NextResponse.json({ success: false, error: "Super Admins cannot be deleted" }, { status: 403 });
    }

    if (targetUser.role === 'Admin' && userRole !== 'Super Admin') {
      return NextResponse.json({ success: false, error: "Only Super Admins can delete Admins" }, { status: 403 });
    }

    await prisma.user.delete({
      where: { id: targetUserId }
    });
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

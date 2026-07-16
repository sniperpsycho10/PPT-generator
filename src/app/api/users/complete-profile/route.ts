import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, department: deptName } = await req.json();

    if (!name || !deptName) {
      return NextResponse.json({ error: "Name and Department are required" }, { status: 400 });
    }

    // Find or create department
    let department = await prisma.department.findFirst({ where: { name: deptName } });
    if (!department) {
      department = await prisma.department.create({
        data: { name: deptName, qrCodeHash: `DPT_${Math.random()}` }
      });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        departmentId: department.id
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Profile Completion Error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

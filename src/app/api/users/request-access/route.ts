import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.redirect(new URL("/auth/login", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }

    const userId = (session.user as any).id;
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });

    if (dbUser?.role === "Rejected") {
      await prisma.user.update({
        where: { id: userId },
        data: { role: "Pending" }
      });
    }

    return NextResponse.redirect(new URL("/pending-approval", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

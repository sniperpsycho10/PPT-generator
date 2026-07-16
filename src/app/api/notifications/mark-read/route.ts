import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json().catch(() => ({}));
    
    // Mark specific notification or all notifications as read
    if (body.notificationId) {
      await prisma.notification.updateMany({
        where: {
          id: body.notificationId,
          userId: userId
        },
        data: {
          isRead: true
        }
      });
    } else {
      await prisma.notification.updateMany({
        where: {
          userId: userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Mark notifications read error:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}

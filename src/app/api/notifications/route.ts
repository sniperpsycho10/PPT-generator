import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch top 10 notifications for the user (both read and unread)
    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limit to recent 10
    });

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const url = new URL(req.url);
    const notificationId = url.searchParams.get("id");

    if (notificationId) {
      // Delete a specific notification
      await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId: userId
        }
      });
    } else {
      // Delete all notifications for this user
      await prisma.notification.deleteMany({
        where: {
          userId: userId
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete notifications error:", error);
    return NextResponse.json({ error: "Failed to delete notifications" }, { status: 500 });
  }
}

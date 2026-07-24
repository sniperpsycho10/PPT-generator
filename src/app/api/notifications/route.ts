import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";
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

    // Dynamic deadline reminder generation for active cycles
    const activeCycles = await prisma.cycle.findMany({
      where: { isActive: true }
    });

    const newNotifications = [];
    for (const cycle of activeCycles) {
      // Normalize both dates to midnight UTC to prevent time-of-day math errors
      const end = new Date(cycle.endDate);
      end.setUTCHours(0,0,0,0);
      
      const today = new Date();
      today.setUTCHours(0,0,0,0);
      
      const diffTime = end.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7 && diffDays >= 0) {
        const title = `Deadline Reminder: ${cycle.name}`;
        const message = diffDays === 0 
          ? `The ${cycle.name} cycle window closes TODAY! Please submit your data immediately.`
          : `Only ${diffDays} days left until the ${cycle.name} cycle closes.`;
          
        const alreadyNotified = await prisma.notification.findFirst({
          where: {
            userId: userId,
            title: title,
            message: message
          }
        });
        
        if (!alreadyNotified) {
          newNotifications.push({
            userId,
            title,
            message,
            isRead: false,
            link: "/dashboard/submit-suggestion"
          });
        }
      }
    }
    
    if (newNotifications.length > 0) {
      await prisma.notification.createMany({ data: newNotifications });
    }

    // Fetch top 10 notifications for the user (both read and unread)
    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId,
        isDeleted: false
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
      // Soft-delete a specific notification
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: userId
        },
        data: {
          isDeleted: true
        }
      });
    } else {
      // Soft-delete all notifications for this user
      await prisma.notification.updateMany({
        where: {
          userId: userId
        },
        data: {
          isDeleted: true
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete notifications error:", error);
    return NextResponse.json({ error: "Failed to delete notifications" }, { status: 500 });
  }
}

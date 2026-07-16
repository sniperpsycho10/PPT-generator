import React from "react";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TrackingClient from "./TrackingClient";

export const dynamic = "force-dynamic";

export default async function TrackingPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }
  
  const userRole = (session.user as any).role;
  const userId = (session.user as any).id;
  const isAdmin = userRole === 'Admin' || userRole === 'Super Admin';

  let whereClause: any = { status: "Accepted" };
  if (!isAdmin) {
    whereClause.assignedTeam = {
      members: {
        some: { id: userId }
      }
    };
  }

  const suggestions = await prisma.suggestion.findMany({
    where: whereClause,
    include: {
      assignedTeam: {
        include: { members: true }
      },
      progressLog: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' }
  });

  const teams = isAdmin ? await prisma.team.findMany({ orderBy: { name: 'asc' } }) : [];

  return <TrackingClient initialSuggestions={suggestions} departments={departments} teams={teams} isAdmin={isAdmin} currentUserId={userId} />;
}

import React from "react";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SuggestionTrackingClient from "./SuggestionTrackingClient";

export const dynamic = "force-dynamic";

export default async function SuggestionTrackingPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }
  
  const userRole = (session.user as any).role;
  const userId = (session.user as any).id;
  const isAdmin = userRole === 'Admin' || userRole === 'SuperAdmin';

  // Fetch all suggestions with their parent submission and user data
  const suggestions = await prisma.suggestion.findMany({
    where: { 
      status: "Accepted", 
      submission: { deletedAt: null } 
    },
    include: {
      submission: {
        include: {
          cycle: true
        }
      },
      suggestedBy: {
        include: {
          department: true
        }
      },
      assignedTeam: true,
      progressLog: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const departments = await prisma.department.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' }
  });

  const teams = await prisma.team.findMany({
    include: { members: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' }
  });

  return <SuggestionTrackingClient initialSuggestions={suggestions} departments={departments} teams={teams} isAdmin={isAdmin} currentUserId={userId} />;
}

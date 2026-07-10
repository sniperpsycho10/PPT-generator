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
  const isAdmin = userRole === 'Admin' || userRole === 'Super Admin';

  // Only fetch "Accepted" suggestions for tracking
  const suggestions = await prisma.suggestion.findMany({
    where: { status: "Accepted" },
    orderBy: { updatedAt: 'desc' }
  });

  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' }
  });

  return <TrackingClient initialSuggestions={suggestions} departments={departments} isAdmin={isAdmin} />;
}

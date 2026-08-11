import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import TeamsClient from "./TeamsClient";

export const dynamic = 'force-dynamic';

export default async function TeamsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const userId = (session.user as any).id;
  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  
  const isAdmin = dbUser?.role === 'Admin' || dbUser?.role === 'SuperAdmin';
  
  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Fetch initial teams to pass to client for faster first load
  const initialTeams = await prisma.team.findMany({
    include: {
      members: {
        select: { id: true, name: true, email: true, role: true, departmentId: true, image: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Teams Management</h1>
          <p className="text-gray-500 text-sm">Create, edit, and view teams across the platform.</p>
        </div>
      </div>
      <TeamsClient initialTeams={initialTeams} />
    </div>
  );
}

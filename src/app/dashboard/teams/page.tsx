import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import TeamsClient from "./TeamsClient";

export default async function TeamsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const userId = (session.user as any).id;
  const dbUser = await prisma.user.findUnique({ where: { id: userId } });

  if (!dbUser || (dbUser.role !== "Admin" && dbUser.role !== "Super Admin")) {
    redirect("/dashboard"); // Redirect regular users away from Teams page
  }

  // Fetch initial teams and all approved users to pass to the client
  const initialTeams = await prisma.team.findMany({
    include: {
      members: {
        select: { id: true, name: true, email: true, role: true, departmentId: true, image: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const allUsers = await prisma.user.findMany({
    where: {
      role: {
        in: ["User", "Admin", "Super Admin"] // Only approved users
      }
    },
    select: { id: true, name: true, email: true, role: true, image: true },
    orderBy: { name: "asc" }
  });

  return (
    <TeamsClient 
      initialTeams={initialTeams} 
      allUsers={allUsers} 
      currentUserId={userId} 
      currentUserRole={dbUser.role} 
    />
  );
}

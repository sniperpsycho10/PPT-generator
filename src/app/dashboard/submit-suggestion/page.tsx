import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SubmitSuggestionClient from "./SubmitSuggestionClient";
import prisma from "@/lib/db";

export default async function SubmitSuggestionPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const userId = (session.user as any).id;
  const dbUser = await prisma.user.findUnique({ 
    where: { id: userId },
    include: { department: true }
  });
  
  if (!dbUser) {
    redirect("/auth/login");
  }

  return <SubmitSuggestionClient userName={dbUser.name || ""} userDept={dbUser.department?.name || ""} />;
}

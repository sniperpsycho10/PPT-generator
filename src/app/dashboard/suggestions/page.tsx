import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SuggestionsClient from "./SuggestionsClient";

export default async function SuggestionsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const userRole = (session.user as any).role;
  const isAdmin = userRole === 'Admin' || userRole === 'Super Admin';

  return <SuggestionsClient isAdmin={isAdmin} />;
}

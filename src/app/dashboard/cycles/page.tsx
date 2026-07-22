import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import CyclesClient from "./CyclesClient";

export default async function CyclesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id }
  });

  if (!user || (user.role !== 'Admin' && user.role !== 'Super Admin')) {
    redirect("/dashboard");
  }

  return <CyclesClient />;
}

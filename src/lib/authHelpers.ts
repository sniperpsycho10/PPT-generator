import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, user: session.user, userId: (session.user as any).id, userRole: (session.user as any).role };
}

export async function requireAdmin() {
  const auth = await requireUser();
  if (auth.error) return auth;
  
  if (auth.userRole !== 'Admin' && auth.userRole !== 'SuperAdmin') {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return auth;
}

export async function requireSuperAdmin() {
  const auth = await requireUser();
  if (auth.error) return auth;
  
  if (auth.userRole !== 'SuperAdmin') {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return auth;
}

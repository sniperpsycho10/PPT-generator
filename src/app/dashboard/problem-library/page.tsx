import React from "react";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import ProblemLibraryList from "./ProblemLibraryList";

export const dynamic = 'force-dynamic';

export default async function ProblemLibraryPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === 'Admin' || userRole === 'SuperAdmin';

  const problems = await prisma.submission.findMany({
    where: {
      type: "RepetitiveProblem",
      status: "Accepted",
      deletedAt: null
    },
    include: {
      department: true,
      user: true,
      adoptions: {
        include: {
          user: {
            include: {
              department: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Repetitive Problem Library</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Discover recurring issues and standard solutions across the plant</p>
      </div>

      <ProblemLibraryList 
        initialData={problems} 
        currentUserId={userId} 
        isAdmin={isAdmin} 
      />
    </div>
  );
}

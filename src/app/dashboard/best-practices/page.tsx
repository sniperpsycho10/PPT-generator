import React from "react";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import BestPracticesList from "./BestPracticesList";

export const dynamic = 'force-dynamic';

export default async function BestPracticesPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === 'Admin' || userRole === 'Super Admin';

  const bestPractices = await prisma.submission.findMany({
    where: {
      type: "BestPractice",
      status: "Accepted"
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
        <h1>Best Practices Library</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Discover and adopt proven solutions from across the plant</p>
      </div>

      <BestPracticesList 
        initialData={bestPractices} 
        currentUserId={userId} 
        isAdmin={isAdmin} 
      />
    </div>
  );
}

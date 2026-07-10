import React from "react";
import prisma from "@/lib/db";
import Link from "next/link";
import ActionButtons from "./ActionButtons";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function SubmissionsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === 'Admin' || userRole === 'Super Admin';

  const whereClause = isAdmin ? {} : { userId };

  const submissions = await prisma.submission.findMany({
    where: whereClause,
    include: { department: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>All Submissions</h1>
        <Link href="/submit" className="btn btn-primary" style={{ textDecoration: 'none' }}>+ New Submission</Link>
      </div>

      <div className="card">
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '1rem 0' }}>Title</th>
              <th>Department</th>
              <th>Type</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub: any) => (
              <tr key={sub.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '1rem 0', fontWeight: 'bold' }}>{sub.title}</td>
                <td>{sub.department?.name || 'Unknown'}</td>
                <td>{sub.type === "BestPractice" ? "Best Practice" : "Repetitive Problem"}</td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                    backgroundColor: sub.status === "Draft" ? "#fff3e0" : "#e8f5e9",
                    color: sub.status === "Draft" ? "#e65100" : "#2e7d32"
                  }}>
                    {sub.status}
                  </span>
                </td>
                <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                <td>
                  <ActionButtons id={sub.id} isAdmin={isAdmin} status={sub.status} />
                </td>
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>No submissions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

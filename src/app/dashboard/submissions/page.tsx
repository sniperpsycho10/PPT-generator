import React from "react";
import prisma from "@/lib/db";
import Link from "next/link";
import ActionButtons from "./ActionButtons";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function SubmissionsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === 'Admin' || userRole === 'SuperAdmin';

  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const search = typeof searchParams.search === 'string' ? searchParams.search : "";
  const limit = 10;
  const skip = (page - 1) * limit;

  const whereClause: any = isAdmin ? { deletedAt: null } : { userId, deletedAt: null };

  if (search) {
    whereClause.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where: whereClause,
      include: { department: true, user: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.submission.count({ where: whereClause })
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>All Submissions</h1>
          <p className="text-gray-500 text-sm">Showing {submissions.length} of {total}</p>
        </div>
        <div className="flex gap-4 items-center">
          <form method="GET" action="/dashboard/submissions" className="flex items-center">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                name="search" 
                defaultValue={search} 
                placeholder="Search title..." 
                className="pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <button type="submit" className="ml-2 bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium">Search</button>
            {search && (
               <Link href="/dashboard/submissions" className="ml-2 text-sm text-gray-500 hover:underline">Clear</Link>
            )}
          </form>
          <Link href="/submit" className="btn btn-primary" style={{ textDecoration: 'none' }}>+ New Submission</Link>
        </div>
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
                <td>{sub.type === "BestPractice" ? "Best Practice" : sub.type === "RepetitiveProblem" ? "Repetitive Problem" : `Supporting Doc for ${sub.supportingSlideType === 'BestPractice' ? 'Best Practice' : 'Repetitive Problem'}`}</td>
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
                  <ActionButtons 
                    id={sub.id} 
                    isAdmin={isAdmin} 
                    status={sub.status} 
                    type={sub.type}
                    assignedTeamId={sub.assignedTeamId}
                  />
                </td>
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>No submissions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Link 
              href={`/dashboard/submissions?page=${Math.max(1, page - 1)}&search=${encodeURIComponent(search)}`}
              className={`flex items-center gap-1 px-3 py-1.5 border rounded-md text-sm font-medium ${page <= 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50'}`}
            >
              <ChevronLeft size={16} /> Previous
            </Link>
            <Link 
              href={`/dashboard/submissions?page=${Math.min(totalPages, page + 1)}&search=${encodeURIComponent(search)}`}
              className={`flex items-center gap-1 px-3 py-1.5 border rounded-md text-sm font-medium ${page >= totalPages ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50'}`}
            >
              Next <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

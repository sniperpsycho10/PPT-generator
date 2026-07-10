import DashboardCharts from "./DashboardCharts";
import prisma from "@/lib/db";
import ActionButtons from "./submissions/ActionButtons";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function DashboardOverview() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === 'Admin' || userRole === 'Super Admin';

  const whereClause = isAdmin ? {} : { userId };

  const submissions = await prisma.submission.findMany({
    where: whereClause,
    include: { department: true },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  const totalSubmissions = await prisma.submission.count({ where: whereClause });

  // Calculate Impact
  const allSubmissions = await prisma.submission.findMany({ where: whereClause });
  const totalImpact = allSubmissions.reduce((sum, sub) => sum + (sub.impactSavings || 0), 0);

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Overview</h1>
      
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">Total Submissions</div>
          <div className="kpi-value">{totalSubmissions}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Departments Active</div>
          <div className="kpi-value">4 / 12</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Total Impact / Savings</div>
          <div className="kpi-value">₹ {totalImpact.toFixed(2)}L</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Open Action Items</div>
          <div className="kpi-value" style={{ color: 'var(--warning)' }}>0</div>
        </div>
      </div>

      <DashboardCharts />

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Recent Submissions</h2>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '1rem 0' }}>Department</th>
              <th>Type</th>
              <th>Title</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub: any) => (
              <tr key={sub.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '1rem 0' }}>{sub.department?.name || 'Unknown'}</td>
                <td>{sub.type === "BestPractice" ? "Best Practice" : "Repetitive Problem"}</td>
                <td>{sub.title}</td>
                <td>
                  <span style={{ 
                    color: sub.status === "Submitted" ? 'var(--success)' : 'var(--warning)',
                    fontWeight: 'bold'
                  }}>
                    {sub.status}
                  </span>
                </td>
                <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                <td><ActionButtons id={sub.id} isAdmin={isAdmin} status={sub.status} /></td>
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>No recent submissions.</td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

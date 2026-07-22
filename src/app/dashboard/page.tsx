import DashboardCharts from "./DashboardCharts";
import prisma from "@/lib/db";
import ActionButtons from "./submissions/ActionButtons";
import { getServerSession } from "next-auth/next";
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

  // Real KPIs
  const totalDepartments = await prisma.department.count();
  const activeDepartmentsList = await prisma.submission.groupBy({
    by: ['departmentId'],
    where: whereClause,
  });
  const activeDepartmentsCount = activeDepartmentsList.length;

  const actionItemsCount = await prisma.actionItem.count({
    where: {
      status: { in: ['Open', 'InProgress'] },
      ...(isAdmin ? {} : { assignedToId: userId })
    }
  });

  // Calculate Impact & Charts Data
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const allRelevantSubmissions = await prisma.submission.findMany({ 
    where: whereClause,
    include: { department: true }
  });

  const totalImpact = allRelevantSubmissions.reduce((sum: number, sub: any) => sum + (sub.impactSavings || 0), 0);

  const trendLabels = Array.from({length: 6}, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toLocaleString('default', { month: 'short' });
  });

  const bestPracticesData = new Array(6).fill(0);
  const repetitiveProblemsData = new Array(6).fill(0);
  const deptImpactMap = new Map<string, number>();

  allRelevantSubmissions.forEach((sub: any) => {
    // For trends (only within last 6 months)
    const d = new Date(sub.createdAt);
    if (d >= sixMonthsAgo) {
      const monthIndex = 5 - (new Date().getMonth() - d.getMonth() + (12 * (new Date().getFullYear() - d.getFullYear())));
      if (monthIndex >= 0 && monthIndex < 6) {
        if (sub.type === 'BestPractice') bestPracticesData[monthIndex]++;
        else if (sub.type === 'RepetitiveProblem') repetitiveProblemsData[monthIndex]++;
      }
    }

    // For impact by department (all time or just last 6 months? Let's do all time in this view for impact)
    if (sub.impactSavings && sub.department) {
      const current = deptImpactMap.get(sub.department.name) || 0;
      deptImpactMap.set(sub.department.name, current + sub.impactSavings);
    }
  });

  const impactLabels = Array.from(deptImpactMap.keys());
  const impactDataValues = Array.from(deptImpactMap.values());

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
          <div className="kpi-value">{activeDepartmentsCount} / {totalDepartments}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Total Impact / Savings</div>
          <div className="kpi-value">₹ {totalImpact.toFixed(2)}L</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Open Action Items</div>
          <div className="kpi-value" style={{ color: actionItemsCount > 0 ? 'var(--warning)' : 'inherit' }}>{actionItemsCount}</div>
        </div>
      </div>

      <DashboardCharts 
        trendLabels={trendLabels}
        bestPracticesData={bestPracticesData}
        repetitiveProblemsData={repetitiveProblemsData}
        impactLabels={impactLabels}
        impactDataValues={impactDataValues}
      />

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

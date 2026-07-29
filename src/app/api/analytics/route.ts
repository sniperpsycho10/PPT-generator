import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authHelpers";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    // 1. Department Performance (Submissions by Dept)
    const departments = await prisma.department.findMany({
      include: {
        submissions: {
          select: { status: true }
        }
      }
    });

    const deptPerformance = departments.map((d: any) => ({
      name: d.name,
      total: d.submissions.length,
      accepted: d.submissions.filter((s: any) => s.status === "Accepted").length,
      rejected: d.submissions.filter((s: any) => s.status === "Reviewed").length, // Assuming Reviewed implies some feedback/rejection if not accepted, or we can use another state. Let's just map Draft, Submitted, Accepted.
    }));

    // 2. Monthly Trends
    // Grouping submissions by month
    const submissions = await prisma.submission.findMany({
      select: { createdAt: true, status: true, impactSavings: true, downtime: true }
    });

    const monthlyTrendsMap: Record<string, { total: number; accepted: number }> = {};
    let totalSavings = 0;
    let totalDowntime = 0;

    submissions.forEach((sub: any) => {
      const month = sub.createdAt.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyTrendsMap[month]) {
        monthlyTrendsMap[month] = { total: 0, accepted: 0 };
      }
      monthlyTrendsMap[month].total += 1;
      if (sub.status === "Accepted") {
        monthlyTrendsMap[month].accepted += 1;
        totalSavings += (sub.impactSavings || 0);
        totalDowntime += (sub.downtime || 0);
      }
    });

    const monthlyTrends = Object.keys(monthlyTrendsMap).sort().map((month: string) => ({
      month,
      total: monthlyTrendsMap[month].total,
      accepted: monthlyTrendsMap[month].accepted
    }));

    // 3. Accepted vs Rejected Suggestions
    const suggestions = await prisma.suggestion.findMany({
      select: { status: true, createdAt: true, actualCompletionDate: true }
    });

    let totalSuggestions = suggestions.length;
    let acceptedSuggestions = 0;
    let rejectedSuggestions = 0;
    let pendingSuggestions = 0;

    let delaySum = 0;
    let completedSuggestions = 0;

    suggestions.forEach((s: any) => {
      if (s.status === "Accepted") acceptedSuggestions++;
      else if (s.status === "Rejected") rejectedSuggestions++;
      else pendingSuggestions++;

      if (s.actualCompletionDate) {
        const diff = new Date(s.actualCompletionDate).getTime() - new Date(s.createdAt).getTime();
        delaySum += diff;
        completedSuggestions++;
      }
    });

    const avgImplementationTimeDays = completedSuggestions > 0 
      ? Math.round(delaySum / completedSuggestions / (1000 * 60 * 60 * 24))
      : 0;

    // 4. Top Contributors Leaderboard
    const users = await prisma.user.findMany({
      include: {
        submissions: { select: { id: true } }
      }
    });

    const leaderboard = users
      .map((u: any) => ({ name: u.name || "Unknown", count: u.submissions.length }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5); // Top 5

    // 5. KPIs
    const overallAcceptanceRate = submissions.length > 0 
      ? Math.round((submissions.filter((s: any) => s.status === "Accepted").length / submissions.length) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        deptPerformance,
        monthlyTrends,
        suggestionsSplit: { accepted: acceptedSuggestions, rejected: rejectedSuggestions, pending: pendingSuggestions },
        kpis: {
          totalSavings,
          totalDowntime,
          avgImplementationTimeDays,
          overallAcceptanceRate
        },
        leaderboard
      }
    });

  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

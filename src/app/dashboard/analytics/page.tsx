"use client";

import React, { useEffect, useState } from "react";
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Download,
  Loader2,
  Award
} from "lucide-react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics").then(r => r.json()),
      fetch("/api/health").then(r => r.json()).catch(() => ({ healthy: false, services: { database: 'error', storage: 'error' }, metrics: { failedPPTGenerations: 0 } }))
    ]).then(([analyticsRes, healthRes]) => {
      if (analyticsRes.success) setData(analyticsRes.data);
      setHealth(healthRes);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleExportCSV = () => {
    if (!data) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add KPI Summary
    csvContent += "KPI Summary\n";
    csvContent += `Total Savings (Rs Lakhs),${data.kpis.totalSavings}\n`;
    csvContent += `Total Downtime Avoided (Units),${data.kpis.totalDowntime}\n`;
    csvContent += `Average Implementation Time (Days),${data.kpis.avgImplementationTimeDays}\n`;
    csvContent += `Overall Acceptance Rate (%),${data.kpis.overallAcceptanceRate}\n\n`;

    // Add Department Performance
    csvContent += "Department Performance\n";
    csvContent += "Department,Total Submissions,Accepted,Rejected\n";
    data.deptPerformance.forEach((d: any) => {
      csvContent += `${d.name},${d.total},${d.accepted},${d.rejected}\n`;
    });
    csvContent += "\n";

    // Add Top Contributors
    csvContent += "Top Contributors\n";
    csvContent += "User Name,Submissions\n";
    data.leaderboard.forEach((l: any) => {
      csvContent += `${l.name},${l.count}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `jspl_analytics_summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--jspl-blue)', margin: '0 auto' }} />
      </div>
    );
  }

  if (!data) {
    return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Failed to load analytics data.</div>;
  }

  // Prepare Chart Data
  const deptChartData = {
    labels: data.deptPerformance.map((d: any) => d.name),
    datasets: [
      {
        label: "Accepted",
        data: data.deptPerformance.map((d: any) => d.accepted),
        backgroundColor: "rgba(74, 144, 226, 0.7)",
      },
      {
        label: "Rejected/Draft",
        data: data.deptPerformance.map((d: any) => d.total - d.accepted),
        backgroundColor: "rgba(200, 200, 200, 0.7)",
      }
    ]
  };

  const trendChartData = {
    labels: data.monthlyTrends.map((t: any) => t.month),
    datasets: [
      {
        label: "Total Submissions",
        data: data.monthlyTrends.map((t: any) => t.total),
        borderColor: "rgba(74, 144, 226, 1)",
        backgroundColor: "rgba(74, 144, 226, 0.2)",
        fill: true,
      },
      {
        label: "Accepted Submissions",
        data: data.monthlyTrends.map((t: any) => t.accepted),
        borderColor: "rgba(125, 184, 127, 1)",
        backgroundColor: "rgba(125, 184, 127, 0.2)",
        borderDash: [5, 5],
      }
    ]
  };

  const suggestionsChartData = {
    labels: ["Accepted", "Rejected", "Pending"],
    datasets: [
      {
        data: [data.suggestionsSplit.accepted, data.suggestionsSplit.rejected, data.suggestionsSplit.pending],
        backgroundColor: [
          "rgba(125, 184, 127, 0.8)",
          "rgba(244, 128, 90, 0.8)",
          "rgba(240, 240, 240, 0.8)"
        ],
        borderWidth: 1,
      }
    ]
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <TrendingUp size={24} color="var(--jspl-blue)" /> Reporting & Analytics
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Overview of workshop effectiveness and department performance</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handleExportCSV}>
          <Download size={18} /> Download CSV Summary
        </button>
      </div>

      {/* System Health Banner */}
      {health && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${health.healthy ? 'var(--success)' : 'var(--danger)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ color: health.healthy ? 'var(--success)' : 'var(--danger)' }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 style={{ color: health.healthy ? 'var(--success)' : 'var(--danger)', margin: 0, fontSize: '1.1rem' }}>
                System Status: {health.healthy ? 'All Systems Operational' : 'Degraded Performance'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                DB: {health.services?.database || 'unknown'} | Storage: {health.services?.storage || 'unknown'}
              </p>
            </div>
          </div>
          {health.metrics?.failedPPTGenerations > 0 && (
            <div style={{ backgroundColor: '#fff3e0', color: '#e65100', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>
              ⚠️ {health.metrics.failedPPTGenerations} Failed PPT Generations detected
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(74, 144, 226, 0.1)', color: 'rgba(74, 144, 226, 1)', borderRadius: '12px' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Total Savings</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--jspl-dark)' }}>₹ {data.kpis.totalSavings} L</p>
          </div>
        </div>
        
        <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(39, 174, 96, 0.1)', color: 'var(--success)', borderRadius: '12px' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Acceptance Rate</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--jspl-dark)' }}>{data.kpis.overallAcceptanceRate}%</p>
          </div>
        </div>
        
        <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(243, 156, 18, 0.1)', color: 'var(--warning)', borderRadius: '12px' }}>
            <Clock size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Avg Implementation Time</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--jspl-dark)' }}>{data.kpis.avgImplementationTimeDays} Days</p>
          </div>
        </div>
        
        <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(155, 89, 182, 0.1)', color: '#9b59b6', borderRadius: '12px' }}>
            <BarChart size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Downtime Avoided</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--jspl-dark)' }}>{data.kpis.totalDowntime} Units</p>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Department Performance</h3>
          <div style={{ height: '300px', position: 'relative' }}>
            <Bar 
              data={deptChartData} 
              options={{ maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }} 
            />
          </div>
        </div>
        
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Monthly Submission Trends</h3>
          <div style={{ height: '300px', position: 'relative' }}>
            <Line data={trendChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ width: '100%', marginBottom: '1rem' }}>Suggestion Outcomes</h3>
          <div style={{ height: '250px', width: '100%', position: 'relative' }}>
            <Pie data={suggestionsChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'auto / span 2' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Award color="var(--warning)" /> Top Contributors Leaderboard
          </h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '400px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                  <th style={{ padding: '1rem 0' }}>Rank</th>
                  <th>User</th>
                  <th>Total Submissions</th>
                </tr>
              </thead>
              <tbody>
                {data.leaderboard.map((user: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem 0', fontWeight: 'bold', color: 'var(--jspl-blue)' }}>#{idx + 1}</td>
                    <td style={{ fontWeight: 'bold' }}>{user.name}</td>
                    <td>
                      <span style={{ padding: '4px 8px', borderRadius: '20px', backgroundColor: 'var(--jspl-blue-light)', color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {user.count}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No contributions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

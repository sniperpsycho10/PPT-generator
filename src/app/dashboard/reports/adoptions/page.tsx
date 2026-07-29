"use client";

import { useEffect, useState } from "react";
import { Download, TrendingUp } from "lucide-react";

interface AdoptionRecord {
  id: string;
  createdAt: string;
  user: {
    name: string | null;
    department: {
      name: string;
    } | null;
  };
  submission: {
    title: string;
    department: {
      name: string;
    };
  };
}

export default function AdoptionsReportPage() {
  const [adoptions, setAdoptions] = useState<AdoptionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdoptions();
  }, []);

  const fetchAdoptions = async () => {
    try {
      const res = await fetch("/api/reports/adoptions");
      const json = await res.json();
      if (json.success) {
        setAdoptions(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch adoptions", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (adoptions.length === 0) {
      alert("No data to export.");
      return;
    }
    const headers = ["Date", "Best Practice Title", "Source Dept", "Adopting Dept", "Adopted By"];
    const rows = adoptions.map(a => [
      new Date(a.createdAt).toLocaleDateString(),
      `"${a.submission.title.replace(/"/g, '""')}"`,
      `"${a.submission.department.name.replace(/"/g, '""')}"`,
      `"${(a.user.department?.name || "Unknown").replace(/"/g, '""')}"`,
      `"${(a.user.name || "Unknown User").replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "adoptions_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading report...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <TrendingUp size={24} color="var(--jspl-blue)" /> Adoption Tracking
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Cross-departmental implementation of Best Practices</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handleExportCSV}>
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                <th style={{ padding: '1rem 0' }}>Date</th>
                <th>Best Practice Title</th>
                <th>Source Dept</th>
                <th>Adopting Dept</th>
                <th>Adopted By</th>
              </tr>
            </thead>
            <tbody>
              {adoptions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No adoptions recorded yet.
                  </td>
                </tr>
              ) : (
                adoptions.map((adoption) => (
                  <tr key={adoption.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem 0' }}>{new Date(adoption.createdAt).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--jspl-blue)' }}>{adoption.submission.title}</td>
                    <td>{adoption.submission.department.name}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>{adoption.user.department?.name || "Unknown"}</td>
                    <td>{adoption.user.name || "Unknown User"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

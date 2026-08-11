"use client";

import React, { useState, useMemo } from "react";
import { Search, Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  initialData: any[];
  currentUserId: string;
  isAdmin: boolean;
}

export default function ProblemLibraryList({ initialData }: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = useMemo(() => {
    if (!searchTerm) return initialData;
    const term = searchTerm.toLowerCase();
    
    return initialData.filter(item => {
      const matchesId = item.trackingId?.toLowerCase().includes(term);
      const matchesDept = item.department?.name?.toLowerCase().includes(term);
      const matchesEquip = item.equipmentDetails?.toLowerCase().includes(term);
      const matchesProb = item.problemStatement?.toLowerCase().includes(term);
      const matchesUser = item.user?.name?.toLowerCase().includes(term);
      
      return matchesId || matchesDept || matchesEquip || matchesProb || matchesUser;
    });
  }, [initialData, searchTerm]);

  const getSeverityColor = (sev: string) => {
    if (sev === "Critical") return "#e74c3c"; // Red
    if (sev === "High") return "#d35400"; // Orange
    if (sev === "Medium") return "#f39c12"; // Yellow
    if (sev === "Low") return "#27ae60"; // Green
    return "var(--text-main)";
  };

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '80vh', margin: '-2rem', padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER BAR */}
      <div style={{ backgroundColor: '#0f6250', color: 'white', padding: '1.5rem 2rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Repetitive Problem Library</h1>
          <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8, marginTop: '0.2rem' }}>Browse standard solutions and historical issues</p>
        </div>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#666' }} />
          <input 
            type="text" 
            placeholder="Search by ID, Dept, Equipment..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem', borderRadius: '4px', border: 'none', outline: 'none' }}
          />
        </div>
      </div>

      {/* MAIN TABLE */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #eaeaea', backgroundColor: '#fafbfc' }}>
          <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#333' }}>Repetitive Problems — Click any row for full details</div>
          <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 'bold' }}>{filteredData.length} entries found</div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ color: '#888', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '1rem', fontWeight: 'bold' }}>Tracking ID</th>
                <th style={{ padding: '1rem', fontWeight: 'bold' }}>Department</th>
                <th style={{ padding: '1rem', fontWeight: 'bold' }}>Equipment & Problem Statement</th>
                <th style={{ padding: '1rem', fontWeight: 'bold' }}>Severity</th>
                <th style={{ padding: '1rem', fontWeight: 'bold' }}>Submitted By</th>
                <th style={{ padding: '1rem', fontWeight: 'bold', textAlign: 'center' }}>Attachments</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((p, idx) => {
                let fileCount = 0;
                if (p.beforeImageUrl) fileCount++;
                if (p.afterImageUrl) fileCount++;
                if (p.attachmentUrl) fileCount++;

                return (
                  <tr 
                    key={p.id} 
                    style={{ 
                      borderBottom: '1px solid #eaeaea', 
                      backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f7f5'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#fff' : '#fafafa'}
                    onClick={() => router.push(`/dashboard/submissions/${p.id}`)}
                  >
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#0f6250', whiteSpace: 'nowrap' }}>{p.trackingId || "-"}</td>
                    <td style={{ padding: '1rem', color: '#555', whiteSpace: 'nowrap' }}>{p.department?.name || "-"}</td>
                    <td style={{ padding: '1rem', color: '#333', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span style={{ fontWeight: 'bold' }}>{p.equipmentDetails || "General"}</span> — <span style={{ color: '#666' }}>{p.problemStatement || p.title}</span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: getSeverityColor(p.severity) }}>{p.severity || "Medium"}</td>
                    <td style={{ padding: '1rem', color: '#555', whiteSpace: 'nowrap' }}>{p.user?.name || "Unknown"}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#f0f0f0', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', color: '#666', border: '1px solid #e0e0e0' }}>
                        <Paperclip size={12} /> {fileCount}
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: '#999' }}>
                    No repetitive problems found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

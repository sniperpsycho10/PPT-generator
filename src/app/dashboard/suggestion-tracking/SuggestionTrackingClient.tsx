"use client";

import React, { useState, useMemo } from "react";
import { RefreshCw, Download, Search, Paperclip, Trophy, X, Send, Camera, Upload, AlertCircle, Filter, ChevronRight, Clock, CheckCircle2, User } from "lucide-react";
import AssignTeamModal from "../components/AssignTeamModal";

interface Props {
  initialSuggestions: any[];
  departments: any[];
  teams: any[];
  isAdmin: boolean;
  currentUserId: string;
}

export default function SuggestionTrackingClient({ initialSuggestions, departments, teams, isAdmin, currentUserId }: Props) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState("All months");
  const [filterDept, setFilterDept] = useState("All departments");
  const [filterStage, setFilterStage] = useState("All stages");
  const [filterGiver, setFilterGiver] = useState("All suggestion givers");

  // Modal State
  const [activeSuggestion, setActiveSuggestion] = useState<any | null>(null);
  const [assigningTeamId, setAssigningTeamId] = useState("");
  
  // Progress Form State
  const [newProgress, setNewProgress] = useState<number>(0);
  const [newNotes, setNewNotes] = useState("");
  const [newPhotoUrls, setNewPhotoUrls] = useState<string[]>([]);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [newAttachedFileUrl, setNewAttachedFileUrl] = useState<string | null>(null);
  const [newAttachedFileName, setNewAttachedFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Extract unique values for filters
  const uniqueMonths = useMemo(() => {
    const months = new Set<string>();
    suggestions.forEach(s => {
      if (s.submission?.cycle?.name) months.add(s.submission.cycle.name);
      else {
        const d = new Date(s.createdAt);
        months.add(`${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`);
      }
    });
    return ["All months", ...Array.from(months).sort()];
  }, [suggestions]);

  const uniqueDepts = ["All departments", ...departments.map(d => d.name)];
  
  const uniqueStages = [
    "All stages",
    "PendingReview", 
    "FeasibilityAnalysis", 
    "Procurement", 
    "ExecutionShutdown", 
    "ExecutionRunning", 
    "Testing", 
    "Standardized", 
    "Closed"
  ];
  
  const uniqueGivers = useMemo(() => {
    const givers = new Set<string>();
    suggestions.forEach(s => {
      if (s.suggestedBy?.name) givers.add(s.suggestedBy.name);
      else if (s.guestName) givers.add(s.guestName);
    });
    return ["All suggestion givers", ...Array.from(givers).sort()];
  }, [suggestions]);

  // Apply filters
  const filteredSuggestions = useMemo(() => {
    return suggestions.filter(s => {
      // 1. Search (ID, Problem, Suggestion, Giver)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesId = s.id.toLowerCase().includes(term);
        const matchesSuggText = s.suggestionText?.toLowerCase().includes(term);
        const matchesProbText = s.submission?.title?.toLowerCase().includes(term);
        const matchesGiver = (s.suggestedBy?.name || "").toLowerCase().includes(term) || (s.guestName || "").toLowerCase().includes(term);
        
        if (!matchesId && !matchesSuggText && !matchesProbText && !matchesGiver) return false;
      }

      // 2. Month Filter
      if (filterMonth !== "All months") {
        const sMonth = s.submission?.cycle?.name || `${new Date(s.createdAt).toLocaleString('default', { month: 'short' })} ${new Date(s.createdAt).getFullYear()}`;
        if (sMonth !== filterMonth) return false;
      }

      // 3. Department Filter
      if (filterDept !== "All departments") {
        const deptName = s.suggestedBy?.department?.name || s.guestDept || "Unknown";
        if (deptName !== filterDept) return false;
      }

      // 4. Stage Filter
      if (filterStage !== "All stages") {
        if (s.implementationStage !== filterStage) return false;
      }

      // 5. Giver Filter
      if (filterGiver !== "All suggestion givers") {
        const giverName = s.suggestedBy?.name || s.guestName || "Anonymous";
        if (giverName !== filterGiver) return false;
      }

      return true;
    });
  }, [suggestions, searchTerm, filterMonth, filterDept, filterStage, filterGiver]);

  // Calculate KPIs
  const totalSuggestions = filteredSuggestions.length;
  const pendingSuggestions = filteredSuggestions.filter(s => s.implementationStage === "PendingReview").length;
  const implementedSuggestions = filteredSuggestions.filter(s => s.implementationStage === "Standardized" || s.implementationStage === "Closed").length;
  
  let totalProgress = 0;
  const giverCounts: Record<string, number> = {};

  filteredSuggestions.forEach(s => {
    totalProgress += (s.currentProgress || 0);
    const giverName = s.suggestedBy?.name || s.guestName || "Anonymous";
    giverCounts[giverName] = (giverCounts[giverName] || 0) + 1;
  });

  const avgProgress = totalSuggestions > 0 ? Math.round(totalProgress / totalSuggestions) : 0;
  
  // Find top giver
  let topGiver = { name: "-", count: 0 };
  Object.entries(giverCounts).forEach(([name, count]) => {
    if (count > topGiver.count && name !== "Anonymous") {
      topGiver = { name, count };
    }
  });

  const clearFilters = () => {
    setSearchTerm("");
    setFilterMonth("All months");
    setFilterDept("All departments");
    setFilterStage("All stages");
    setFilterGiver("All suggestion givers");
  };

  const exportCSV = () => {
    const headers = ["ID", "MONTH", "DEPARTMENT", "PROBLEM TITLE", "SUGGESTION TEXT", "STAGE", "PROGRESS (%)", "GIVER"];
    const rows = filteredSuggestions.map(s => {
      const giver = s.suggestedBy?.name || s.guestName || "Anonymous";
      const deptName = s.suggestedBy?.department?.name || s.guestDept || "Unknown";
      const monthStr = s.submission?.cycle?.name || `${new Date(s.createdAt).toLocaleString('default', { month: 'short' })} ${new Date(s.createdAt).getFullYear()}`;
      
      return [
        `S-${s.id.substring(0,6).toUpperCase()}`,
        monthStr,
        deptName,
        (s.submission?.title || "Direct Suggestion").replace(/"/g, '""'),
        (s.suggestionText || "").replace(/"/g, '""'),
        s.implementationStage || "PendingReview",
        s.currentProgress || 0,
        `"${giver}"`
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Suggestion_Tracking_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRowClick = (s: any) => {
    setActiveSuggestion(s);
    setAssigningTeamId(s.assignedTeamId || "");
    setNewProgress(s.currentProgress || 0);
    setNewNotes("");
    setNewPhotoUrls([]);
    setNewAttachedFileUrl(null);
    setNewAttachedFileName(null);
  };

  const handleAssignTeam = async () => {
    if (!activeSuggestion) return;
    try {
      const res = await fetch(`/api/suggestions/${activeSuggestion.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTeamId: assigningTeamId })
      });
      if (res.ok) {
        const data = await res.json();
        const updated = suggestions.map(s => s.id === data.data.id ? { ...s, assignedTeamId: data.data.assignedTeamId, assignedTeam: teams.find(t => t.id === data.data.assignedTeamId) } : s);
        setSuggestions(updated);
        setActiveSuggestion(updated.find(s => s.id === activeSuggestion.id));
        alert("Team assigned successfully");
      } else {
        alert("Failed to assign team");
      }
    } catch (e) {
      alert("Error assigning team");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        if (type === 'image') {
          setNewPhotoUrls([...newPhotoUrls, data.url]);
        } else {
          setNewAttachedFileUrl(data.url);
          setNewAttachedFileName(file.name);
        }
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      alert("Error uploading file");
    }
    setIsUploading(false);
    // Reset input
    e.target.value = '';
  };

  const handleUpdateProgress = async () => {
    if (!activeSuggestion) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/suggestions/${activeSuggestion.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          progress: newProgress,
          notes: newNotes,
          photoUrls: newPhotoUrls,
          attachedFileUrl: newAttachedFileUrl,
          attachedFileName: newAttachedFileName
        })
      });
      if (res.ok) {
        const data = await res.json();
        const updated = suggestions.map(s => s.id === data.data.id ? data.data : s);
        setSuggestions(updated);
        setActiveSuggestion(data.data);
        setNewNotes("");
        setNewPhotoUrls([]);
        setNewAttachedFileUrl(null);
        setNewAttachedFileName(null);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update progress");
      }
    } catch (e) {
      alert("Error updating progress");
    }
    setIsSubmitting(false);
  };

  const isAssignedMember = activeSuggestion?.assignedTeam?.members?.some((m: any) => m.id === currentUserId) || isAdmin;

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', margin: '-2rem', padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER BAR */}
      <div style={{ backgroundColor: '#0f6250', color: 'white', padding: '1.5rem 2rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Suggestion Tracker</h1>
          <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8, marginTop: '0.2rem' }}>Last refreshed: {new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <button className="btn" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '4px' }} onClick={() => window.location.reload()}>
          <RefreshCw size={16} /> Refresh data
        </button>
      </div>

      {/* FILTER BAR */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white', flex: '1 1 120px' }}>
          {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white', flex: '1 1 150px' }}>
          {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select value={filterStage} onChange={e => setFilterStage(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white', flex: '1 1 150px' }}>
          {uniqueStages.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={filterGiver} onChange={e => setFilterGiver(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white', flex: '1 1 150px' }}>
          {uniqueGivers.map(g => <option key={g} value={g}>{g}</option>)}
        </select>

        <div style={{ position: 'relative', flex: '2 1 200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#999' }} />
          <input 
            type="text" 
            placeholder="Search ID, suggestion, problem, person..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <button onClick={clearFilters} style={{ padding: '0.5rem 1rem', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Clear</button>
        <button onClick={exportCSV} style={{ padding: '0.5rem 1rem', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Export CSV</button>
      </div>

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        
        {/* KPI: Total Suggestions */}
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333', lineHeight: 1 }}>{totalSuggestions}</div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>Total Suggestions</div>
          <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'rgba(15,98,80,0.05)' }}></div>
        </div>

        {/* KPI: Pending */}
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333', lineHeight: 1 }}>{pendingSuggestions}</div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>Pending Review</div>
          <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'rgba(15,98,80,0.05)' }}></div>
        </div>

        {/* KPI: Implemented */}
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333', lineHeight: 1 }}>{implementedSuggestions}</div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>Implemented</div>
          <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'rgba(15,98,80,0.05)' }}></div>
        </div>

        {/* KPI: Avg Progress */}
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333', lineHeight: 1 }}>{avgProgress}%</div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>Avg Progress</div>
          <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'rgba(15,98,80,0.05)' }}></div>
        </div>

        {/* TOP GIVER CARD */}
        <div style={{ backgroundColor: '#e9f4f1', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ backgroundColor: '#fff', padding: '0.5rem', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <Trophy size={20} color="#f39c12" />
            </div>
            <div>
              <div style={{ fontWeight: 'bold', color: '#0f6250', fontSize: '0.9rem' }}>{topGiver.name}</div>
              <div style={{ fontSize: '0.7rem', color: '#666' }}>Top suggestion giver - All months</div>
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f6250', lineHeight: 1 }}>{topGiver.count}</div>
        </div>
      </div>

      {/* MAIN TABLE */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #eaeaea', backgroundColor: '#fafbfc' }}>
          <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#333' }}>Suggestions — click any row to track progress</div>
          <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 'bold' }}>{filteredSuggestions.length} shown</div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ color: '#888', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '1rem', fontWeight: 'bold' }}>ID</th>
                <th style={{ padding: '1rem', fontWeight: 'bold' }}>MONTH</th>
                <th style={{ padding: '1rem', fontWeight: 'bold' }}>DEPARTMENT</th>
                <th style={{ padding: '1rem', fontWeight: 'bold' }}>PROBLEM TITLE</th>
                <th style={{ padding: '1rem', fontWeight: 'bold', width: '25%' }}>SUGGESTION TEXT</th>
                <th style={{ padding: '1rem', fontWeight: 'bold' }}>STAGE</th>
                <th style={{ padding: '1rem', fontWeight: 'bold', width: '100px' }}>PROGRESS</th>
                <th style={{ padding: '1rem', fontWeight: 'bold' }}>GIVER</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuggestions.map((s, idx) => {
                const monthStr = s.submission?.cycle?.name || `${new Date(s.createdAt).toLocaleString('default', { month: 'short' })} ${new Date(s.createdAt).getFullYear()}`;
                const giver = s.suggestedBy?.name || s.guestName || "Anonymous";
                const deptName = s.suggestedBy?.department?.name || s.guestDept || "Unknown";

                return (
                  <tr 
                    key={s.id} 
                    style={{ 
                      borderBottom: '1px solid #eaeaea', 
                      backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f7f5'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#fff' : '#fafafa'}
                    onClick={() => handleRowClick(s)}
                  >
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#333', whiteSpace: 'nowrap' }}>S-{s.id.substring(0,6).toUpperCase()}</td>
                    <td style={{ padding: '1rem', color: '#555', whiteSpace: 'nowrap' }}>{monthStr}</td>
                    <td style={{ padding: '1rem', color: '#555', whiteSpace: 'nowrap' }}>{deptName}</td>
                    <td style={{ padding: '1rem', color: '#333', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span style={{ fontWeight: 'bold' }}>{s.submission?.title || "Direct Suggestion"}</span>
                    </td>
                    <td style={{ padding: '1rem', color: '#555', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.suggestionText}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#0f6250' }}>{s.implementationStage?.replace(/([A-Z])/g, ' $1').trim() || "Pending Review"}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.75rem', color: '#555' }}>
                        <span>{s.currentProgress || 0}%</span>
                      </div>
                      <div style={{ width: '100%', height: '4px', backgroundColor: '#e0e0e0', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${s.currentProgress || 0}%`, height: '100%', backgroundColor: '#0f6250' }}></div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#555', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{giver}</td>
                  </tr>
                );
              })}
              
              {filteredSuggestions.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#999' }}>
                    No suggestions match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXECUTION TRACKING MODAL */}
      {activeSuggestion && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }} onClick={() => setActiveSuggestion(null)}>
          <div style={{ width: '600px', maxWidth: '90vw', height: '100%', backgroundColor: '#f8fafc', boxShadow: '-5px 0 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Execution Tracking</div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f6250', fontWeight: 700 }}>S-{activeSuggestion.id.substring(0,6).toUpperCase()}</h2>
                <div style={{ fontSize: '0.9rem', color: '#334155', marginTop: '0.5rem' }}>{activeSuggestion.suggestionText}</div>
                {activeSuggestion.submissionId && (
                  <a href={`/dashboard/submissions/${activeSuggestion.submissionId}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#3b82f6', textDecoration: 'none', display: 'inline-block', marginTop: '0.5rem' }}>View Parent Problem →</a>
                )}
              </div>
              <button onClick={() => setActiveSuggestion(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Assignment Section */}
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Team Assignment</h3>
                  {isAdmin && (
                    <button 
                      className="btn" 
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#e3f2fd', color: '#1565c0' }} 
                      onClick={() => setTeamModalOpen(true)}
                    >
                      Assign Team
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '0.95rem', color: '#475569' }}>
                  {activeSuggestion.assignedTeam?.name ? (
                    <strong>Assigned Team: {activeSuggestion.assignedTeam.name}</strong>
                  ) : (
                    "No team assigned yet."
                  )}
                </div>
              </div>

              {/* Update Progress Form */}
              {isAssignedMember && (
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', color: '#1e293b' }}>Log Progress</h3>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Completion Slider</label>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f6250' }}>{newProgress}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="100" step="5"
                      value={newProgress}
                      onChange={e => setNewProgress(parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: '#0f6250' }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Work Description</label>
                    <textarea 
                      className="input-field" 
                      rows={3} 
                      placeholder="Describe what work has been completed..."
                      value={newNotes}
                      onChange={e => setNewNotes(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px dashed #cbd5e1', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.85rem', cursor: isUploading ? 'not-allowed' : 'pointer' }}>
                      <Camera size={16} /> Add Images
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFileUpload(e, 'image')} disabled={isUploading} />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px dashed #cbd5e1', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.85rem', cursor: isUploading ? 'not-allowed' : 'pointer' }}>
                      <Upload size={16} /> Attach Files
                      <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv" style={{ display: 'none' }} onChange={e => handleFileUpload(e, 'file')} disabled={isUploading} />
                    </label>
                    
                    {newPhotoUrls.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: '100%' }}>
                        {newPhotoUrls.map((url, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '4px', fontSize: '0.75rem' }}>
                            <Camera size={12} /> Image {i+1}
                            <button type="button" onClick={() => setNewPhotoUrls(newPhotoUrls.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', marginLeft: '4px', padding: 0 }}><X size={12}/></button>
                          </div>
                        ))}
                      </div>
                    )}
                    {newAttachedFileUrl && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '4px', fontSize: '0.75rem', width: 'fit-content' }}>
                        <Paperclip size={12} /> {newAttachedFileName || "Attached File"}
                        <button type="button" onClick={() => { setNewAttachedFileUrl(null); setNewAttachedFileName(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', marginLeft: '4px', padding: 0 }}><X size={12}/></button>
                      </div>
                    )}
                  </div>

                  <button 
                    className="btn" 
                    onClick={handleUpdateProgress} 
                    disabled={isSubmitting}
                    style={{ width: '100%', backgroundColor: '#0f6250', color: 'white', padding: '0.8rem', borderRadius: '8px', border: 'none', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {isSubmitting ? "Saving..." : <><Send size={16} /> Submit Update</>}
                  </button>
                </div>
              )}

              {/* Progress History */}
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', color: '#1e293b' }}>Timeline History</h3>
                
                {!activeSuggestion.progressLog || activeSuggestion.progressLog.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 0' }}>
                    <AlertCircle size={32} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                    <p style={{ margin: 0 }}>No progress updates logged yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '11px', top: '24px', bottom: '24px', width: '2px', backgroundColor: '#e2e8f0', zIndex: 1 }}></div>
                    
                    {activeSuggestion.progressLog.map((log: any) => (
                      <div key={log.id} style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 2 }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0f6250', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', flexShrink: 0, marginTop: '2px' }}>
                          ✓
                        </div>
                        <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Progress: {log.progress}%</span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {new Date(log.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}
                            </span>
                          </div>
                          {log.notes && (
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#475569', lineHeight: 1.5 }}>
                              {log.notes}
                            </p>
                          )}
                          {(log.photoUrls?.length > 0 || log.attachedFileUrl) && (
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                              {log.photoUrls?.map((url: string, i: number) => (
                                <a key={i} href={url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '4px', textDecoration: 'none' }}>
                                  <Camera size={12} /> Image
                                </a>
                              ))}
                              {log.attachedFileUrl && (
                                <a href={log.attachedFileUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '4px', textDecoration: 'none' }}>
                                  <Paperclip size={12} /> {log.attachedFileName || "File"}
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Assign Team Modal */}
      {activeSuggestion && (
        <AssignTeamModal 
          isOpen={teamModalOpen}
          onClose={() => setTeamModalOpen(false)}
          onAssignExisting={async (teamId) => {
            const res = await fetch(`/api/suggestions/${activeSuggestion.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ assignedTeamId: teamId })
            });
            if (res.ok) {
              setTeamModalOpen(false);
              window.location.reload();
            } else {
              throw new Error("Failed to assign team");
            }
          }}
          onCreateAndAssign={async (teamName, memberIds) => {
            const resTeam = await fetch("/api/teams", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: teamName, memberIds })
            });
            const teamData = await resTeam.json();
            if (!resTeam.ok) throw new Error(teamData.error || "Failed to create team");
            
            const resAssign = await fetch(`/api/suggestions/${activeSuggestion.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ assignedTeamId: teamData.data.id })
            });
            if (resAssign.ok) {
              setTeamModalOpen(false);
              window.location.reload();
            } else {
              throw new Error("Failed to assign team");
            }
          }}
          currentTeamId={activeSuggestion.assignedTeamId}
        />
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />
    </div>
  );
}

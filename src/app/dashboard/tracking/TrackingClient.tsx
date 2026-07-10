"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, X, Calendar, AlertTriangle, IndianRupee, ShieldAlert, GitPullRequestDraft } from "lucide-react";

const STAGES = [
  "Pending Review", 
  "Feasibility Analysis", 
  "Procurement/Spares", 
  "Execution (Shutdown Required)", 
  "Execution (Running)", 
  "Testing", 
  "Standardized", 
  "Closed"
];

const DEPARTMENTS = [
  "SMS (Steel Melting Shop)",
  "Blast Furnace",
  "Coke Ovens",
  "Rolling Mill",
  "Sinter Plant",
  "Power Plant",
  "Raw Material Handling",
  "Mechanical Maintenance",
  "Electrical Maintenance",
  "Quality Control",
  "Safety",
  "General Administration"
];

interface Props {
  initialSuggestions: any[];
  departments?: any[];
  isAdmin: boolean;
}

export default function TrackingClient({ initialSuggestions, departments = DEPARTMENTS, isAdmin }: Props) {
  const router = useRouter();
  const [selectedSug, setSelectedSug] = useState<any | null>(null);
  
  // Form State
  const [stage, setStage] = useState("");
  const [safety, setSafety] = useState("");
  const [cost, setCost] = useState("");
  const [dept, setDept] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [actualDate, setActualDate] = useState("");
  const [remarks, setRemarks] = useState("");

  const openModal = (sug: any) => {
    setSelectedSug(sug);
    setStage(sug.implementationStage || "Pending Review");
    setSafety(sug.safetyImpact || "");
    setCost(sug.costImplication ? sug.costImplication.toString() : "");
    setDept(sug.executingDepartment || "");
    setTargetDate(sug.targetCompletionDate ? new Date(sug.targetCompletionDate).toISOString().split('T')[0] : "");
    setActualDate(sug.actualCompletionDate ? new Date(sug.actualCompletionDate).toISOString().split('T')[0] : "");
    setRemarks(sug.trackingRemarks || "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSug) return;

    const res = await fetch(`/api/suggestions/${selectedSug.id}/tracking`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        implementationStage: stage,
        safetyImpact: safety,
        costImplication: cost,
        executingDepartment: dept,
        targetCompletionDate: targetDate,
        actualCompletionDate: actualDate,
        trackingRemarks: remarks
      })
    });

    if (res.ok) {
      setSelectedSug(null);
      router.refresh();
    } else {
      const errData = await res.json().catch(() => ({}));
      alert(`Failed to update tracking info: ${errData.error || res.statusText}`);
    }
  };

  const getStageColor = (s: string | null | undefined) => {
    if (!s) return "var(--text-secondary)";
    if (s.includes("Closed")) return "var(--success-color)";
    if (s.includes("Shutdown")) return "var(--error-color)";
    if (s.includes("Execution")) return "var(--warning-color)";
    if (s.includes("Procurement") || s.includes("Feasibility")) return "var(--jspl-blue-light)";
    return "var(--text-secondary)";
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <GitPullRequestDraft size={32} color="var(--jspl-blue)" />
        <h1 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-primary)' }}>Suggestion Tracking (Steel Operations)</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {initialSuggestions.length === 0 && (
          <p style={{ color: 'var(--text-secondary)' }}>No accepted suggestions to track yet.</p>
        )}
        {initialSuggestions.map(sug => (
          <div key={sug.id} style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            padding: '1.5rem',
            borderLeft: `6px solid ${getStageColor(sug.implementationStage)}`,
            boxShadow: 'var(--glass-shadow)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                ID: {sug.id.substring(0,8)} | Dept: {sug.guestDept || 'N/A'}
              </div>
              {isAdmin && (
                <button 
                  onClick={() => openModal(sug)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--jspl-blue)' }}
                >
                  <Edit size={18} />
                </button>
              )}
            </div>
            
            <h3 style={{ margin: '1rem 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              {sug.suggestionText}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Stage:</span>
                <span style={{ fontWeight: 'bold', color: getStageColor(sug.implementationStage) }}>{sug.implementationStage || "Pending Review"}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldAlert size={14}/> Safety Impact:</span>
                <span style={{ color: 'var(--text-primary)' }}>{sug.safetyImpact || "Not Evaluated"}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><IndianRupee size={14}/> Est. Cost:</span>
                <span style={{ color: 'var(--text-primary)' }}>{sug.costImplication ? `₹ ${sug.costImplication}` : "TBD"}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={14}/> Execution Dept:</span>
                <span style={{ color: 'var(--text-primary)' }}>{sug.executingDepartment || "Unassigned"}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14}/> Target Date:</span>
                <span style={{ color: 'var(--text-primary)' }}>{sug.targetCompletionDate ? new Date(sug.targetCompletionDate).toLocaleDateString() : "Not Set"}</span>
              </div>
              
              {sug.trackingRemarks && (
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--glass-border)' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', fontWeight: 'bold' }}>Remarks / Blockers:</span>
                  <span style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>{sug.trackingRemarks}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {selectedSug && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'var(--glass-bg)', 
            backdropFilter: 'blur(20px)',
            padding: '2.5rem', 
            borderRadius: '16px', 
            width: '90%', 
            maxWidth: '650px',
            maxHeight: '90vh', 
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid var(--glass-border)',
            animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <style>{`
              @keyframes popIn {
                0% { transform: scale(0.8); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
              }
            `}</style>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
              <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Update Tracking Info</h2>
              <button onClick={() => setSelectedSug(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={28} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Implementation Stage</label>
                <select value={stage} onChange={e => setStage(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Safety Impact</label>
                  <select value={safety} onChange={e => setSafety(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
                    <option value="">Select...</option>
                    <option value="High">High (Requires Permit/Shutdown)</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                    <option value="None">None</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Est. Cost (INR)</label>
                  <input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="e.g. 50000" style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Target Date</label>
                  <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Actual Completion</label>
                  <input type="date" value={actualDate} onChange={e => setActualDate(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Executing Department</label>
                <select value={dept} onChange={e => setDept(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
                  <option value="">Select Department...</option>
                  {DEPARTMENTS.map((d: string) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Tracking Remarks / Blockers</label>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-primary)', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setSelectedSug(null)} style={{ flex: 1, padding: '1rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Cancel
                </button>
                <button type="submit" style={{ flex: 2, padding: '1rem', background: 'var(--jspl-blue)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Save Tracking Info
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

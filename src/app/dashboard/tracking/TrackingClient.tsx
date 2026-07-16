"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Edit, X, Calendar, AlertTriangle, IndianRupee, ShieldAlert, GitPullRequestDraft, Upload, Image as ImageIcon, History, Users } from "lucide-react";

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
  teams?: any[];
  isAdmin: boolean;
  currentUserId: string;
}

export default function TrackingClient({ initialSuggestions, departments = DEPARTMENTS, teams = [], isAdmin, currentUserId }: Props) {
  const router = useRouter();
  const [selectedSug, setSelectedSug] = useState<any | null>(null);
  
  // Tab State for Modal
  const [activeTab, setActiveTab] = useState<"DETAILS" | "PROGRESS">("DETAILS");

  // Form State - Details
  const [stage, setStage] = useState("");
  const [safety, setSafety] = useState("");
  const [cost, setCost] = useState("");
  const [dept, setDept] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [actualDate, setActualDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [assignedTeamId, setAssignedTeamId] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);

  // Form State - Progress
  const [progressValue, setProgressValue] = useState(0);
  const [progressNotes, setProgressNotes] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savingProgress, setSavingProgress] = useState(false);

  const openModal = (sug: any) => {
    setSelectedSug(sug);
    setStage(sug.implementationStage || "Pending Review");
    setSafety(sug.safetyImpact || "");
    setCost(sug.costImplication ? sug.costImplication.toString() : "");
    setDept(sug.executingDepartment || "");
    setTargetDate(sug.targetCompletionDate ? new Date(sug.targetCompletionDate).toISOString().split('T')[0] : "");
    setActualDate(sug.actualCompletionDate ? new Date(sug.actualCompletionDate).toISOString().split('T')[0] : "");
    setRemarks(sug.trackingRemarks || "");
    setAssignedTeamId(sug.assignedTeamId || "");
    
    setProgressValue(sug.currentProgress || 0);
    setProgressNotes("");
    setUploadedUrls([]);
    setActiveTab("DETAILS");
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSug) return;
    setSavingDetails(true);

    const payload: any = {
      implementationStage: stage,
      safetyImpact: safety,
      costImplication: cost,
      executingDepartment: dept,
      targetCompletionDate: targetDate,
      actualCompletionDate: actualDate,
      trackingRemarks: remarks
    };

    if (isAdmin) {
      payload.assignedTeamId = assignedTeamId;
    }

    const res = await fetch(`/api/suggestions/${selectedSug.id}/tracking`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      setSelectedSug(data.data);
      router.refresh();
      alert("Tracking details saved successfully!");
    } else {
      const errData = await res.json().catch(() => ({}));
      alert(`Failed to update tracking info: ${errData.error || res.statusText}`);
    }
    setSavingDetails(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingFiles(true);
    
    const newUrls = [...uploadedUrls];
    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          newUrls.push(data.url);
        } else {
          alert(`Failed to upload ${file.name}`);
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    setUploadedUrls(newUrls);
    setUploadingFiles(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveProgress = async () => {
    if (!selectedSug) return;
    if (progressValue < (selectedSug.currentProgress || 0)) {
      alert("Progress cannot be less than the current progress.");
      return;
    }
    
    setSavingProgress(true);
    const res = await fetch(`/api/suggestions/${selectedSug.id}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        progress: progressValue,
        notes: progressNotes,
        photoUrls: uploadedUrls
      })
    });

    if (res.ok) {
      const data = await res.json();
      setSelectedSug(data.data); // Update with new history
      setProgressNotes("");
      setUploadedUrls([]);
      router.refresh();
      alert("Progress added successfully!");
    } else {
      const errData = await res.json().catch(() => ({}));
      alert(`Failed to add progress: ${errData.error || res.statusText}`);
    }
    setSavingProgress(false);
  };

  const getStageColor = (s: string | null | undefined) => {
    if (!s) return "var(--text-secondary)";
    if (s.includes("Closed")) return "var(--success-color)";
    if (s.includes("Shutdown")) return "var(--error-color)";
    if (s.includes("Execution")) return "var(--warning-color)";
    if (s.includes("Procurement") || s.includes("Feasibility")) return "var(--jspl-blue-light)";
    return "var(--text-secondary)";
  };

  const getProgressColor = (val: number) => {
    if (val < 25) return "#e74c3c";
    if (val < 75) return "#f39c12";
    return "#27ae60";
  };

  const canEdit = isAdmin || (selectedSug?.assignedTeam?.members?.some((m: any) => m.id === currentUserId));

  return (
    <div style={{ padding: '2rem' }} className="animate-page-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <GitPullRequestDraft size={32} color="var(--jspl-blue)" />
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-primary)' }}>Suggestion Tracking</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Track execution, assign teams, and log progress updates.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {initialSuggestions.length === 0 && (
          <div className="card glass" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No suggestions available for tracking.</p>
          </div>
        )}
        {initialSuggestions.map(sug => (
          <div key={sug.id} className="card glass hover-lift" style={{
            padding: '1.5rem',
            borderLeft: `6px solid ${getStageColor(sug.implementationStage)}`,
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                ID: {sug.id.substring(0,8)} | Dept: {sug.guestDept || 'N/A'}
              </div>
              <button 
                onClick={() => openModal(sug)}
                className="btn"
                style={{ padding: '0.4rem 0.8rem', background: 'var(--jspl-blue)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
              >
                <Edit size={14} /> Update
              </button>
            </div>
            
            <h3 style={{ margin: '1rem 0', color: 'var(--jspl-dark)', fontSize: '1.1rem', fontWeight: 'bold' }}>
              {sug.suggestionText}
            </h3>

            {/* Progress Bar */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Overall Progress</span>
                <span style={{ color: getProgressColor(sug.currentProgress || 0) }}>{sug.currentProgress || 0}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--glass-border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${sug.currentProgress || 0}%`, height: '100%', backgroundColor: getProgressColor(sug.currentProgress || 0), transition: 'width 0.5s ease' }}></div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Stage:</span>
                <span style={{ fontWeight: 'bold', color: getStageColor(sug.implementationStage) }}>{sug.implementationStage || "Pending Review"}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14}/> Assigned Team:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{sug.assignedTeam?.name || "Unassigned"}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldAlert size={14}/> Safety Impact:</span>
                <span style={{ color: 'var(--text-primary)' }}>{sug.safetyImpact || "Not Evaluated"}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14}/> Target Date:</span>
                <span style={{ color: 'var(--text-primary)' }}>{sug.targetCompletionDate ? new Date(sug.targetCompletionDate).toLocaleDateString() : "Not Set"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {selectedSug && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          overflowY: 'auto'
        }}>
          <div className="card glass" style={{
            width: '100%', maxWidth: '700px', maxHeight: '85vh',
            display: 'flex', flexDirection: 'column', padding: '0',
            overflow: 'hidden', margin: 'auto'
          }}>
            
            {/* Modal Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--header-bg)' }}>
              <h2 style={{ color: 'var(--jspl-blue)', margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Update: {selectedSug.suggestionText.substring(0, 40)}...</h2>
              <button onClick={() => setSelectedSug(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.3)' }}>
              <button 
                onClick={() => setActiveTab("DETAILS")}
                style={{ flex: 1, padding: '1rem', border: 'none', background: activeTab === "DETAILS" ? 'var(--glass-bg)' : 'transparent', fontWeight: 'bold', color: activeTab === "DETAILS" ? 'var(--jspl-blue)' : 'var(--text-secondary)', borderBottom: activeTab === "DETAILS" ? '3px solid var(--jspl-blue)' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Tracking Details
              </button>
              <button 
                onClick={() => setActiveTab("PROGRESS")}
                style={{ flex: 1, padding: '1rem', border: 'none', background: activeTab === "PROGRESS" ? 'var(--glass-bg)' : 'transparent', fontWeight: 'bold', color: activeTab === "PROGRESS" ? 'var(--jspl-blue)' : 'var(--text-secondary)', borderBottom: activeTab === "PROGRESS" ? '3px solid var(--jspl-blue)' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Progress History
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
              
              {activeTab === "DETAILS" && (
                <form onSubmit={handleSaveDetails} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {isAdmin && (
                    <div style={{ padding: '1rem', background: 'rgba(52, 152, 219, 0.1)', borderRadius: '8px', border: '1px solid rgba(52, 152, 219, 0.2)', marginBottom: '0.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--jspl-blue)' }}><Users size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }}/> Assign to Team</label>
                      <select className="input-field" value={assignedTeamId} onChange={e => setAssignedTeamId(e.target.value)}>
                        <option value="">-- Unassigned --</option>
                        {teams.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}>Implementation Stage</label>
                    <select className="input-field" value={stage} onChange={e => setStage(e.target.value)} disabled={!canEdit}>
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}>Safety Impact</label>
                      <select className="input-field" value={safety} onChange={e => setSafety(e.target.value)} disabled={!canEdit}>
                        <option value="">Select...</option>
                        <option value="High">High (Requires Permit/Shutdown)</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                        <option value="None">None</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}>Est. Cost (INR)</label>
                      <input type="number" className="input-field" value={cost} onChange={e => setCost(e.target.value)} placeholder="e.g. 50000" disabled={!canEdit} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}>Target Date</label>
                      <input type="date" className="input-field" value={targetDate} onChange={e => setTargetDate(e.target.value)} disabled={!canEdit} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}>Actual Completion</label>
                      <input type="date" className="input-field" value={actualDate} onChange={e => setActualDate(e.target.value)} disabled={!canEdit} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}>Executing Department</label>
                    <select className="input-field" value={dept} onChange={e => setDept(e.target.value)} disabled={!canEdit}>
                      <option value="">Select Department...</option>
                      {DEPARTMENTS.map((d: string) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}>Tracking Remarks / Blockers</label>
                    <textarea className="input-field" value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} style={{ resize: 'vertical' }} disabled={!canEdit} />
                  </div>

                  {canEdit && (
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                      <button type="button" onClick={() => setSelectedSug(null)} className="btn" style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={savingDetails}>
                        {savingDetails ? "Saving..." : "Save Details"}
                      </button>
                    </div>
                  )}
                </form>
              )}

              {activeTab === "PROGRESS" && (
                <div>
                  {canEdit && (
                    <div style={{ padding: '1.5rem', background: 'var(--table-row-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--jspl-blue)', marginBottom: '1rem', fontWeight: 'bold' }}>Add Progress Update</h3>
                      
                      <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <label style={{ fontWeight: '600', color: 'var(--text-primary)' }}>New Progress Level: {progressValue}%</label>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={progressValue} 
                          onChange={(e) => setProgressValue(Number(e.target.value))}
                          style={{ width: '100%', cursor: 'pointer', accentColor: getProgressColor(progressValue) }}
                        />
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                          <span>Current: {selectedSug.currentProgress || 0}%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>Progress Notes</label>
                        <textarea 
                          className="input-field" 
                          placeholder="Describe what was accomplished in this update..." 
                          value={progressNotes} 
                          onChange={e => setProgressNotes(e.target.value)} 
                          rows={3} 
                        />
                      </div>

                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>Upload Photos</label>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => fileInputRef.current?.click()} 
                            className="btn" 
                            style={{ padding: '0.5rem 1rem', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            disabled={uploadingFiles}
                          >
                            {uploadingFiles ? "Uploading..." : <><Upload size={16} /> Choose Images</>}
                          </button>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{ display: 'none' }} 
                            multiple 
                            accept="image/*" 
                            onChange={handleFileUpload} 
                          />
                          
                          {uploadedUrls.map((url, i) => (
                            <div key={i} style={{ width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)', position: 'relative' }}>
                              <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Upload preview" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="button" onClick={() => setSelectedSug(null)} className="btn" style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                          Close
                        </button>
                        <button onClick={handleSaveProgress} className="btn btn-primary" style={{ flex: 2 }} disabled={savingProgress}>
                          {savingProgress ? "Submitting..." : "Submit Update"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <History size={20} /> History Log
                    </h3>
                    
                    {(!selectedSug.progressLog || selectedSug.progressLog.length === 0) ? (
                      <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>No progress history yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                        {/* Vertical Timeline Line */}
                        <div style={{ position: 'absolute', left: '19px', top: '20px', bottom: '20px', width: '2px', backgroundColor: 'var(--glass-border)', zIndex: 0 }}></div>
                        
                        {selectedSug.progressLog.map((log: any, idx: number) => (
                          <div key={log.id} style={{ display: 'flex', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
                            {/* Node */}
                            <div style={{ 
                              width: '40px', height: '40px', borderRadius: '50%', 
                              backgroundColor: getProgressColor(log.progress), 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', 
                              color: 'white', fontWeight: 'bold', fontSize: '0.8rem',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.1)', flexShrink: 0
                            }}>
                              {log.progress}%
                            </div>
                            
                            {/* Content */}
                            <div style={{ background: 'var(--glass-bg)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--glass-border)', flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Progress Reached: {log.progress}%</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(log.createdAt).toLocaleString()}</span>
                              </div>
                              
                              {log.notes && (
                                <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>{log.notes}</p>
                              )}
                              
                              {log.photoUrls && log.photoUrls.length > 0 && (
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  {log.photoUrls.map((url: string, i: number) => (
                                    <a key={i} href={url} target="_blank" rel="noreferrer" style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)', display: 'block' }}>
                                      <img src={url} alt={`Evidence ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}

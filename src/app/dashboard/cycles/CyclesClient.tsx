"use client";

import React, { useEffect, useState } from "react";
import { Calendar, Plus, X, Edit, Trash2, Power } from "lucide-react";

export default function CyclesClient() {
  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    month: "",
    year: "",
    startDate: "",
    endDate: "",
    isActive: true,
    bpRemarks: "",
    rpRemarks: ""
  });

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = ["2024", "2025", "2026", "2027", "2028", "2029", "2030"];

  const fetchCycles = async () => {
    try {
      const res = await fetch("/api/cycles");
      const data = await res.json();
      if (data.success) {
        setCycles(data.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCycles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchCycles();
        setFormData({ name: "", month: "", year: "", startDate: "", endDate: "", isActive: true, bpRemarks: "", rpRemarks: "" });
        alert("Cycle created successfully! All users have been notified.");
      } else {
        alert(data.error || "Failed to create cycle.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    }
    setSubmitting(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCycleId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/cycles/${editingCycleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        fetchCycles();
        setFormData({ name: "", month: "", year: "", startDate: "", endDate: "", isActive: true, bpRemarks: "", rpRemarks: "" });
        alert("Cycle updated successfully!");
      } else {
        alert(data.error || "Failed to update cycle.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    }
    setSubmitting(false);
  };

  const handleToggleStatus = async (c: any) => {
    if (!confirm(`Are you sure you want to ${c.isActive ? 'close' : 'open'} the ${c.name} cycle?`)) return;
    try {
      const res = await fetch(`/api/cycles/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: c.name,
          month: c.month,
          year: c.year,
          startDate: c.startDate,
          endDate: c.endDate,
          isActive: !c.isActive,
          bpRemarks: c.bpRemarks,
          rpRemarks: c.rpRemarks
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchCycles();
      } else {
        alert(data.error || "Failed to update cycle status.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the ${name} cycle? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/cycles/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchCycles();
      } else {
        alert(data.error || "Failed to delete cycle.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    }
  };

  const activeCycles = cycles.filter(c => c.isActive);
  const closedCycles = cycles.filter(c => !c.isActive);

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Submission Cycles Manager</h1>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0, maxWidth: '600px' }}>
            Open new monthly submission windows. When you create a cycle, a global notification is sent to all users with the deadline.
          </p>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowModal(true)}>
            <Plus size={18} /> New Cycle
          </button>
        </div>

        <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--success)' }}>Active & Upcoming Cycles</h3>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px', marginBottom: '2rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                <th style={{ padding: '1rem 0' }}>Cycle Name</th>
                <th>Month</th>
                <th>Year</th>
                <th>Window Opens</th>
                <th>Deadline (Closes)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>}
              {!loading && activeCycles.length === 0 && <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No active cycles found.</td></tr>}
              {!loading && activeCycles.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '1rem 0', fontWeight: 'bold' }}>{c.name}</td>
                  <td>{c.month || "-"}</td>
                  <td>{c.year || "-"}</td>
                  <td>{new Date(c.startDate).toLocaleDateString()}</td>
                  <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{new Date(c.endDate).toLocaleDateString()}</td>
                  <td>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#e8f5e9', color: '#2e7d32', fontSize: '0.8rem', fontWeight: 'bold' }}>Active</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => {
                        setEditingCycleId(c.id);
                        setFormData({
                          name: c.name,
                          month: c.month || "",
                          year: c.year || "",
                          startDate: new Date(c.startDate).toISOString().split('T')[0],
                          endDate: new Date(c.endDate).toISOString().split('T')[0],
                          isActive: c.isActive,
                          bpRemarks: c.bpRemarks || "",
                          rpRemarks: c.rpRemarks || ""
                        });
                        setShowEditModal(true);
                      }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--jspl-blue)' }} title="Edit"><Edit size={16} /></button>
                      <button onClick={() => handleToggleStatus(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warning)' }} title="Close Cycle"><Power size={16} /></button>
                      <button onClick={() => handleDelete(c.id, c.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }} title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Cycle History (Closed)</h3>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                <th style={{ padding: '1rem 0' }}>Cycle Name</th>
                <th>Month</th>
                <th>Year</th>
                <th>Window Opens</th>
                <th>Deadline (Closes)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && closedCycles.length === 0 && <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No cycle history found.</td></tr>}
              {!loading && closedCycles.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--glass-border)', opacity: 0.7 }}>
                  <td style={{ padding: '1rem 0', fontWeight: 'bold' }}>{c.name}</td>
                  <td>{c.month || "-"}</td>
                  <td>{c.year || "-"}</td>
                  <td>{new Date(c.startDate).toLocaleDateString()}</td>
                  <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{new Date(c.endDate).toLocaleDateString()}</td>
                  <td>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#ffebee', color: '#c62828', fontSize: '0.8rem', fontWeight: 'bold' }}>Closed</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => {
                        setEditingCycleId(c.id);
                        setFormData({
                          name: c.name,
                          month: c.month || "",
                          year: c.year || "",
                          startDate: new Date(c.startDate).toISOString().split('T')[0],
                          endDate: new Date(c.endDate).toISOString().split('T')[0],
                          isActive: c.isActive,
                          bpRemarks: c.bpRemarks || "",
                          rpRemarks: c.rpRemarks || ""
                        });
                        setShowEditModal(true);
                      }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--jspl-blue)' }} title="Edit"><Edit size={16} /></button>
                      <button onClick={() => handleToggleStatus(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)' }} title="Open Cycle"><Power size={16} /></button>
                      <button onClick={() => handleDelete(c.id, c.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }} title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Calendar size={24} color="var(--jspl-blue)" /> Create New Cycle
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="var(--text-secondary)" /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Cycle Name (e.g. June 2026)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. June 2026" 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Month</label>
                  <select className="input-field" value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} required>
                    <option value="">Select Month</option>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Year</label>
                  <select className="input-field" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} required>
                    <option value="">Select Year</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Start Date (Window Opens)</label>
                <input 
                  type="date" 
                  className="input-field" 
                  required 
                  value={formData.startDate} 
                  onChange={e => setFormData({...formData, startDate: e.target.value})} 
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>End Date (Deadline)</label>
                <input 
                  type="date" 
                  className="input-field" 
                  required 
                  value={formData.endDate} 
                  onChange={e => setFormData({...formData, endDate: e.target.value})} 
                />
              </div>

              <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Workshop Tracker Settings</h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Best Practice General Remarks</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.bpRemarks} 
                  onChange={e => setFormData({...formData, bpRemarks: e.target.value})} 
                  placeholder="e.g. Horizontal deployment (SMS-2 and SMS-3)" 
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Repetitive Problem General Remarks</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.rpRemarks} 
                  onChange={e => setFormData({...formData, rpRemarks: e.target.value})} 
                  placeholder="e.g. Solution will come after site visit" 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? "Creating & Notifying..." : "Create Cycle & Notify Users"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Edit size={24} color="var(--jspl-blue)" /> Edit Cycle
              </h2>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="var(--text-secondary)" /></button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Cycle Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Month</label>
                  <select className="input-field" value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} required>
                    <option value="">Select Month</option>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Year</label>
                  <select className="input-field" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} required>
                    <option value="">Select Year</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Start Date</label>
                <input 
                  type="date" 
                  className="input-field" 
                  required 
                  value={formData.startDate} 
                  onChange={e => setFormData({...formData, startDate: e.target.value})} 
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>End Date</label>
                <input 
                  type="date" 
                  className="input-field" 
                  required 
                  value={formData.endDate} 
                  onChange={e => setFormData({...formData, endDate: e.target.value})} 
                />
              </div>

              <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Workshop Tracker Settings</h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Best Practice General Remarks</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.bpRemarks} 
                  onChange={e => setFormData({...formData, bpRemarks: e.target.value})} 
                  placeholder="e.g. Horizontal deployment (SMS-2 and SMS-3)" 
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Repetitive Problem General Remarks</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.rpRemarks} 
                  onChange={e => setFormData({...formData, rpRemarks: e.target.value})} 
                  placeholder="e.g. Solution will come after site visit" 
                />
              </div>

              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                />
                <label htmlFor="isActiveToggle" style={{ fontWeight: 'bold', cursor: 'pointer' }}>Cycle is Active (Open)</label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

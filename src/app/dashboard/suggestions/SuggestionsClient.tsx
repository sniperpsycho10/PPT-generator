"use client";

import React, { useEffect, useState } from "react";
import { Plus, X, Edit2 } from "lucide-react";

export default function SuggestionsClient({ isAdmin }: { isAdmin: boolean }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState("");
  
  const [formData, setFormData] = useState({
    guestName: "",
    guestDept: "",
    suggestionText: ""
  });

  const fetchSuggestions = async () => {
    try {
      const res = await fetch("/api/suggestions");
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/suggestions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchSuggestions();
      }
    } catch(err) {
      console.error(err);
    }
  };

  const deleteSuggestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this suggestion?")) return;
    try {
      const res = await fetch(`/api/suggestions/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchSuggestions();
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editMode) {
        await fetch(`/api/suggestions/${currentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch("/api/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      }
      setShowModal(false);
      fetchSuggestions();
    } catch(err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setEditMode(false);
    setFormData({ guestName: "", guestDept: "", suggestionText: "" });
    setShowModal(true);
  };

  const openEditModal = (s: any) => {
    setEditMode(true);
    setCurrentId(s.id);
    setFormData({
      guestName: s.guestName || "",
      guestDept: s.guestDept || "",
      suggestionText: s.suggestionText || ""
    });
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "Accepted": return <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#e8f5e9', color: '#2e7d32', fontSize: '0.8rem', fontWeight: 'bold' }}>Accepted</span>;
      case "Rejected": return <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#ffebee', color: '#c62828', fontSize: '0.8rem', fontWeight: 'bold' }}>Rejected</span>;
      case "Review": return <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#e3f2fd', color: '#1565c0', fontSize: '0.8rem', fontWeight: 'bold' }}>Review</span>;
      default: return <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#fff3e0', color: '#e65100', fontSize: '0.8rem', fontWeight: 'bold' }}>Pending</span>;
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>{isAdmin ? "Global Suggestion Manager" : "My Suggestions"}</h1>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ color: '#666', margin: 0, maxWidth: '600px' }}>
            {isAdmin 
              ? "Review audience feedback from the live presentations. Accepted suggestions will automatically appear on the final slide of future presentations!"
              : "Submit your own suggestions and feedback. Once a suggestion is accepted by an administrator, it can no longer be edited."}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={fetchSuggestions}>Refresh</button>
            {!isAdmin && (
              <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={openAddModal}>
                <Plus size={18} /> Add Suggestion
              </button>
            )}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '1rem 0', width: '40%' }}>Suggestion</th>
                <th>Name</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>}
              {!loading && suggestions.length === 0 && <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>No suggestions found.</td></tr>}
              {!loading && suggestions.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem 0' }}>{s.suggestionText}</td>
                  <td>{s.guestName || "Anonymous"}</td>
                  <td>{s.guestDept || "General"}</td>
                  <td>{getStatusBadge(s.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {isAdmin ? (
                        <>
                          {s.status !== "Accepted" && <button className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#e8f5e9', color: '#2e7d32' }} onClick={() => updateStatus(s.id, "Accepted")}>Accept</button>}
                          {s.status !== "Rejected" && <button className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#ffebee', color: '#c62828' }} onClick={() => updateStatus(s.id, "Rejected")}>Reject</button>}
                          {s.status !== "Review" && s.status !== "Pending" && <button className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#e3f2fd', color: '#1565c0' }} onClick={() => updateStatus(s.id, "Pending")}>Undo</button>}
                          <button className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#fafafa', color: '#d32f2f', border: '1px solid #d32f2f' }} onClick={() => deleteSuggestion(s.id)}>Delete</button>
                        </>
                      ) : (
                        <>
                          {s.status !== "Accepted" && (
                            <button className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }} onClick={() => openEditModal(s)}>
                              <Edit2 size={14} /> Edit
                            </button>
                          )}
                          <button className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#fafafa', color: '#d32f2f', border: '1px solid #d32f2f' }} onClick={() => deleteSuggestion(s.id)}>Delete</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
            <button style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowModal(false)}>
              <X size={24} />
            </button>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>{editMode ? "Edit Suggestion" : "Add Suggestion"}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Name (Optional)</label>
                <input type="text" className="input" value={formData.guestName} onChange={e => setFormData({...formData, guestName: e.target.value})} placeholder="Your Name" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Department (Optional)</label>
                <input type="text" className="input" value={formData.guestDept} onChange={e => setFormData({...formData, guestDept: e.target.value})} placeholder="Your Department" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Suggestion *</label>
                <textarea className="input" style={{ minHeight: '120px', resize: 'vertical' }} required value={formData.suggestionText} onChange={e => setFormData({...formData, suggestionText: e.target.value})} placeholder="Write your suggestion or feedback here..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editMode ? "Save Changes" : "Submit Suggestion"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

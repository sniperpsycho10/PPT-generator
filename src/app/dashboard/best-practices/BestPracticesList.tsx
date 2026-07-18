"use client";

import React, { useState } from "react";
import { Search, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BestPracticesList({ initialData, currentUserId, isAdmin }: { initialData: any[], currentUserId: string, isAdmin: boolean }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [submissions, setSubmissions] = useState(initialData);
  const router = useRouter();

  const filtered = submissions.filter(sub => {
    const q = searchQuery.toLowerCase();
    return (
      (sub.title || "").toLowerCase().includes(q) ||
      (sub.problemAddressed || "").toLowerCase().includes(q) ||
      (sub.methodology || "").toLowerCase().includes(q) ||
      (sub.department?.name || "").toLowerCase().includes(q)
    );
  });

  const handleAdopt = async (id: string) => {
    try {
      const res = await fetch("/api/adoptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: id })
      });
      if (res.ok) {
        const data = await res.json();
        // Optimistically update UI
        setSubmissions(prev => prev.map(sub => {
          if (sub.id === id) {
            let newAdoptions = [...sub.adoptions];
            if (data.adopted) {
              newAdoptions.push({ userId: currentUserId });
            } else {
              newAdoptions = newAdoptions.filter(a => a.userId !== currentUserId);
            }
            return { ...sub, adoptions: newAdoptions };
          }
          return sub;
        }));
        router.refresh();
      } else {
        alert("Error updating adoption status.");
      }
    } catch (e) {
      alert("Network error.");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', position: 'relative' }}>
        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} size={20} />
        <input 
          type="text" 
          placeholder="Search by title, department, or keywords..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field glass"
          style={{ paddingLeft: '3rem', width: '100%', maxWidth: '600px', fontSize: '1.1rem' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {filtered.map(sub => {
          const isAdoptedByMe = sub.adoptions.some((a: any) => a.userId === currentUserId);
          
          return (
            <div key={sub.id} className="card glass hover-lift" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ color: 'var(--jspl-blue)', marginBottom: '0.5rem', fontSize: '1.3rem' }}>{sub.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                <strong>Department:</strong> {sub.department?.name || 'Unknown'}
              </p>
              
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}><strong>Problem:</strong> {sub.problemAddressed}</p>
                <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#555' }}>
                  {sub.methodology?.length > 100 ? sub.methodology.substring(0, 100) + "..." : sub.methodology}
                </p>
              </div>
              
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  onClick={() => handleAdopt(sub.id)}
                  className={`btn ${isAdoptedByMe ? 'btn-secondary' : 'btn-primary'}`} 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                >
                  {isAdoptedByMe ? <CheckCircle size={18} /> : null}
                  {isAdoptedByMe ? 'Adopted' : 'Adopt'}
                </button>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {sub.adoptions.length} {sub.adoptions.length === 1 ? 'Adoption' : 'Adoptions'}
                </span>
              </div>

              {isAdmin && sub.adoptions.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.8rem', backgroundColor: 'rgba(74,144,226,0.05)', borderRadius: '8px', border: '1px solid rgba(74,144,226,0.2)' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--jspl-blue)', marginBottom: '0.5rem' }}>Adopted By:</p>
                  <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.8rem', color: '#555' }}>
                    {sub.adoptions.map((a: any, idx: number) => (
                      <li key={idx}>
                        {a.user?.department?.name || 'Unknown Dept'} - Accepted by {a.user?.name || 'Unknown User'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <p>No best practices found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

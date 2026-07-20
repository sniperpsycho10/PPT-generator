"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, X, CheckCircle2 } from "lucide-react";

interface Props {
  userName: string;
  userDept: string;
  repetitiveProblems: { id: string; title: string }[];
}

export default function SubmitSuggestionClient({ userName, userDept, repetitiveProblems }: Props) {
  const router = useRouter();
  const [name, setName] = useState(userName);
  const [dept, setDept] = useState(userDept);
  const [suggestion, setSuggestion] = useState("");
  const [submissionId, setSubmissionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !dept || !suggestion.trim()) {
      setError("Please fill out all mandatory fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestName: name, guestDept: dept, suggestionText: suggestion, submissionId })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } else {
        setError("Failed to submit your suggestion. Please try again.");
      }
    } catch (err) {
      setError("A network error occurred. Please try again.");
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="animate-page-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div className="card glass" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <CheckCircle2 size={64} color="var(--success)" strokeWidth={1.5} />
          </div>
          <h1 style={{ fontSize: '2rem', color: 'var(--jspl-blue)', marginBottom: '1rem', fontWeight: 'bold' }}>Thank You!</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem' }}>
            Your suggestion has been successfully submitted and is now pending review by the administrators.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-page-in" style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 0' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--jspl-blue)', fontWeight: 'bold' }}>Submit Suggestion</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Share your ideas, process improvements, or safety insights directly with the management team.</p>
      </div>

      <div className="card glass" style={{ padding: '2.5rem' }}>
        {error && (
          <div style={{ backgroundColor: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: '500' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Related Problem (Optional)</label>
            <select 
              className="input-field" 
              style={{ padding: '0.8rem', backgroundColor: 'var(--input-bg)', borderRadius: '8px' }}
              value={submissionId} 
              onChange={e => setSubmissionId(e.target.value)}
            >
              <option value="">General Suggestion (No specific problem)</option>
              {repetitiveProblems.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Suggestion / Insight <span style={{ color: '#e74c3c' }}>*</span></label>
            <textarea 
              className="input-field" 
              style={{ padding: '1rem', fontSize: '1rem', minHeight: '150px', backgroundColor: 'var(--input-bg)', resize: 'vertical' }}
              placeholder="Describe your idea or suggestion in detail..." 
              value={suggestion} 
              onChange={e => setSuggestion(e.target.value)} 
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
            <button 
              type="button" 
              className="btn hover-lift" 
              style={{ padding: '0.75rem 1.5rem', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}
              onClick={() => router.push('/dashboard')}
              disabled={loading}
            >
              <X size={18} style={{ marginRight: '8px', display: 'inline' }} />
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary hover-lift" 
              style={{ padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease-in-out' }} 
              disabled={loading}
            >
              {loading ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Send size={18} />
                  Submit Suggestion
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

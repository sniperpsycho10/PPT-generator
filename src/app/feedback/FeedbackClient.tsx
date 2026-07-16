"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import "../auth/login/login.css";

interface Props {
  loggedInUser: { name: string; department: string | null } | null;
}

export default function FeedbackClient({ loggedInUser }: Props) {
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  
  const [name, setName] = useState(loggedInUser?.name || "");
  const [dept, setDept] = useState(loggedInUser?.department || "");
  const [suggestion, setSuggestion] = useState("");
  const [submitted, setSubmitted] = useState(isSuccess);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      setSubmitted(true);
    }
  }, [isSuccess]);

  const handleFormSubmit = () => {
    setLoading(true);
  };

  const hasFullProfile = !!(loggedInUser && loggedInUser.department);

  if (submitted) {
    return (
      <div className="login-container">
        <div className="login-left" style={{ display: 'none' }}></div>
        <div className="login-right" style={{ margin: '0 auto' }}>
          <div className="glass-card" style={{ padding: '4rem 2rem' }}>
            <div style={{ fontSize: '4rem', color: '#4ade80', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ color: 'white', marginBottom: '1rem' }}>Thank You!</h2>
            <p style={{ color: '#e2e8f0', marginBottom: '2rem' }}>Your suggestion has been successfully submitted and is pending review by the administrator.</p>
            <a href="/feedback" className="login-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>Submit Another</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      {/* Left branding (hidden on small screens usually handled by CSS) */}
      <div className="login-left">
        <h1>PWMS</h1>
        <h3>Live Workshop Feedback</h3>
        <p>Jindal Steel & Power</p>
      </div>

      <div className="login-right">
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'left' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Feedback</h2>
            {!loggedInUser ? (
              <button 
                type="button" 
                onClick={() => alert("Google Login is currently disabled on mobile. Please fill out your details manually below.")}
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Login with Google
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>{loggedInUser.name}</span>
                <button 
                  type="button" 
                  onClick={() => signOut({ callbackUrl: "/feedback" })}
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
          
          <form action="/api/suggestions" method="POST" onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            
            {hasFullProfile ? (
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}>
                <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>Linked Profile</p>
                <p style={{ fontWeight: 'bold', color: 'white', margin: 0 }}>{loggedInUser.name} — {loggedInUser.department}</p>
                <input type="hidden" name="guestName" value={loggedInUser.name} />
                <input type="hidden" name="guestDept" value={loggedInUser.department as string} />
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#f8fafc' }}>Your Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="guestName" style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }} placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#f8fafc' }}>Department <span style={{ color: '#ef4444' }}>*</span></label>
                  <select name="guestDept" style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }} value={dept} onChange={e => setDept(e.target.value)} required>
                    <option value="" disabled style={{ color: 'black' }}>Select your department</option>
                    <option value="Blast Furnace" style={{ color: 'black' }}>Blast Furnace</option>
                    <option value="Steel Melting Shop (SMS)" style={{ color: 'black' }}>Steel Melting Shop (SMS)</option>
                    <option value="Rolling Mills" style={{ color: 'black' }}>Rolling Mills</option>
                    <option value="Coke Oven" style={{ color: 'black' }}>Coke Oven</option>
                    <option value="Sinter Plant" style={{ color: 'black' }}>Sinter Plant</option>
                    <option value="Direct Reduced Iron (DRI)" style={{ color: 'black' }}>Direct Reduced Iron (DRI)</option>
                    <option value="Power Plant" style={{ color: 'black' }}>Power Plant</option>
                    <option value="Maintenance & Engineering" style={{ color: 'black' }}>Maintenance & Engineering</option>
                    <option value="Quality Control (QA/QC)" style={{ color: 'black' }}>Quality Control (QA/QC)</option>
                    <option value="Safety & Environment" style={{ color: 'black' }}>Safety & Environment</option>
                    <option value="Logistics & Supply Chain" style={{ color: 'black' }}>Logistics & Supply Chain</option>
                    <option value="Human Resources (HR)" style={{ color: 'black' }}>Human Resources (HR)</option>
                    <option value="IT & Automation" style={{ color: 'black' }}>IT & Automation</option>
                    <option value="Other" style={{ color: 'black' }}>Other</option>
                  </select>
                </div>
              </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#f8fafc' }}>Suggestion / Insight <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea name="suggestionText" rows={4} style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', resize: 'vertical' }} placeholder="I suggest we implement..." value={suggestion} onChange={e => setSuggestion(e.target.value)} required />
            </div>
            
            <button type="submit" className="login-btn" style={{ marginTop: '0.5rem' }} disabled={loading}>
              {loading ? "Submitting..." : "Submit Suggestion"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

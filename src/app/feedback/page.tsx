"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import "./feedback.css";

export default function FeedbackPage() {
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [submitted, setSubmitted] = useState(isSuccess);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      setSubmitted(true);
    }
  }, [isSuccess]);

  const handleFormSubmit = () => {
    // Only used to show loading state visually; the browser natively handles the POST
    setLoading(true);
  };

  if (submitted) {
    return (
      <div className="feedback-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '2rem' }}>
        <div className="glass card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', color: 'var(--success)' }}>✅</div>
          <h1 style={{ color: 'var(--jspl-blue)', marginBottom: '1rem' }}>Thank You!</h1>
          <p>Your suggestion has been successfully submitted and is pending review by the administrator.</p>
          <a href="/feedback" className="btn btn-primary" style={{ marginTop: '2rem', display: 'inline-block', textDecoration: 'none' }}>Submit Another</a>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div className="glass card" style={{ maxWidth: '500px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--jspl-blue)', fontSize: '2rem' }}>Live Workshop Feedback</h1>
          <p style={{ color: '#666' }}>Share your ideas, suggestions, or insights from today's session.</p>
        </div>
        
        <form action="/api/suggestions" method="POST" onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#333' }}>Your Name <span style={{ color: 'red' }}>*</span></label>
            <input type="text" name="guestName" className="input-field" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#333' }}>Department <span style={{ color: 'red' }}>*</span></label>
            <select name="guestDept" className="input-field" value={dept} onChange={e => setDept(e.target.value)} required>
              <option value="" disabled>Select your department</option>
              <option value="Blast Furnace">Blast Furnace</option>
              <option value="Steel Melting Shop (SMS)">Steel Melting Shop (SMS)</option>
              <option value="Rolling Mills">Rolling Mills</option>
              <option value="Coke Oven">Coke Oven</option>
              <option value="Sinter Plant">Sinter Plant</option>
              <option value="Direct Reduced Iron (DRI)">Direct Reduced Iron (DRI)</option>
              <option value="Power Plant">Power Plant</option>
              <option value="Maintenance & Engineering">Maintenance & Engineering</option>
              <option value="Quality Control (QA/QC)">Quality Control (QA/QC)</option>
              <option value="Safety & Environment">Safety & Environment</option>
              <option value="Logistics & Supply Chain">Logistics & Supply Chain</option>
              <option value="Human Resources (HR)">Human Resources (HR)</option>
              <option value="IT & Automation">IT & Automation</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#333' }}>Suggestion / Insight <span style={{ color: 'red' }}>*</span></label>
            <textarea name="suggestionText" className="input-field" rows={5} placeholder="I suggest we implement..." value={suggestion} onChange={e => setSuggestion(e.target.value)} required />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
            {loading ? "Submitting..." : "Submit Suggestion"}
          </button>
        </form>
      </div>
    </div>
  );
}

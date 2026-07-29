"use client";

import { useState } from "react";
import { CalendarDays, Plus } from "lucide-react";

export default function RecurringSchedulerPage() {
  const [count, setCount] = useState(6);
  const [startMonth, setStartMonth] = useState(new Date().getMonth() + 1);
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/cycles/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, startMonth, startYear })
      });
      const json = await res.json();
      if (json.success) {
        setMessage(`Successfully generated ${json.count} cycles!`);
      } else {
        setMessage(json.error || "Failed to generate");
      }
    } catch (error) {
      console.error(error);
      setMessage("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Bulk Generate Cycles</h1>

      <div className="card" style={{ maxWidth: '600px' }}>
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Automatically create upcoming monthly workshop cycles with a single click.
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Starting Month</label>
          <select 
            value={startMonth} 
            onChange={(e) => setStartMonth(parseInt(e.target.value))}
            className="input-field"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Starting Year</label>
          <input 
            type="number" 
            value={startYear}
            onChange={(e) => setStartYear(parseInt(e.target.value))}
            className="input-field"
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Number of Months to Generate</label>
          <input 
            type="number" 
            min="1" max="24"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            className="input-field"
          />
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="btn btn-primary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          {loading ? "Generating..." : <><Plus size={18} /> Generate Cycles</>}
        </button>

        {message && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold' }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

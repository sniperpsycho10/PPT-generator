"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const DEPARTMENTS = [
  "Mechanical", "Electrical", "Instrumentation", "Operations",
  "Safety", "Quality", "IT", "HR", "Logistics", "Civil"
];

export default function ProfileForm({ defaultName }: { defaultName: string }) {
  const [name, setName] = useState(defaultName || "");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/users/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, department })
      });
      
      if (res.ok) {
        // Refresh the page to show Pending screen
        router.refresh();
      } else {
        alert("Failed to save profile.");
      }
    } catch (err) {
      alert("Network error.");
    }
    
    setLoading(false);
  };

  return (
    <div style={{ textAlign: "left", marginTop: "1rem" }}>
      <p style={{ color: "#666", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
        Before you can request access, you must lock in your permanent Name and Department. 
        <strong> You will not be able to change this later.</strong>
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", color: "var(--jspl-dark)" }}>Your Name</label>
          <input 
            type="text" 
            className="input-field" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid #ccc" }}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", color: "var(--jspl-dark)" }}>Your Department</label>
          <select 
            className="input-field" 
            value={department} 
            onChange={(e) => setDepartment(e.target.value)} 
            required
            style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid #ccc" }}
          >
            <option value="">Select Department...</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ padding: "1rem", marginTop: "1rem", fontWeight: "bold" }}
          disabled={loading}
        >
          {loading ? "Saving..." : "Lock Profile & Continue"}
        </button>
      </form>
    </div>
  );
}

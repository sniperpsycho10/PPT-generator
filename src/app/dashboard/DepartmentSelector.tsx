"use client";

import React, { useState } from 'react';

export default function DepartmentSelector({ userId, currentDeptId, currentDeptName, isAdmin, departments }: any) {
  const [loading, setLoading] = useState(false);

  if (!isAdmin) {
    return <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: '500' }}>{currentDeptName || 'No Dept'}</div>;
  }

  const handleChange = async (e: any) => {
    setLoading(true);
    const newDept = e.target.value;
    try {
      await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentId: newDept })
      });
      window.location.reload();
    } catch(err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: '2px' }}>
      <select 
        value={currentDeptId || ""} 
        onChange={handleChange} 
        disabled={loading}
        style={{ 
          fontSize: '0.75rem', 
          padding: '2px 4px', 
          borderRadius: '4px',
          border: '1px solid rgba(0,0,0,0.1)',
          backgroundColor: 'rgba(255,255,255,0.5)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          maxWidth: '120px',
          fontWeight: '600'
        }}
      >
        <option value="">Select Dept</option>
        {departments.map((d: any) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
    </div>
  );
}

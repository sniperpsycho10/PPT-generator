"use client";

import React, { useState, useEffect } from "react";
import { Shield, ShieldAlert, Mail, User, Clock, XCircle, CheckCircle, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/users")
      .then(res => res.json())
      .then(data => {
        if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
          setCurrentUserRole(data.currentUserRole);
        } else if (Array.isArray(data)) {
          setUsers(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch users", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUserRole = async (id: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change this user to ${newRole}?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || "Failed to update user.");
      }
    } catch(err) {
      console.error(err);
      alert("Error updating user.");
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("WARNING: Deleting this user will also permanently delete ALL their associated submissions and suggestions. Are you sure you want to proceed?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || "Failed to delete user.");
      }
    } catch(err) {
      console.error(err);
      alert("Error deleting user.");
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'Super Admin') return { bg: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', icon: <ShieldAlert size={14} /> };
    if (role === 'Admin') return { bg: 'rgba(52, 152, 219, 0.1)', color: '#3498db', icon: <Shield size={14} /> };
    if (role === 'Pending') return { bg: 'rgba(241, 196, 15, 0.1)', color: '#f39c12', icon: <Clock size={14} /> };
    if (role === 'Rejected') return { bg: 'rgba(149, 165, 166, 0.1)', color: '#7f8c8d', icon: <XCircle size={14} /> };
    return { bg: 'rgba(46, 204, 113, 0.1)', color: '#27ae60', icon: <User size={14} /> }; // User
  };

  return (
    <div className="animate-page-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--jspl-blue)', fontWeight: 'bold' }}>User Management</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Approve new users, manage roles, and review platform access.</p>
      </div>

      <div className="card glass">
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '1rem' }}>
          <Shield size={20} color="var(--jspl-blue)" /> Access Management
        </h2>
        
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading users...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No users found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--table-row-bg)', borderBottom: '2px solid var(--glass-border)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>User</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Role / Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Email Address</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const badge = getRoleBadge(user.role);
                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="hover-lift">
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {user.image ? (
                            <img src={user.image} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--jspl-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User size={18} />
                            </div>
                          )}
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{user.name || "Unknown User"}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '20px', 
                          fontSize: '0.85rem', 
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          backgroundColor: badge.bg,
                          color: badge.color
                        }}>
                          {badge.icon}
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                          <Mail size={16} />
                          {user.email}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {user.role === 'Pending' && (
                            <>
                              <button onClick={() => updateUserRole(user.id, 'User')} className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#e8f5e9', color: '#2e7d32' }}>
                                <CheckCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> Approve
                              </button>
                              <button onClick={() => updateUserRole(user.id, 'Rejected')} className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#ffebee', color: '#c62828' }}>
                                <XCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> Reject
                              </button>
                            </>
                          )}
                          {user.role !== 'Pending' && user.role !== 'Super Admin' && currentUserRole === 'Super Admin' && (
                            <button onClick={() => updateUserRole(user.id, user.role === 'User' ? 'Admin' : 'User')} className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#f0f4f8', color: '#333' }}>
                              {user.role === 'User' ? 'Make Admin' : 'Make User'}
                            </button>
                          )}
                          
                          {user.role !== 'Super Admin' && (currentUserRole === 'Super Admin' || (currentUserRole === 'Admin' && user.role !== 'Admin')) && (
                            <button onClick={() => deleteUser(user.id)} className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', backgroundColor: 'transparent', color: '#d32f2f', border: '1px solid #d32f2f' }}>
                              <Trash2 size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

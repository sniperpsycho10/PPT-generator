"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Users, Edit2, Trash2, Plus, Search, X } from "lucide-react";

interface TeamMember {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image?: string | null;
}

interface Team {
  id: string;
  name: string;
  createdAt: string;
  members: TeamMember[];
}

export default function TeamsClient({ initialTeams }: { initialTeams: Team[] }) {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (e) {
      console.error("Failed to fetch users");
    }
  };

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teams");
      const data = await res.json();
      if (data.success) {
        setTeams(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch teams");
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = useMemo(() => {
    if (!search) return teams;
    const lowerSearch = search.toLowerCase();
    return teams.filter(t => 
      t.name.toLowerCase().includes(lowerSearch) ||
      t.members.some(m => m.name?.toLowerCase().includes(lowerSearch) || m.email?.toLowerCase().includes(lowerSearch))
    );
  }, [teams, search]);

  const filteredUsers = useMemo(() => {
    if (!userSearchQuery) return users;
    return users.filter(u => 
      (u.name || "").toLowerCase().includes(userSearchQuery.toLowerCase()) || 
      (u.email || "").toLowerCase().includes(userSearchQuery.toLowerCase())
    );
  }, [users, userSearchQuery]);

  const handleOpenCreateModal = () => {
    setEditingTeam(null);
    setTeamName("");
    setSelectedUsers([]);
    setUserSearchQuery("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (team: Team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setSelectedUsers(team.members.map(m => m.id));
    setUserSearchQuery("");
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the team "${name}"?`)) return;
    
    try {
      const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTeams();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete team");
      }
    } catch (e) {
      alert("Server error deleting team");
    }
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return alert("Team name is required");
    
    setSubmitting(true);
    try {
      const url = editingTeam ? `/api/teams/${editingTeam.id}` : "/api/teams";
      const method = editingTeam ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName, memberIds: selectedUsers })
      });
      
      if (res.ok) {
        setModalOpen(false);
        fetchTeams();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save team");
      }
    } catch (e) {
      alert("Server error saving team");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text"
            placeholder="Search teams or members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.2rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>
        <button 
          onClick={handleOpenCreateModal}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#0f6250', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
        >
          <Plus size={18} />
          Create Team
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {filteredTeams.map(team => (
          <div key={team.id} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} color="#0f6250" />
                {team.name}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => handleOpenEditModal(team)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                  title="Edit Team"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(team.id, team.name)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                  title="Delete Team"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Created: {new Date(team.createdAt).toLocaleDateString()}
            </div>

            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#334155' }}>Members ({team.members.length})</h4>
              {team.members.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {team.members.map(member => (
                    <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', padding: '0.4rem', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
                      <span style={{ fontWeight: 500, color: '#1e293b' }}>{member.name || 'Unknown'}</span>
                      <span style={{ color: '#64748b' }}>{member.email}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>No members assigned.</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTeams.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          No teams found. Try creating one!
        </div>
      )}

      {/* Team Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '100%', maxWidth: '600px', padding: '2rem', position: 'relative', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <button style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} onClick={() => setModalOpen(false)}>
              <X size={24} />
            </button>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#1e293b' }}>
              {editingTeam ? 'Edit Team' : 'Create Team'}
            </h2>
            
            <form onSubmit={handleSaveTeam} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, overflow: 'hidden' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>Team Name</label>
                <input 
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Maintenance Alpha"
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>
                  Select Members ({selectedUsers.length} selected)
                </label>
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  value={userSearchQuery} 
                  onChange={e => setUserSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '0.75rem' }}
                />
                
                <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.5rem' }}>
                  {filteredUsers.length > 0 ? filteredUsers.map(u => {
                    const isSelected = selectedUsers.includes(u.id);
                    return (
                      <div 
                        key={u.id} 
                        onClick={() => toggleUserSelection(u.id)}
                        style={{ 
                          padding: '0.5rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.75rem', 
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={() => {}} 
                          style={{ cursor: 'pointer' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{u.name || 'Unnamed User'}</span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>No users found.</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#0f6250', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                  {submitting ? "Saving..." : (editingTeam ? "Save Changes" : "Create Team")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

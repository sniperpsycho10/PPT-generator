"use client";

import React, { useState } from "react";
import { Users, Edit, Trash2, Plus, X, Shield, User } from "lucide-react";
import { useRouter } from "next/navigation";

interface TeamMember {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image: string | null;
}

interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  createdAt: Date;
  updatedAt: Date;
}

interface Props {
  initialTeams: Team[];
  allUsers: TeamMember[];
  currentUserId: string;
  currentUserRole: string;
}

export default function TeamsClient({ initialTeams, allUsers, currentUserId, currentUserRole }: Props) {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Modal State
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  const openCreateModal = () => {
    setEditingTeamId(null);
    setTeamName("");
    setSelectedMembers(new Set()); // Empty set, admins can add themselves manually
    setIsModalOpen(true);
  };

  const openEditModal = (team: Team) => {
    setEditingTeamId(team.id);
    setTeamName(team.name);
    setSelectedMembers(new Set(team.members.map(m => m.id)));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTeamName("");
    setSelectedMembers(new Set());
    setEditingTeamId(null);
  };

  const toggleMember = (userId: string) => {
    const newSet = new Set(selectedMembers);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedMembers(newSet);
  };

  const saveTeam = async () => {
    if (!teamName.trim()) {
      alert("Team name is required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: teamName.trim(),
        memberIds: Array.from(selectedMembers)
      };

      let res;
      if (editingTeamId) {
        res = await fetch(`/api/teams/${editingTeamId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (data.success) {
        if (editingTeamId) {
          setTeams(teams.map(t => t.id === editingTeamId ? data.data : t));
        } else {
          setTeams([data.data, ...teams]);
        }
        closeModal();
        router.refresh();
      } else {
        alert(data.error || "Failed to save team.");
      }
    } catch (err) {
      console.error(err);
      alert("A network error occurred.");
    }
    setLoading(false);
  };

  const deleteTeam = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this team?")) return;
    
    try {
      const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (data.success) {
        setTeams(teams.filter(t => t.id !== id));
        router.refresh();
      } else {
        alert(data.error || "Failed to delete team.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting team.");
    }
  };

  return (
    <div className="animate-page-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--jspl-blue)', fontWeight: 'bold' }}>Teams Management</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Create, edit, and manage teams of users.</p>
        </div>
        <button className="btn btn-primary hover-lift" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Create Team
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {teams.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }} className="card glass">
            No teams found. Click "Create Team" to add one.
          </div>
        ) : (
          teams.map(team => (
            <div key={team.id} className="card glass hover-lift" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--jspl-blue)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={20} /> {team.name}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => openEditModal(team)} className="btn" style={{ padding: '0.4rem', backgroundColor: 'var(--glass-bg)', color: 'var(--text-secondary)' }} title="Edit Team">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => deleteTeam(team.id)} className="btn" style={{ padding: '0.4rem', backgroundColor: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c' }} title="Delete Team">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: '600' }}>
                  Members ({team.members.length})
                </h4>
                {team.members.length === 0 ? (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No members in this team.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {team.members.map(member => (
                      <span key={member.id} style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem', 
                        padding: '0.3rem 0.6rem', backgroundColor: 'var(--glass-bg)', 
                        border: '1px solid var(--glass-border)', borderRadius: '20px', 
                        fontSize: '0.8rem', color: 'var(--text-primary)' 
                      }}>
                        {member.image ? (
                          <img src={member.image} alt="Avatar" style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
                        ) : (
                          <User size={14} color="var(--text-secondary)" />
                        )}
                        {member.name || "Unknown"}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card glass" style={{ width: '100%', maxWidth: '600px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
              <h2 style={{ fontSize: '1.5rem', color: 'var(--jspl-blue)', fontWeight: 'bold' }}>
                {editingTeamId ? "Edit Team" : "Create New Team"}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ maxHeight: '45vh', overflowY: 'auto', marginBottom: '1.5rem', border: '1px solid var(--glass-border)', borderRadius: '8px', backgroundColor: 'var(--glass-bg)' }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--glass-border)', backgroundColor: 'var(--table-row-bg)', position: 'sticky', top: 0, zIndex: 10, fontWeight: '600', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Select Team Members</span>
                <span>{selectedMembers.size} selected</span>
              </div>
              <div style={{ padding: '0.5rem' }}>
                {allUsers.map(user => {
                  const isSelected = selectedMembers.has(user.id);
                  const isCurrentUser = user.id === currentUserId;
                  return (
                    <div 
                      key={user.id}
                      onClick={() => toggleMember(user.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem',
                        borderRadius: '6px', cursor: 'pointer', transition: 'background-color 0.2s',
                        backgroundColor: isSelected ? 'rgba(52, 152, 219, 0.1)' : 'transparent',
                        border: isSelected ? '1px solid rgba(52, 152, 219, 0.3)' : '1px solid transparent',
                        marginBottom: '0.25rem'
                      }}
                      className="hover-lift"
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => {}} // Handled by div onClick
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                        {user.image ? (
                          <img src={user.image} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                        ) : (
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--jspl-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={16} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {user.name || "Unknown"}
                            {isCurrentUser && <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '10px' }}>You</span>}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {user.email} • {user.role}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>Team Name <span style={{ color: '#e74c3c' }}>*</span></label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g., Safety Inspection Squad"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                style={{ backgroundColor: 'var(--input-bg)', width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', marginTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
              <button className="btn" onClick={closeModal} style={{ backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveTeam} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {loading ? "Saving..." : (editingTeamId ? "Save Changes" : "Create Team")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

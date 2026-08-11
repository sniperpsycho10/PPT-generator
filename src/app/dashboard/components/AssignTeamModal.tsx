"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface AssignTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignExisting: (teamId: string) => Promise<void>;
  onCreateAndAssign: (teamName: string, userIds: string[]) => Promise<void>;
  currentTeamId?: string | null;
}

export default function AssignTeamModal({ isOpen, onClose, onAssignExisting, onCreateAndAssign, currentTeamId }: AssignTeamModalProps) {
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [selectedExistingTeamId, setSelectedExistingTeamId] = useState(currentTeamId || "");
  const [teamName, setTeamName] = useState("");
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/teams").then(r => r.json()).then(data => setTeams(data.data || []));
      fetch("/api/users").then(r => r.json()).then(data => setUsers(data.users || []));
      setSelectedExistingTeamId(currentTeamId || "");
    }
  }, [isOpen, currentTeamId]);

  if (!isOpen) return null;

  const handleAssignExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExistingTeamId) return alert("Please select a team");
    setIsSubmitting(true);
    try {
      await onAssignExisting(selectedExistingTeamId);
    } catch (err: any) {
      alert(err.message || "Failed to assign team");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) return alert("Select at least one user.");
    setIsSubmitting(true);
    try {
      await onCreateAndAssign(teamName, selectedUsers);
    } catch (err: any) {
      alert(err.message || "Failed to create and assign team");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTeamDetails = teams.find(t => t.id === selectedExistingTeamId);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '100%', maxWidth: '600px', padding: '2rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}>
          <X size={24} />
        </button>
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Assign Team</h2>
        
        <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#1e293b' }}>Select Existing Team</h3>
          <form onSubmit={handleAssignExisting} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <select 
                value={selectedExistingTeamId} 
                onChange={e => setSelectedExistingTeamId(e.target.value)}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">-- Select a team --</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button type="submit" disabled={isSubmitting} style={{ padding: '0.5rem 1rem', backgroundColor: '#0f6250', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                {isSubmitting ? "Assigning..." : "Assign"}
              </button>
            </div>
            
            {selectedTeamDetails && (
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Team Members:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {selectedTeamDetails.members && selectedTeamDetails.members.length > 0 ? (
                    selectedTeamDetails.members.map((m: any) => (
                      <div key={m.id} style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{m.name || 'Unnamed'}</span>
                        <span style={{ color: '#94a3b8' }}>{m.email}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No members in this team.</div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#1e293b' }}>Or Create Custom Team</h3>
          <form onSubmit={handleCreateNew} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Team Name *</label>
              <input type="text" required value={teamName} onChange={e => setTeamName(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Search Users</label>
              <input type="text" placeholder="Search by name or email..." value={teamSearchQuery} onChange={e => setTeamSearchQuery(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>

            <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
              {users.filter(u => 
                u.name?.toLowerCase().includes(teamSearchQuery.toLowerCase()) || 
                u.email?.toLowerCase().includes(teamSearchQuery.toLowerCase())
              ).map(u => (
                <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedUsers.includes(u.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedUsers([...selectedUsers, u.id]);
                      else setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                    }} 
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{u.name || 'Unnamed'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{u.email} - {u.department?.name || 'General'}</div>
                  </div>
                </label>
              ))}
              {users.length === 0 && <div style={{ textAlign: 'center', color: '#999', padding: '1rem' }}>No users found.</div>}
            </div>

            <div style={{ fontSize: '0.9rem', color: '#0f6250', fontWeight: 'bold' }}>
              {selectedUsers.length} user(s) selected
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" onClick={onClose} disabled={isSubmitting} style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '4px', background: 'none', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={isSubmitting} style={{ padding: '0.5rem 1rem', backgroundColor: '#0f6250', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                {isSubmitting ? "Creating..." : "Create & Assign Team"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

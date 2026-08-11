"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AssignTeamModal from "../components/AssignTeamModal";

export default function ActionButtons({ id, isAdmin, status, type, assignedTeamId }: { id: string, isAdmin: boolean, status: string, type?: string, assignedTeamId?: string | null }) {
  const router = useRouter();
  
  const [teamModalOpen, setTeamModalOpen] = useState(false);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this submission?")) {
      const res = await fetch(`/api/submissions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert("Deleted successfully");
        router.refresh();
      } else {
        alert("Failed to delete");
      }
    }
  };

  const handleEdit = () => {
    router.push(`/submit?edit=${id}`);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (confirm(`Are you sure you want to mark this as ${newStatus}?`)) {
      const res = await fetch(`/api/submissions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to update status");
      }
    }
  };
  
  const handleAssignExistingTeam = async (teamId: string) => {
    const res = await fetch(`/api/submissions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedTeamId: teamId })
    });
    if (res.ok) {
      setTeamModalOpen(false);
      router.refresh();
    } else {
      throw new Error("Failed to assign team");
    }
  };

  const handleCreateAndAssignTeam = async (teamName: string, memberIds: string[]) => {
    const resTeam = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: teamName, memberIds })
    });
    const teamData = await resTeam.json();
    if (!resTeam.ok) throw new Error(teamData.error || "Failed to create team");
    
    const resAssign = await fetch(`/api/submissions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedTeamId: teamData.data.id })
    });
    
    if (resAssign.ok) {
      setTeamModalOpen(false);
      router.refresh();
    } else {
      throw new Error("Failed to assign team");
    }
  };

  const isLocked = status === 'Accepted' || status === 'Rejected';

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => router.push(`/dashboard/submissions/${id}`)}
          style={{ 
            padding: '4px 8px', 
            backgroundColor: '#f3e8ff', 
            color: '#7e22ce', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          View
        </button>
        {(!isLocked || isAdmin) && (
          <button 
            onClick={handleEdit}
            style={{ 
              padding: '4px 8px', 
              backgroundColor: '#E3F2FD', 
              color: '#1976D2', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Edit
          </button>
        )}

        {isAdmin && status !== 'Accepted' && (
          <button 
            onClick={() => handleStatusUpdate('Accepted')}
            style={{ 
              padding: '4px 8px', 
              backgroundColor: '#e8f5e9', 
              color: '#2e7d32', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Accept
          </button>
        )}
        
        {isAdmin && status === 'Accepted' && !assignedTeamId && type === 'RepetitiveProblem' && (
          <button 
            onClick={() => setTeamModalOpen(true)}
            style={{ 
              padding: '4px 8px', 
              backgroundColor: '#e3f2fd', 
              color: '#1565c0', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Assign Team
          </button>
        )}

        {isAdmin && status !== 'Rejected' && (
          <button 
            onClick={() => handleStatusUpdate('Rejected')}
            style={{ 
              padding: '4px 8px', 
              backgroundColor: '#ffebee', 
              color: '#c62828', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Reject
          </button>
        )}

        {isAdmin && (
          <button 
            onClick={handleDelete}
            style={{ 
              padding: '4px 8px', 
              backgroundColor: 'transparent', 
              color: '#D32F2F', 
              border: '1px solid #D32F2F', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Delete
          </button>
        )}
      </div>

      <AssignTeamModal 
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        onAssignExisting={handleAssignExistingTeam}
        onCreateAndAssign={handleCreateAndAssignTeam}
        currentTeamId={assignedTeamId}
      />
    </>
  );
}

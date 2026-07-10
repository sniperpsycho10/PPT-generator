"use client";

import { useRouter } from "next/navigation";

export default function ActionButtons({ id, isAdmin, status }: { id: string, isAdmin: boolean, status: string }) {
  const router = useRouter();

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

  const isLocked = status === 'Accepted' || status === 'Rejected';

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
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
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, X } from "lucide-react";

interface Notification {
  id: string;
  guestName: string;
  suggestionText: string;
}

export default function LiveToaster({ isAdmin }: { isAdmin: boolean }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Add a 1-minute buffer (60000ms) to the initial check to account for client-server clock skew
  const lastCheckedTime = useRef<string>(new Date(Date.now() - 60000).toISOString());
  
  // Keep track of processed IDs so we don't show the same notification twice due to the time buffer
  const processedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAdmin) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/suggestions/recent?since=${encodeURIComponent(lastCheckedTime.current)}`);
        
        if (res.ok) {
          const newSuggestions = await res.json();
          if (newSuggestions && newSuggestions.length > 0) {
            // Filter out already processed notifications
            const unseenSuggestions = newSuggestions.filter((s: any) => !processedIds.current.has(s.id));
            
            if (unseenSuggestions.length > 0) {
              // Update the last checked time
              const latestTime = unseenSuggestions[unseenSuggestions.length - 1].createdAt;
              lastCheckedTime.current = latestTime;

              // Mark as processed
              unseenSuggestions.forEach((s: any) => processedIds.current.add(s.id));

              // Add new notifications to the queue
              const mapped: Notification[] = unseenSuggestions.map((s: any) => ({
                id: s.id,
                guestName: s.guestName || "Anonymous User",
                suggestionText: s.suggestionText
              }));

              setNotifications(prev => [...prev, ...mapped]);
            }
          }
        }
      } catch (err) {
        console.error("Live Toaster polling error:", err);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [isAdmin]);

  // Auto-dismiss notifications after 8 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(1));
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  if (!isAdmin) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      pointerEvents: 'none' // Let clicks pass through empty space
    }}>
      {notifications.map((note) => (
        <div key={note.id} className="glass slide-in-toast hover-lift" style={{
          pointerEvents: 'auto', // Re-enable clicks for the card
          width: '320px',
          padding: '16px',
          borderRadius: '12px',
          borderLeft: '4px solid var(--jspl-blue)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
          position: 'relative',
          animation: 'slide-in-right 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
        }}>
          <div style={{ backgroundColor: 'rgba(10, 61, 98, 0.1)', padding: '8px', borderRadius: '50%', color: 'var(--jspl-blue)' }}>
            <Bell size={20} />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--jspl-blue)', marginBottom: '4px' }}>
              New QR Suggestion
            </div>
            <div style={{ fontSize: '0.85rem', color: '#444', marginBottom: '4px' }}>
              From: <span style={{ fontWeight: '600' }}>{note.guestName}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              "{note.suggestionText}"
            </div>
          </div>
          <button 
            onClick={() => setNotifications(prev => prev.filter(n => n.id !== note.id))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

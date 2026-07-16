"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  message: string;
  link?: string;
  createdAt: string;
  isRead: boolean;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toasts, setToasts] = useState<Notification[]>([]);
  const router = useRouter();
  
  const knownIds = useRef<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        const incoming = data.notifications || [];
        
        setNotifications(incoming);

        // Check for completely new notifications to show toasts (only unread ones)
        if (knownIds.current.size > 0) {
          const newNotes = incoming.filter((n: Notification) => !n.isRead && !knownIds.current.has(n.id));
          if (newNotes.length > 0) {
            setToasts(prev => [...prev, ...newNotes]);
          }
        }
        
        incoming.forEach((n: Notification) => knownIds.current.add(n.id));
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-remove toasts
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts(prev => prev.slice(1));
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  const markAsRead = async (id?: string) => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { notificationId: id } : {})
      });
      if (id) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  const deleteNotification = async (id?: string) => {
    try {
      const url = id ? `/api/notifications?id=${id}` : `/api/notifications`;
      await fetch(url, { method: "DELETE" });
      
      if (id) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) {
      markAsRead(n.id);
    }
    setIsOpen(false);
    if (n.link) {
      router.push(n.link);
    }
  };
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: 'transparent', 
          border: 'none', 
          cursor: 'pointer', 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          color: 'var(--text)'
        }}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            backgroundColor: '#ef4444',
            color: 'white',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="glass" style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          width: '320px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          zIndex: 1000,
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid var(--border)'
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text)' }}>Notifications</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              {unreadCount > 0 && (
                <button 
                  onClick={() => markAsRead()}
                  style={{ background: 'none', border: 'none', color: 'var(--jspl-blue)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button 
                  onClick={() => deleteNotification()}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Delete all
                </button>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>
                No notifications
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => handleNotificationClick(n)}
                  style={{ 
                    padding: '12px 16px', 
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    backgroundColor: n.isRead ? 'transparent' : 'rgba(10, 61, 98, 0.05)',
                    opacity: n.isRead ? 0.7 : 1,
                    position: 'relative'
                  }}
                  className="hover-lift"
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = n.isRead ? 'transparent' : 'rgba(10, 61, 98, 0.05)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', paddingRight: '24px' }}>
                    <span style={{ fontWeight: n.isRead ? '500' : '700', fontSize: '0.9rem', color: 'var(--text)' }}>{n.title}</span>
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)', paddingRight: '24px' }}>
                    {n.message}
                  </p>
                  
                  {/* Delete Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n.id);
                    }}
                    style={{ 
                      position: 'absolute', 
                      right: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '4px',
                      opacity: 0.7
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Toasts overlay */}
      {toasts.length > 0 && (
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
          {toasts.map((toast) => (
            <div key={toast.id} className="glass slide-in-toast hover-lift" style={{
              pointerEvents: 'auto',
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
              <div style={{ flex: 1, paddingRight: '20px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: 'var(--text)' }}>{toast.title}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)', opacity: 0.8, lineHeight: 1.4 }}>
                  {toast.message}
                </p>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#888' }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

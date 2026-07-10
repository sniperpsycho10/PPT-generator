"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function SignOutButton({ className, style, showText = false }: { className?: string, style?: React.CSSProperties, showText?: boolean }) {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: '/auth/login' })} 
      className={className}
      style={{
        background: 'none',
        border: 'none',
        color: '#e74c3c',
        cursor: 'pointer',
        padding: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: '50%',
        transition: 'all 0.3s ease',
        ...style
      }}
      title="Sign Out"
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
        e.currentTarget.style.color = '#c0392b';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = '#e74c3c';
      }}
    >
      <LogOut size={18} />
      {showText && <span>Sign Out</span>}
    </button>
  );
}

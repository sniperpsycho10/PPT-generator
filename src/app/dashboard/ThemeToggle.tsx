"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/app/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <button 
      onClick={toggleTheme}
      style={{
        background: 'transparent',
        border: 'none',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        padding: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        transition: 'all 0.3s ease',
      }}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--glass-bg)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

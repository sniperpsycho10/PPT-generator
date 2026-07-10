"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, X } from "lucide-react";

export default function GlobalQRCode() {
  const [isOpen, setIsOpen] = useState(false);

  // Use a hardcoded origin or window.location.origin if available
  const suggestionUrl = typeof window !== 'undefined' ? `${window.location.origin}/feedback` : 'http://localhost:3000/feedback';

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'var(--jspl-blue)',
          color: 'white',
          border: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 990,
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        title="Show Global Suggestion QR Code"
      >
        <QrCode size={30} />
      </button>

      {/* Fullscreen Zoomed Modal */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'var(--bg-main)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          
          <button 
            onClick={() => setIsOpen(false)}
            style={{
              position: 'absolute',
              top: '2rem',
              right: '2rem',
              background: 'rgba(255,255,255,0.1)',
              border: '2px solid var(--glass-border)',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <X size={24} />
          </button>

          <div style={{
            background: 'white', // QR codes need white background to scan reliably
            padding: '4rem',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <QRCodeSVG 
              value={suggestionUrl} 
              size={400}
              level={"H"}
              includeMargin={false}
            />
          </div>
          
          <h2 style={{
            marginTop: '3rem',
            fontSize: '3rem',
            color: 'var(--text-primary)',
            fontWeight: 'bold',
            textShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            Scan to Submit a Suggestion
          </h2>
        </div>
      )}
    </>
  );
}

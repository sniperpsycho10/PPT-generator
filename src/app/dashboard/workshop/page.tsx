"use client";

import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X } from "lucide-react";
import "./workshop.css";

export default function WorkshopMode() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [origin, setOrigin] = useState<string>('');
  const [templateStyle, setTemplateStyle] = useState<string>('corporate');
  const [isSlideQrEnlarged, setIsSlideQrEnlarged] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/network-ip')
      .then(r => r.json())
      .then(res => {
        if (res.origin) setOrigin(res.origin);
        else setOrigin(window.location.origin);
      })
      .catch(() => setOrigin(window.location.origin));
    
    fetch('/api/submissions')
      .then(r => r.json())
      .then(res => {
        if (res.data) setSubmissions(res.data);
      })
      .catch(console.error);

    fetch('/api/suggestions')
      .then(r => r.json())
      .then(res => {
        if (res.data) setSuggestions(res.data.filter((s: any) => s.status === 'Accepted'));
      })
      .catch(console.error);
  }, []);

  // Generate the slides sequence: Cover -> Agenda -> [Submissions] -> Accepted Feedback -> QR Code
  const slides = [
    { type: "Cover" },
    { type: "Agenda" },
    ...submissions.flatMap((sub: any) => {
      if (sub.type === "RepetitiveProblem" && (sub.beforeImageUrl || sub.afterImageUrl || sub.attachmentUrl)) {
        return [sub, { ...sub, type: "RepetitiveProblemPhotos" }];
      }
      return [sub];
    }),
    { type: "FeedbackGallery" },
    { type: "QRCodeFeedback" }
  ];

  const currentSlide = slides[currentSlideIndex];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current) {
        containerRef.current.requestFullscreen().catch(err => console.error(err));
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) setCurrentSlideIndex(prev => prev + 1);
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) setCurrentSlideIndex(prev => prev - 1);
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/workshop/generate-ppt', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: templateStyle })
      });
      if (!response.ok) throw new Error('Failed to generate PPT');
      const data = await response.json();
      
      const byteCharacters = atob(data.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JSPL_Workshop_${new Date().toISOString().split('T')[0]}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Error generating PowerPoint.');
    }
  };

  const renderSlide = () => {
    if (!currentSlide) return null;

    const styles = {
      corporate: {
        bg: '#F0F4F8',
        text: '#333',
        heading: '#0A3D62',
        accent: '#7DB87F',
        cardBg: 'white',
        logoStyle: { position: 'absolute', top: '2rem', right: '3rem', width: '80px', height: '80px', borderRadius: '12px', zIndex: 10, objectFit: 'cover' } as any,
        headerBar: <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '20px', backgroundColor: '#0A3D62', zIndex: 10 }} />
      },
      modern: {
        bg: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
        text: '#444',
        heading: '#2c3e50',
        accent: '#F4805A',
        cardBg: 'rgba(255, 255, 255, 0.7)',
        logoStyle: { position: 'absolute', top: '2rem', left: '3rem', width: '80px', height: '80px', borderRadius: '12px', zIndex: 10, opacity: 0.9, objectFit: 'cover' } as any,
        headerBar: <div style={{ position: 'absolute', top: '15px', left: '5%', width: '90%', height: '4px', background: 'rgba(255,255,255,0.6)', borderRadius: '4px', zIndex: 10 }} />
      },
      dark: {
        bg: '#1A202C',
        text: '#E2E8F0',
        heading: '#F7FAFC',
        accent: '#E53E3E',
        cardBg: '#2D3748',
        logoStyle: { position: 'absolute', top: '2rem', right: '3rem', width: '80px', height: '80px', borderRadius: '12px', zIndex: 10, opacity: 0.8, objectFit: 'cover' } as any,
        headerBar: <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', backgroundColor: '#E53E3E', zIndex: 10 }} />
      },
      vibrant: {
        bg: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)',
        text: '#333',
        heading: '#D63230',
        accent: '#F39237',
        cardBg: 'rgba(255, 255, 255, 0.8)',
        logoStyle: { position: 'absolute', top: '2rem', right: '3rem', width: '80px', height: '80px', borderRadius: '12px', zIndex: 10, objectFit: 'cover' } as any,
        headerBar: <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '10px', background: 'linear-gradient(90deg, #FF9A9E 0%, #FECFEF 100%)', zIndex: 10 }} />
      },
      industrial: {
        bg: '#2C3E50',
        text: '#ECF0F1',
        heading: '#F39C12',
        accent: '#E74C3C',
        cardBg: '#34495E',
        logoStyle: { position: 'absolute', top: '2rem', left: '3rem', width: '80px', height: '80px', borderRadius: '12px', zIndex: 10, opacity: 0.8, objectFit: 'cover' } as any,
        headerBar: <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', backgroundColor: '#F39C12', zIndex: 10 }} />
      },
      nature: {
        bg: '#E9F7EF',
        text: '#145A32',
        heading: '#1E8449',
        accent: '#27AE60',
        cardBg: '#D4EFDF',
        logoStyle: { position: 'absolute', top: '2rem', right: '3rem', width: '80px', height: '80px', borderRadius: '12px', zIndex: 10, objectFit: 'cover' } as any,
        headerBar: <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '12px', backgroundColor: '#27AE60', zIndex: 10 }} />
      },
      highContrast: {
        bg: '#000000',
        text: '#FFFF00',
        heading: '#FFFFFF',
        accent: '#00FF00',
        cardBg: '#111111',
        logoStyle: { position: 'absolute', top: '2rem', right: '3rem', width: '80px', height: '80px', borderRadius: '12px', zIndex: 10, filter: 'contrast(200%)', objectFit: 'cover' } as any,
        headerBar: <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '15px', backgroundColor: '#FFFF00', zIndex: 10 }} />
      },
      oceanic: {
        bg: 'linear-gradient(to right, #0f2027, #203a43, #2c5364)',
        text: '#E0F7FA',
        heading: '#80DEEA',
        accent: '#4DD0E1',
        cardBg: 'rgba(255, 255, 255, 0.1)',
        logoStyle: { position: 'absolute', top: '2rem', left: '3rem', width: '80px', height: '80px', borderRadius: '12px', zIndex: 10, objectFit: 'cover' } as any,
        headerBar: <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', backgroundColor: '#80DEEA', zIndex: 10 }} />
      },
      sunset: {
        bg: 'linear-gradient(to right, #ff4e50, #f9d423)',
        text: '#4A2311',
        heading: '#FFFFFF',
        accent: '#FFD700',
        cardBg: 'rgba(255, 255, 255, 0.5)',
        logoStyle: { position: 'absolute', top: '2rem', right: '3rem', width: '80px', height: '80px', borderRadius: '12px', zIndex: 10, objectFit: 'cover' } as any,
        headerBar: <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', backgroundColor: '#FFFFFF', zIndex: 10 }} />
      },
      elegant: {
        bg: '#FDFBF7',
        text: '#4A4A4A',
        heading: '#B8860B',
        accent: '#DAA520',
        cardBg: '#FFF8DC',
        logoStyle: { position: 'absolute', top: '2rem', left: '3rem', width: '80px', height: '80px', borderRadius: '12px', zIndex: 10, objectFit: 'cover' } as any,
        headerBar: <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '12px', backgroundColor: '#B8860B', zIndex: 10 }} />
      }
    };
    
    const t = styles[templateStyle as keyof typeof styles] || styles.corporate;

    const renderWrapper = (children: React.ReactNode) => (
      <div style={{ position: 'relative', width: '100%', height: '100%', background: t.bg, padding: '4rem 3rem 2rem 3rem', color: t.text }}>
        {t.headerBar}
        <img src="/background.jpg" alt="JSPL Logo" style={t.logoStyle} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'url(/background.jpg)', backgroundSize: 'cover', opacity: templateStyle === 'dark' ? 0.05 : 0.15, zIndex: 0 }} />
        <div style={{ zIndex: 1, position: 'relative', width: '100%', height: '100%' }}>
          {children}
        </div>
        
        {/* Tiny QR Code on every slide */}
        <div 
          onClick={(e) => { e.stopPropagation(); setIsSlideQrEnlarged(true); }}
          style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', zIndex: 10, cursor: 'pointer', background: 'white', padding: '0.25rem', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Click to enlarge QR Code"
        >
          <QRCodeSVG value={origin ? `${origin}/feedback` : ""} size={40} includeMargin={false} />
        </div>

        {/* Enlarged QR Modal */}
        {isSlideQrEnlarged && (
          <div 
            onClick={(e) => { e.stopPropagation(); setIsSlideQrEnlarged(false); }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(8px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}
          >
            <button 
              onClick={(e) => { e.stopPropagation(); setIsSlideQrEnlarged(false); }}
              style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <X size={32} />
            </button>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px' }} onClick={(e) => e.stopPropagation()}>
              <QRCodeSVG value={origin ? `${origin}/feedback` : ""} size={400} includeMargin={false} />
            </div>
            <h2 style={{ color: 'white', marginTop: '2rem', fontSize: '2rem' }}>Scan to Suggest</h2>
          </div>
        )}
      </div>
    );

    if (currentSlide.type === "FeedbackGallery") {
      return renderWrapper(
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
            <div style={{ width: '8px', height: '32px', backgroundColor: t.accent }}></div>
            <h1 style={{ color: t.heading, fontSize: '2.5rem', margin: 0, paddingLeft: templateStyle === 'modern' ? '6rem' : '0' }}>Outstanding Suggestions</h1>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            {suggestions.length === 0 && <p style={{ fontSize: '1.2rem', color: t.text }}>No suggestions accepted yet.</p>}
            {suggestions.map(s => (
              <div key={s.id} style={{ flex: '1 1 calc(33% - 1.5rem)', backgroundColor: t.cardBg, borderRadius: '8px', borderLeft: `4px solid ${t.accent}`, padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '1rem', fontStyle: 'italic' }}>"{s.suggestionText}"</p>
                <div style={{ fontWeight: 'bold', color: t.heading }}>— {s.guestName || 'Anonymous'}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{s.guestDept || 'General'} Dept</div>
              </div>
            ))}
          </div>
        </>
      );
    }

    if (currentSlide.type === "QRCodeFeedback") {
      return renderWrapper(
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '4rem', marginBottom: '1rem', color: t.heading }}>We Want Your Feedback!</h1>
            <p style={{ fontSize: '1.5rem', opacity: 0.8 }}>Scan the QR Code to submit your suggestions live.</p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <QRCodeSVG value={origin ? `${origin}/feedback` : ""} size={300} includeMargin={false} />
          </div>
        </div>
      );
    }

    if (currentSlide.type === "Cover") {
      return renderWrapper(
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <div style={{ width: '5%', height: '100%', display: 'flex', flexDirection: 'column', position: 'absolute', left: 0, top: 0 }}>
            <div style={{ flex: 1, backgroundColor: '#2C3E50' }}></div>
            <div style={{ flex: 1, backgroundColor: '#F4805A', borderTopRightRadius: '100%' }}></div>
            <div style={{ flex: 1, backgroundColor: '#7DB87F' }}></div>
            <div style={{ flex: 1, backgroundColor: '#4A90E2', clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }}></div>
            <div style={{ flex: 1, backgroundColor: '#F4805A', borderTopRightRadius: '100%' }}></div>
          </div>
          
          <div style={{ marginLeft: '8%', padding: '2rem' }}>
            <div style={{ color: t.text, fontWeight: 'bold', letterSpacing: '2px', marginBottom: '1rem' }}>
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
            </div>
            <h1 style={{ color: t.heading, fontSize: '3.5rem', marginBottom: '1rem', lineHeight: 1.1 }}>MONTHLY MAINTENANCE<br/>WORKSHOP</h1>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'normal', opacity: 0.9 }}>Best Practice Sharing & Repetitive Problem Resolution</h2>
          </div>
        </div>
      );
    }

    if (currentSlide.type === "Agenda") {
      return renderWrapper(
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
            <div style={{ width: '8px', height: '32px', backgroundColor: t.accent }}></div>
            <h1 style={{ color: t.heading, fontSize: '2.5rem', margin: 0, paddingLeft: templateStyle === 'modern' ? '6rem' : '0' }}>Workshop Agenda</h1>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', height: '60%', backgroundColor: t.cardBg, border: `2px solid ${t.accent}`, borderRadius: '12px', padding: '3rem' }}>
            {[
              { icon: '★', color: '#7DB87F', text: 'BEST PRACTICES\nSHARING' },
              { icon: '▲', color: '#F4805A', text: 'REPETITIVE / CHRONIC\nPROBLEM\nDISCUSSION' },
              { icon: '📈', color: '#4A90E2', text: 'ACTION REVIEW &\nKPI TRENDS' },
              { icon: '🏢', color: '#7DB87F', text: 'HORIZONTAL\nDEPLOYMENT' }
            ].map((item, idx) => (
              <div key={idx} style={{ flex: 1, backgroundColor: templateStyle === 'dark' ? '#1A202C' : 'white', borderRadius: '8px', border: '1px solid #ccc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', color: item.color }}>{item.icon}</div>
                <div style={{ color: t.heading, fontWeight: 'bold', marginTop: '1rem', whiteSpace: 'pre-line' }}>{item.text}</div>
              </div>
            ))}
          </div>
        </>
      );
    }

    if (currentSlide.type === "RepetitiveProblemPhotos") {
      return renderWrapper(
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', paddingLeft: templateStyle === 'modern' ? '6rem' : '0' }}>
              Department: <span style={{ color: t.accent }}>{currentSlide.department?.name || 'Unknown'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div style={{ width: '6px', height: '24px', backgroundColor: t.accent }}></div>
              <h2 style={{ color: t.heading, fontSize: '1.5rem', margin: 0 }}>
                Photos: <span style={{ fontWeight: 'normal' }}>{currentSlide.title}</span>
              </h2>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '2rem', flex: 1, padding: '1rem', backgroundColor: t.cardBg, borderRadius: '8px', border: `1px solid ${t.accent}` }}>
            {currentSlide.beforeImageUrl && (
              <div style={{ flex: 1, backgroundColor: '#111', border: `2px solid ${t.accent}`, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, backgroundImage: `url('${currentSlide.beforeImageUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ height: '30px', backgroundColor: '#CCC', color: '#111', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>BEFORE</div>
              </div>
            )}
            {currentSlide.afterImageUrl && (
              <div style={{ flex: 1, backgroundColor: '#111', border: `2px solid ${t.accent}`, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, backgroundImage: `url('${currentSlide.afterImageUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ height: '30px', backgroundColor: t.accent, color: '#111', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>AFTER</div>
              </div>
            )}
            {currentSlide.attachmentUrl && (
              <div style={{ flex: 1, backgroundColor: '#111', border: `2px solid ${t.accent}`, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, backgroundImage: `url('${currentSlide.attachmentUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ height: '30px', backgroundColor: '#666', color: '#FFF', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>SUPPORTING</div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Dynamic Data Slides
    return renderWrapper(
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', paddingLeft: templateStyle === 'modern' ? '6rem' : '0' }}>
            Department: <span style={{ color: t.accent }}>{currentSlide.department?.name || 'Unknown'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <div style={{ width: '6px', height: '24px', backgroundColor: t.accent }}></div>
            <h2 style={{ color: t.heading, fontSize: '1.5rem', margin: 0 }}>
              {currentSlide.type === "BestPractice" ? "BEST PRACTICE:" : "Repetitive:"} <span style={{ fontWeight: 'normal' }}>{currentSlide.title}</span>
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0 }}>
          {/* LEFT COLUMN */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentSlide.type === "BestPractice" ? (
              <>
                <div style={{ backgroundColor: t.cardBg, border: `1px solid ${t.accent}`, padding: '0.5rem 1rem', borderRadius: '4px', flex: 1 }}>
                  <div style={{ color: t.accent, fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.2rem' }}>OBJECTIVE / PURPOSE</div>
                  <div style={{ fontSize: '0.9rem' }}>{currentSlide.objective || 'N/A'}</div>
                </div>
                <div style={{ backgroundColor: t.cardBg, border: `1px solid ${t.accent}`, padding: '0.5rem 1rem', borderRadius: '4px', flex: 1 }}>
                  <div style={{ color: t.accent, fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.2rem' }}>PROBLEM ADDRESSED</div>
                  <div style={{ fontSize: '0.9rem' }}>{currentSlide.problemAddressed || 'N/A'}</div>
                </div>
                <div style={{ backgroundColor: t.cardBg, border: `1px solid ${t.accent}`, padding: '0.5rem 1rem', borderRadius: '4px', flex: 1.5 }}>
                  <div style={{ color: t.accent, fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.2rem' }}>METHODOLOGY / INNOVATION</div>
                  <div style={{ fontSize: '0.9rem' }}>{currentSlide.methodology || 'N/A'}</div>
                </div>
                <div style={{ backgroundColor: t.cardBg, border: `1px solid ${t.accent}`, padding: '0.5rem 1rem', borderRadius: '4px', flex: 1 }}>
                  <div style={{ color: t.accent, fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.2rem' }}>IMPACT / SAVING</div>
                  <div style={{ fontSize: '0.9rem' }}>Cost Impact: Approx Rs. {currentSlide.impactSavings || 0} Lakhs.</div>
                </div>
              </>
            ) : (
              <>
                <div style={{ backgroundColor: t.cardBg, border: `1px solid ${t.accent}`, padding: '0.5rem 1rem', borderRadius: '4px', flex: 1 }}>
                  <div style={{ color: t.accent, fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.2rem' }}>EQUIPMENT DETAILS</div>
                  <div style={{ fontSize: '0.9rem' }}>{currentSlide.equipmentDetails || 'N/A'}</div>
                </div>
                <div style={{ backgroundColor: t.cardBg, border: `1px solid ${t.accent}`, padding: '0.5rem 1rem', borderRadius: '4px', flex: 2 }}>
                  <div style={{ color: t.accent, fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.2rem' }}>PROBLEM STATEMENT</div>
                  <div style={{ fontSize: '0.9rem' }}>{currentSlide.problemStatement || 'N/A'}</div>
                </div>
                <div style={{ backgroundColor: templateStyle === 'dark' ? '#111' : '#EAF4F4', border: `2px solid ${t.accent}`, padding: '0.5rem 1rem', borderRadius: '4px', flex: 2, overflowY: 'auto' }}>
                  <div style={{ color: t.accent, fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.5rem' }}>IMPACT CALCULATION</div>
                  <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: t.accent, color: 'white' }}>
                        <th style={{ padding: '4px', textAlign: 'left', border: `1px solid ${t.accent}` }}>Parameter</th>
                        <th style={{ padding: '4px', textAlign: 'left', border: `1px solid ${t.accent}` }}>Value</th>
                        <th style={{ padding: '4px', textAlign: 'left', border: `1px solid ${t.accent}` }}>Calculation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        try {
                          const table = JSON.parse(currentSlide.impactCalculation || "[]");
                          return table.map((r: any, i: number) => (
                            <tr key={i}>
                              <td style={{ padding: '4px', border: `1px solid ${t.accent}` }}>{r.parameter}</td>
                              <td style={{ padding: '4px', border: `1px solid ${t.accent}`, fontWeight: 'bold' }}>{r.value}</td>
                              <td style={{ padding: '4px', border: `1px solid ${t.accent}` }}>{r.calculation}</td>
                            </tr>
                          ));
                        } catch(e) { return null; }
                      })()}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentSlide.type === "BestPractice" ? (
              <>
                {currentSlide.calculationTable && (
                  <div style={{ flex: 1 }}>
                    <div style={{ color: t.heading, fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.2rem' }}>CALCULATION TABLE</div>
                    <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', backgroundColor: t.cardBg }}>
                      <thead>
                        <tr style={{ backgroundColor: '#6366F1', color: 'white' }}>
                          <th style={{ padding: '4px', border: '1px solid white' }}>Metric</th>
                          <th style={{ padding: '4px', border: '1px solid white' }}>Before</th>
                          <th style={{ padding: '4px', border: '1px solid white' }}>After</th>
                          <th style={{ padding: '4px', border: '1px solid white' }}>Gain</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          try {
                            const table = JSON.parse(currentSlide.calculationTable);
                            return table.map((r: any, i: number) => (
                              <tr key={i}>
                                <td style={{ padding: '4px', border: '1px solid white', textAlign: 'center' }}>{r.metric}</td>
                                <td style={{ padding: '4px', border: '1px solid white', textAlign: 'center' }}>{r.before}</td>
                                <td style={{ padding: '4px', border: '1px solid white', textAlign: 'center' }}>{r.after}</td>
                                <td style={{ padding: '4px', border: '1px solid white', textAlign: 'center' }}>{r.gain}</td>
                              </tr>
                            ));
                          } catch(e) { return null; }
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ color: t.accent, fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.5rem' }}>PHOTOS & EVIDENCE</div>
                  <div style={{ display: 'flex', gap: '1rem', height: '200px' }}>
                    <div style={{ flex: 1, backgroundColor: '#111', border: `2px solid ${t.accent}`, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ flex: 1, backgroundImage: currentSlide.beforeImageUrl ? `url('${currentSlide.beforeImageUrl}')` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                      <div style={{ height: '20px', backgroundColor: '#CCC', color: '#111', fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>BEFORE</div>
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#111', border: `2px solid ${t.accent}`, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ flex: 1, backgroundImage: currentSlide.afterImageUrl ? `url('${currentSlide.afterImageUrl}')` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                      <div style={{ height: '20px', backgroundColor: t.accent, color: '#111', fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>AFTER</div>
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#111', border: `2px solid ${t.accent}`, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ flex: 1, backgroundImage: currentSlide.attachmentUrl ? `url('${currentSlide.attachmentUrl}')` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                      <div style={{ height: '20px', backgroundColor: '#666', color: '#FFF', fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>SUPPORTING</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ backgroundColor: t.cardBg, border: `1px solid ${t.accent}`, padding: '0.5rem 1rem', borderRadius: '4px', flex: 1 }}>
                  <div style={{ color: t.accent, fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.5rem' }}>WHY-WHY ANALYSIS</div>
                  {(() => {
                    try {
                      const whys = JSON.parse(currentSlide.whyWhyAnalysis || "[]");
                      return whys.map((why: string, i: number) => why ? <div key={i} style={{ fontSize: '0.8rem', marginBottom: '4px' }}>{why}</div> : null);
                    } catch(e) { return null; }
                  })()}
                </div>
                <div style={{ flex: 1, marginTop: '1rem' }}>
                  <div style={{ color: t.accent, fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.2rem' }}>ACTION TAKEN TABLE</div>
                  <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', backgroundColor: t.cardBg }}>
                    <thead>
                      <tr style={{ backgroundColor: '#4A90E2', color: 'white' }}>
                        <th style={{ padding: '4px', border: '1px solid #CCCCCC', textAlign: 'left' }}>Action Taken / Planned</th>
                        <th style={{ padding: '4px', border: '1px solid #CCCCCC', textAlign: 'left' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        try {
                          const table = JSON.parse(currentSlide.actionTakenTable || "[]");
                          return table.map((r: any, i: number) => (
                            <tr key={i}>
                              <td style={{ padding: '4px', border: '1px solid #CCCCCC' }}>{r.action}</td>
                              <td style={{ padding: '4px', border: '1px solid #CCCCCC' }}>{r.status}</td>
                            </tr>
                          ));
                        } catch(e) { return null; }
                      })()}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`workshop-container ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      <div className="workshop-header">
        <h2>Live Workshop Presentation</h2>
        <div className="flex gap-4 items-center">
          <select 
            className="input-field" 
            style={{ width: '200px', padding: '0.5rem', backgroundColor: 'white', color: '#333' }}
            value={templateStyle}
            onChange={(e) => setTemplateStyle(e.target.value)}
          >
            <option value="corporate">Corporate Standard</option>
            <option value="modern">Modern Translucent</option>
            <option value="dark">Dark Minimalist</option>
            <option value="vibrant">Vibrant Gradient</option>
            <option value="industrial">Industrial Steel</option>
            <option value="nature">Nature Eco</option>
            <option value="highContrast">High Contrast (A11y)</option>
            <option value="oceanic">Oceanic Blue</option>
            <option value="sunset">Sunset Orange</option>
            <option value="elegant">Elegant Gold</option>
          </select>
          <button className="btn" onClick={toggleFullscreen}>
            {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          </button>
          <button className="btn btn-primary" onClick={handleExport}>
            Export to PowerPoint
          </button>
        </div>
      </div>

      <div className="workshop-layout" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '1200px', aspectRatio: '16/9', backgroundColor: 'white', overflow: 'hidden', border: '1px solid #ccc', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {renderSlide()}
        </div>
        
        <div className="presentation-controls" style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn" onClick={prevSlide} disabled={currentSlideIndex === 0}>&larr; Previous</button>
          <span style={{ fontWeight: 'bold' }}>Slide {currentSlideIndex + 1} of {slides.length}</span>
          <button className="btn" onClick={nextSlide} disabled={currentSlideIndex === slides.length - 1}>Next &rarr;</button>
        </div>
      </div>
    </div>
  );
}

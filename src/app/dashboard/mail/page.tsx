"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mail, Loader2, Users, Send, AlertTriangle, Search, ChevronDown, Check, X } from "lucide-react";

function MultiSelectDropdown({ options, selected, onChange, placeholder }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((o: any) => {
    const searchString = `${o.label} ${o.department}`.toLowerCase();
    return searchString.includes(query.toLowerCase());
  });

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v: string) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeSelected = (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    onChange(selected.filter((v: string) => v !== value));
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <div 
        className="input-field"
        style={{ minHeight: '54px', padding: '0.5rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', cursor: 'pointer', alignItems: 'center' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length === 0 && <span style={{ color: '#94a3b8' }}>{placeholder}</span>}
        {selected.map((val: string) => {
          const opt = options.find((o: any) => o.value === val);
          return (
            <div key={val} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#e2e8f0', padding: '0.25rem 0.75rem', borderRadius: '16px', fontSize: '0.875rem', color: '#334155' }}>
              {opt ? opt.nameOnly : val}
              <X size={14} style={{ cursor: 'pointer' }} onClick={(e) => removeSelected(e, val)} />
            </div>
          );
        })}
        <div style={{ marginLeft: 'auto' }}>
          <ChevronDown size={18} color="#64748b" />
        </div>
      </div>

      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 9999, maxHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
            <input 
              type="text" 
              placeholder="Search by name, email, or department..." 
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc', borderRadius: '6px' }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem' }}>
            {filteredOptions.length === 0 && <div style={{ padding: '1rem', color: '#94a3b8', textAlign: 'center' }}>No users found</div>}
            {filteredOptions.map((o: any) => {
              const isSelected = selected.includes(o.value);
              return (
                <div 
                  key={o.value} 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', cursor: 'pointer', borderRadius: '8px', background: isSelected ? '#f1f5f9' : 'transparent', borderBottom: '1px solid #f1f5f9' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(o.value);
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#334155', fontWeight: isSelected ? '600' : '500' }}>{o.label}</span>
                    {o.department && <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{o.department}</span>}
                  </div>
                  {isSelected && <Check size={16} color="#4f46e5" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MailPage() {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [toUsers, setToUsers] = useState<string[]>([]);
  const [ccUsers, setCcUsers] = useState<string[]>([]);
  const [bccUsers, setBccUsers] = useState<string[]>([]);
  
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    fetch("/api/auth/session")
      .then(res => res.json())
      .then(data => {
        if (data?.user?.email) {
          setSessionEmail(data.user.email);
        }
      })
      .catch(console.error);

    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.users) {
          // Filter out users without emails
          setUsers(data.users.filter((u: any) => !!u.email));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Prepare options for multi-select (excluding current user)
  const userOptions = users
    .filter(u => u.email !== sessionEmail)
    .map(u => ({
      value: u.email,
      nameOnly: u.name || 'Unknown',
      label: `${u.name || 'Unknown'} - ${u.email}`,
      department: u.department?.name || ''
    }));

  // Combine all recipients to ensure the total number of emails per link never exceeds BATCH_SIZE
  const allRecipients = [
    ...toUsers.map(email => ({ type: 'to', email })),
    ...ccUsers.map(email => ({ type: 'cc', email })),
    ...bccUsers.map(email => ({ type: 'bcc', email }))
  ];

  const BATCH_SIZE = 50;
  const batches: any[] = [];
  
  for (let i = 0; i < allRecipients.length; i += BATCH_SIZE) {
    batches.push(allRecipients.slice(i, i + BATCH_SIZE));
  }

  const handleOpenClient = (batch: any[]) => {
    const to = batch.filter(r => r.type === 'to').map(r => r.email).join(",");
    const cc = batch.filter(r => r.type === 'cc').map(r => r.email).join(",");
    const bcc = batch.filter(r => r.type === 'bcc').map(r => r.email).join(",");
    
    let mailto = `mailto:${encodeURIComponent(to)}`;
    
    const params = [];
    if (cc) params.push(`cc=${encodeURIComponent(cc)}`);
    if (bcc) params.push(`bcc=${encodeURIComponent(bcc)}`);
    if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
    if (body) params.push(`body=${encodeURIComponent(body)}`);
    
    if (params.length > 0) {
      mailto += `?${params.join("&")}`;
    }
    
    const a = document.createElement("a");
    a.href = mailto;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const totalRecipients = toUsers.length + ccUsers.length + bccUsers.length;

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', padding: '1rem', borderRadius: '16px', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)' }}>
          <Mail size={32} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #1e293b, #334155)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            Mail Client
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', margin: 0 }}>
            Generate native email broadcasts safely via your default email client.
          </p>
        </div>
      </div>

      <div style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 12px 40px rgba(0,0,0,0.06)' }}>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              {/* Audience Selector (TO) */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', color: '#334155' }}>
                  Audience (To)
                </label>
                <MultiSelectDropdown 
                  options={userOptions}
                  selected={toUsers}
                  onChange={setToUsers}
                  placeholder="Select users for To field..."
                />
              </div>

              {/* CC Selector */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', color: '#334155' }}>
                  CC
                </label>
                <MultiSelectDropdown 
                  options={userOptions}
                  selected={ccUsers}
                  onChange={setCcUsers}
                  placeholder="Select users to CC..."
                />
              </div>

              {/* BCC Selector */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', color: '#334155' }}>
                  BCC
                </label>
                <MultiSelectDropdown 
                  options={userOptions}
                  selected={bccUsers}
                  onChange={setBccUsers}
                  placeholder="Select users to BCC..."
                />
              </div>
            </div>

            {/* Email Subject */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', color: '#334155' }}>
                Subject
              </label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g., Upcoming Workshop Deadline"
                style={{ width: '100%', height: '54px', fontSize: '1rem' }}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Email Body */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', color: '#334155' }}>
                Message Body
              </label>
              <textarea 
                className="input-field" 
                placeholder="Write your email content here..."
                style={{ width: '100%', minHeight: '200px', padding: '1rem', fontSize: '1rem', resize: 'vertical' }}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            {/* Action Area */}
            <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
              {totalRecipients === 0 ? (
                <div style={{ padding: '1rem', background: '#fef2f2', color: '#ef4444', borderRadius: '12px', textAlign: 'center', fontWeight: '500' }}>
                  Please select at least one recipient (Audience, CC, or BCC).
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', background: '#fffbeb', color: '#b45309', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #fde68a' }}>
                    <AlertTriangle size={18} />
                    <span>This will send to a total of <strong>{totalRecipients}</strong> recipients.</span>
                  </div>
                  
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#0f172a' }}>
                    Generate Email
                  </h3>
                  
                  {batches.length <= 1 ? (
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%', height: '54px', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', gap: '0.75rem' }}
                      onClick={() => handleOpenClient(batches[0] || [])}
                    >
                      <Send size={20} />
                      Open Email Client
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0, padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <strong style={{ color: '#0f172a' }}>Large Recipient List:</strong> Your browser cannot safely open a single email with {totalRecipients} addresses. The list has been split into {batches.length} batches. Click each button below to send separate emails.
                      </p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                        {batches.map((batch, idx) => (
                          <button 
                            key={idx}
                            className="btn btn-secondary" 
                            style={{ height: '54px', display: 'flex', justifyContent: 'center', gap: '0.5rem', background: 'white', border: '2px solid #e2e8f0', color: '#334155' }}
                            onClick={() => handleOpenClient(batch)}
                          >
                            <Mail size={18} />
                            Send Batch {idx + 1} ({batch.length})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mail, Loader2, Users, Send, AlertTriangle, Search, ChevronDown, Check, X, FileText, MessageSquare } from "lucide-react";

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
    const searchString = `${o.label} ${o.subLabel || ''}`.toLowerCase();
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
              placeholder="Search..." 
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc', borderRadius: '6px' }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem' }}>
            {filteredOptions.length === 0 && <div style={{ padding: '1rem', color: '#94a3b8', textAlign: 'center' }}>No results found</div>}
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
                    {o.subLabel && <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{o.subLabel}</span>}
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
  const [teams, setTeams] = useState<any[]>([]);
  const [problems, setProblems] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [toUsers, setToUsers] = useState<string[]>([]);
  const [ccUsers, setCcUsers] = useState<string[]>([]);
  const [bccUsers, setBccUsers] = useState<string[]>([]);
  
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  
  const [linkedProblem, setLinkedProblem] = useState<string>("");
  const [linkedSuggestion, setLinkedSuggestion] = useState<string>("");
  
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

    Promise.all([
      fetch("/api/users").then(res => res.json()),
      fetch("/api/teams").then(res => res.json()).catch(() => ({ data: [] })),
      fetch("/api/submissions").then(res => res.json()),
      fetch("/api/suggestions").then(res => res.json())
    ]).then(([usersData, teamsData, problemsData, suggestionsData]) => {
      if (usersData.users) setUsers(usersData.users.filter((u: any) => !!u.email));
      if (teamsData.data) setTeams(teamsData.data);
      if (problemsData.submissions) {
        setProblems(problemsData.submissions.filter((p: any) => p.type === 'RepetitiveProblem'));
      }
      if (suggestionsData.suggestions) setSuggestions(suggestionsData.suggestions);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const userOptions = users
    .filter(u => u.email !== sessionEmail)
    .map(u => ({
      value: u.email,
      nameOnly: u.name || 'Unknown',
      label: `${u.name || 'Unknown'} - ${u.email}`,
      subLabel: u.department?.name || ''
    }));

  const teamOptions = teams.map(t => ({
    value: t.id,
    nameOnly: t.name,
    label: t.name,
    subLabel: `${t.members?.length || 0} members`
  }));

  const problemOptions = problems.map(p => ({
    value: p.id,
    nameOnly: p.trackingId || `P-${p.id.substring(0,6)}`,
    label: p.trackingId || `P-${p.id.substring(0,6)}`,
    subLabel: p.equipmentDetails ? `${p.equipmentDetails} - ${p.problemStatement || p.title}` : p.title
  }));
  
  const suggestionOptions = suggestions.map(s => ({
    value: s.id,
    nameOnly: `S-${s.id.substring(0,6).toUpperCase()}`,
    label: `S-${s.id.substring(0,6).toUpperCase()}`,
    subLabel: s.suggestionText
  }));

  const injectLink = (type: 'problem' | 'suggestion', id: string) => {
    if (!id) return;
    
    let linkText = "";
    if (type === 'problem') {
      const p = problems.find(prob => prob.id === id);
      if (p) {
        const fullUrl = `${window.location.origin}/dashboard/submissions/${p.id}`;
        linkText = `\\n\\n---\\nRelated Problem: [${p.trackingId || p.title}]\\nLink: ${fullUrl}\\n---`;
      }
    } else if (type === 'suggestion') {
      const s = suggestions.find(sug => sug.id === id);
      if (s) {
        const fullUrl = `${window.location.origin}/dashboard/submissions/${s.submissionId || ''}`;
        linkText = `\\n\\n---\\nRelated Suggestion: [S-${s.id.substring(0,6).toUpperCase()}]\\nLink: ${fullUrl}\\n---`;
      }
    }
    
    setBody(prev => prev + linkText);
  };

  const allRecipients = [
    ...toUsers.map(email => ({ type: 'to', email })),
    ...ccUsers.map(email => ({ type: 'cc', email })),
    ...bccUsers.map(email => ({ type: 'bcc', email }))
  ];

  selectedTeams.forEach(teamId => {
    const team = teams.find(t => t.id === teamId);
    if (team?.members) {
      team.members.forEach((m: any) => {
        if (m.email && m.email !== sessionEmail && !allRecipients.find(r => r.email === m.email)) {
          allRecipients.push({ type: 'to', email: m.email });
        }
      });
    }
  });

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

  const totalRecipients = allRecipients.length;

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
            Compose messages and dispatch them via your native email app
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: '#64748b' }}>
          <Loader2 size={32} className="spin" style={{ marginBottom: '1rem' }} />
          <p>Loading address book...</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', border: '1px solid #f1f5f9' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', alignItems: 'start' }}>
              <label style={{ paddingTop: '1rem', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={16} /> To Users
              </label>
              <MultiSelectDropdown options={userOptions} selected={toUsers} onChange={setToUsers} placeholder="Select recipients..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', alignItems: 'start' }}>
              <label style={{ paddingTop: '1rem', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={16} /> To Teams
              </label>
              <MultiSelectDropdown options={teamOptions} selected={selectedTeams} onChange={setSelectedTeams} placeholder="Select teams..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', alignItems: 'start' }}>
              <label style={{ paddingTop: '1rem', fontWeight: '600', color: '#475569' }}>Cc</label>
              <MultiSelectDropdown options={userOptions} selected={ccUsers} onChange={setCcUsers} placeholder="Add Cc..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', alignItems: 'start' }}>
              <label style={{ paddingTop: '1rem', fontWeight: '600', color: '#475569' }}>Bcc</label>
              <MultiSelectDropdown options={userOptions} selected={bccUsers} onChange={setBccUsers} placeholder="Add Bcc..." />
            </div>
            
            <div style={{ borderTop: '1px solid #e2e8f0', margin: '0.5rem 0' }}></div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={16} /> Link Problem
                </label>
                <select 
                  className="input-field" 
                  value={linkedProblem} 
                  onChange={(e) => {
                    setLinkedProblem(e.target.value);
                    if (e.target.value) injectLink('problem', e.target.value);
                  }}
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                >
                  <option value="">-- Select a Problem to Link --</option>
                  {problemOptions.map(p => <option key={p.value} value={p.value}>{p.label} - {p.subLabel.substring(0,30)}...</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={16} /> Link Suggestion
                </label>
                <select 
                  className="input-field" 
                  value={linkedSuggestion} 
                  onChange={(e) => {
                    setLinkedSuggestion(e.target.value);
                    if (e.target.value) injectLink('suggestion', e.target.value);
                  }}
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                >
                  <option value="">-- Select a Suggestion to Link --</option>
                  {suggestionOptions.map(s => <option key={s.value} value={s.value}>{s.label} - {s.subLabel.substring(0,30)}...</option>)}
                </select>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', margin: '0.5rem 0' }}></div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', alignItems: 'center' }}>
              <label style={{ fontWeight: '600', color: '#475569' }}>Subject</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Enter subject here..." 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{ fontSize: '1.1rem', fontWeight: '500', padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', alignItems: 'start' }}>
              <label style={{ paddingTop: '0.5rem', fontWeight: '600', color: '#475569' }}>Message</label>
              <textarea 
                className="input-field" 
                rows={12} 
                placeholder="Write your message here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                style={{ padding: '1rem', lineHeight: '1.6', background: '#f8fafc', border: '1px solid #e2e8f0' }}
              />
            </div>

          </div>

          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
              <strong>{totalRecipients}</strong> recipients selected 
              {batches.length > 1 && ` (will open ${batches.length} email drafts)`}
            </div>
            
            {batches.length > 1 ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {batches.map((batch, index) => (
                  <button 
                    key={index}
                    className="btn" 
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px rgba(79, 70, 229, 0.2)', border: 'none' }}
                    onClick={() => handleOpenClient(batch)}
                  >
                    <Send size={18} /> Open Draft {index + 1}
                  </button>
                ))}
              </div>
            ) : (
              <button 
                className="btn" 
                style={{ background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', color: 'white', padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px rgba(79, 70, 229, 0.2)', border: 'none', opacity: totalRecipients === 0 ? 0.5 : 1, cursor: totalRecipients === 0 ? 'not-allowed' : 'pointer' }}
                onClick={() => totalRecipients > 0 && handleOpenClient(batches[0] || [])}
                disabled={totalRecipients === 0}
              >
                <Send size={18} /> Open in Mail App
              </button>
            )}
          </div>

          {batches.length > 1 && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <AlertTriangle size={24} color="#d97706" style={{ flexShrink: 0 }} />
              <p style={{ margin: 0, color: '#92400e', fontSize: '0.9rem', lineHeight: '1.5' }}>
                <strong>Large Distribution List Detected:</strong> You have selected {totalRecipients} recipients. To ensure reliable opening in your native mail client, the recipients have been split into {batches.length} separate email drafts. Please click each "Open Draft" button above to send them all.
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

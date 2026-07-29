"use client";

import { useEffect, useState } from "react";
import { FolderOpen, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Attachment {
  type: string;
  url: string;
  source: string;
  id: string;
}

export default function AttachmentsPage() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttachments();
  }, []);

  const fetchAttachments = async () => {
    try {
      const res = await fetch("/api/attachments");
      const json = await res.json();
      if (json.success) {
        setAttachments(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch attachments", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading attachments...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <FolderOpen size={24} color="var(--jspl-blue)" /> Attachments Management
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Manage files, images, and documents uploaded to the platform</p>
      </div>

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {attachments.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No attachments found.
            </div>
          ) : (
            attachments.map((att, idx) => (
              <div key={idx} style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ aspectRatio: '16/9', width: '100%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {att.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                    <img src={att.url} alt="Attachment" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ color: 'var(--jspl-blue)', fontWeight: 'bold' }}>Document / PDF</div>
                  )}
                </div>
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{att.type}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={att.source}>
                    {att.source}
                  </div>
                  
                  <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <a 
                      href={att.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="btn btn-primary"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', padding: '0.5rem', fontSize: '0.8rem' }}
                    >
                      <ExternalLink size={14} /> View
                    </a>
                    <Link 
                      href={`/dashboard/submissions/${att.id}`}
                      className="btn"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', fontSize: '0.8rem' }}
                    >
                      Source
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

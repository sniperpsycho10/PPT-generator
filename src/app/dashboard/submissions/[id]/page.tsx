import React from "react";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import CommentSection from "../../components/CommentSection";
import VersionHistory from "../../components/VersionHistory";
import { ArrowLeft, CheckCircle2, Clock, FileText } from "lucide-react";

export const dynamic = 'force-dynamic';

function RenderTable({ title, dataJson }: { title: string, dataJson: any }) {
  if (!dataJson) return null;
  let parsed: any = null;
  try {
    parsed = typeof dataJson === 'string' ? JSON.parse(dataJson) : dataJson;
    if (typeof parsed === 'string') parsed = JSON.parse(parsed); // Double encoded check
  } catch(e) {
    return null;
  }
  
  if (!parsed || (Array.isArray(parsed) && parsed.length === 0)) return null;

  const isLegacy = !Array.isArray(parsed[0]);
  let headers = [];
  let rows = [];

  if (isLegacy) {
    if (title.toLowerCase().includes("action")) {
       headers = ["Action Taken", "Target", "Status"];
       rows = parsed.map((r: any) => [r.action || '', r.target || '', r.status || '']);
    } else {
       headers = ["Metric/Parameter", "Before/Value", "After/Calculation", "Gain"];
       rows = parsed.map((r: any) => [r.metric || r.parameter || '', r.before || r.value || '', r.after || r.calculation || r.calculate || '', r.gain || '']);
    }
  } else {
    headers = parsed[0];
    rows = parsed.slice(1);
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--jspl-blue)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>{title}</h3>
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '400px', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
        <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', backgroundColor: 'var(--table-row-bg)' }}>
          <thead style={{ backgroundColor: 'var(--header-bg)', position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              {headers.map((h: string, i: number) => (
                <th key={i} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 'bold', color: 'var(--jspl-dark)', borderBottom: '2px solid var(--glass-border)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any[], i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                {row.map((cell: string, j: number) => (
                  <td key={j} style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)' }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function SubmissionDetailsPage(props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === 'Admin' || userRole === 'SuperAdmin';
  const params = await props.params;

  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: { department: true, user: true }
  });

  if (!submission) {
    return <div className="card text-center" style={{ padding: '3rem' }}>Submission not found.</div>;
  }

  if (!isAdmin && submission.userId !== userId) {
    return <div className="card text-center" style={{ padding: '3rem', color: 'var(--danger)' }}>Unauthorized</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <Link href="/dashboard/submissions" className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Back to Submissions
        </Link>
        <span className="badge badge-pending" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', backgroundColor: submission.status === 'Accepted' ? 'var(--success)' : 'var(--jspl-blue)' }}>
          {submission.status}
        </span>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FileText size={28} color="var(--jspl-blue)" /> {submission.title}
        </h1>
        <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={16} /> {new Date(submission.createdAt).toLocaleDateString()}</span>
          <span><strong>Author:</strong> {submission.user?.name || "Unknown"}</span>
          <span><strong>Department:</strong> {submission.department?.name || "Unknown"}</span>
          <span style={{ backgroundColor: 'var(--glass-bg)', padding: '0.2rem 0.75rem', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>{submission.type}</span>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--jspl-blue)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Description</h3>
          <div style={{ backgroundColor: 'var(--input-bg)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
            {submission.description || "No description provided."}
          </div>
        </div>

        {submission.objective && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--jspl-blue)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Objective</h3>
            <div style={{ backgroundColor: 'var(--input-bg)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
              {submission.objective}
            </div>
          </div>
        )}

        {/* Dynamic Tables Rendering */}
        <RenderTable title="Calculation Table" dataJson={submission.calculationTable} />
        <RenderTable title="Impact Calculation" dataJson={submission.impactCalculation} />
        <RenderTable title="Why-Why Analysis" dataJson={submission.whyWhyAnalysis} />
        <RenderTable title="Action Taken Table" dataJson={submission.actionTakenTable} />
        <RenderTable title="Custom Table" dataJson={submission.customTable} />

        {(submission.beforeImageUrl || submission.afterImageUrl || submission.attachmentUrl) && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--jspl-blue)', marginBottom: '1rem', textTransform: 'uppercase' }}>Attachments & Evidence</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {submission.beforeImageUrl && (
                <div style={{ borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden', backgroundColor: 'var(--input-bg)', position: 'relative' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: 'rgba(0,0,0,0.05)', textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>BEFORE</div>
                  <div style={{ aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <img src={submission.beforeImageUrl} alt="Before" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                </div>
              )}
              {submission.afterImageUrl && (
                <div style={{ borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden', backgroundColor: 'var(--input-bg)', position: 'relative' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: 'rgba(39, 174, 96, 0.1)', color: 'var(--success)', textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>AFTER</div>
                  <div style={{ aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <img src={submission.afterImageUrl} alt="After" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                </div>
              )}
              {submission.attachmentUrl && (
                <div style={{ borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden', backgroundColor: 'var(--input-bg)', position: 'relative' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: 'rgba(74, 144, 226, 0.1)', color: 'var(--jspl-blue)', textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>SUPPORTING DOCUMENT</div>
                  <div style={{ aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <a href={submission.attachmentUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                      {submission.attachmentUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) || submission.attachmentUrl.startsWith('/api/files/') ? (
                         <img src={submission.attachmentUrl} alt="Attachment" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      ) : (
                         <span className="btn btn-primary" style={{ fontSize: '0.85rem' }}>Download / View File</span>
                      )}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <VersionHistory submissionId={submission.id} />
        <CommentSection submissionId={submission.id} />
      </div>
    </div>
  );
}

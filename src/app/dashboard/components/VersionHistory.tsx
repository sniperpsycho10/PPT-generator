"use client";

import { useState, useEffect } from "react";
import { Clock, User as UserIcon } from "lucide-react";

interface Version {
  id: string;
  versionNum: number;
  createdAt: string;
  dataSnapshot: any;
  updatedBy: {
    name: string | null;
    email: string | null;
  } | null;
}

export default function VersionHistory({ submissionId }: { submissionId: string }) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchVersions();
  }, [submissionId]);

  const fetchVersions = async () => {
    try {
      const res = await fetch(`/api/versions?submissionId=${submissionId}`);
      const json = await res.json();
      if (json.success) {
        setVersions(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch versions", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-500 animate-pulse">Loading history...</div>;
  if (versions.length === 0) return null;

  return (
    <div className="mt-8 space-y-4 border-t border-white/10 pt-6">
      <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
        <Clock className="w-5 h-5 text-indigo-400" />
        Edit History
      </h3>
      
      <div className="space-y-3">
        {versions.map((version) => (
          <div key={version.id} className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
            <div 
              className="p-3 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setExpandedId(expandedId === version.id ? null : version.id)}
            >
              <div className="flex items-center gap-3">
                <div className="bg-indigo-500/20 text-indigo-300 font-mono text-xs px-2 py-1 rounded">
                  v{version.versionNum}
                </div>
                <span className="text-sm text-white/80">
                  Edited by {version.updatedBy?.name || version.updatedBy?.email || "Unknown User"}
                </span>
              </div>
              <span className="text-xs text-white/40">{new Date(version.createdAt).toLocaleString()}</span>
            </div>
            
            {expandedId === version.id && (
              <div className="p-3 border-t border-white/10 bg-black/20 text-xs font-mono text-white/60 overflow-x-auto">
                <pre>{JSON.stringify(version.dataSnapshot, null, 2)}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

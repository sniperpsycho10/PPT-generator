"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Presentation, 
  MessageSquare, 
  CheckSquare, 
  Settings,
  GitPullRequestDraft,
  MessageSquarePlus,
  Users
} from "lucide-react";

export default function SidebarNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const getClassName = (path: string) => {
    return `nav-item ${pathname === path ? "active" : ""}`;
  };

  return (
    <nav className="sidebar-nav">
      <Link href="/dashboard" className={getClassName("/dashboard")}>
        <LayoutDashboard size={18} />
        Overview
      </Link>
      <Link href="/dashboard/submissions" className={getClassName("/dashboard/submissions")}>
        <FileText size={18} />
        Submissions
      </Link>
      <Link href="/dashboard/submit-suggestion" className={getClassName("/dashboard/submit-suggestion")}>
        <MessageSquarePlus size={18} />
        Submit Suggestion
      </Link>
      <Link href="/dashboard/tracking" className={getClassName("/dashboard/tracking")}>
        <GitPullRequestDraft size={18} />
        Tracking
      </Link>
      {isAdmin && (
        <>
          <Link href="/dashboard/workshop" className={getClassName("/dashboard/workshop")}>
            <Presentation size={18} />
            Workshop Mode
          </Link>
          <Link href="/dashboard/suggestions" className={getClassName("/dashboard/suggestions")}>
            <MessageSquare size={18} />
            Suggestions
          </Link>

          <Link href="/dashboard/settings" className={getClassName("/dashboard/settings")}>
            <Settings size={18} />
            Settings
          </Link>
          <Link href="/dashboard/teams" className={getClassName("/dashboard/teams")}>
            <Users size={18} />
            Teams
          </Link>
        </>
      )}
    </nav>
  );
}

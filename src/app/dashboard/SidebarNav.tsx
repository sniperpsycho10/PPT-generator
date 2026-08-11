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
  Users,
  Calendar,
  RefreshCw,
  FileArchive,
  BarChart3,
  TrendingUp,
  Mail
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
      
      <Link href="/dashboard/best-practices" className={getClassName("/dashboard/best-practices")}>
        <CheckSquare size={18} />
        Best Practices Library
      </Link>
      
      <Link href="/dashboard/problem-library" className={getClassName("/dashboard/problem-library")}>
        <FileArchive size={18} />
        Problem Library
      </Link>
      
      <Link href="/dashboard/submit-suggestion" className={getClassName("/dashboard/submit-suggestion")}>
        <MessageSquarePlus size={18} />
        Submit Suggestion
      </Link>
      
      {isAdmin && (
        <Link href="/dashboard/suggestions" className={getClassName("/dashboard/suggestions")}>
          <MessageSquare size={18} />
          Suggestions
        </Link>
      )}

      {isAdmin && (
        <Link href="/dashboard/teams" className={getClassName("/dashboard/teams")}>
          <Users size={18} />
          Teams
        </Link>
      )}

      <Link href="/dashboard/tracking" className={getClassName("/dashboard/tracking")}>
        <GitPullRequestDraft size={18} />
        Problem Tracking
      </Link>

      <Link href="/dashboard/suggestion-tracking" className={getClassName("/dashboard/suggestion-tracking")}>
        <MessageSquare size={18} />
        Suggestion Tracking
      </Link>

      {isAdmin && (
        <>
          <Link href="/dashboard/cycles" className={getClassName("/dashboard/cycles")}>
            <Calendar size={18} />
            Cycles
          </Link>

          <Link href="/dashboard/workshop" className={getClassName("/dashboard/workshop")}>
            <Presentation size={18} />
            Workshop Mode
          </Link>
          <Link href="/dashboard/reports/history" className={getClassName("/dashboard/reports/history")}>
            <FileText size={18} />
            Generated PPTs
          </Link>

          <Link href="/dashboard/reports/adoptions" className={getClassName("/dashboard/reports/adoptions")}>
            <BarChart3 size={18} />
            Adoptions Report
          </Link>
          
          <Link href="/dashboard/mail" className={getClassName("/dashboard/mail")}>
            <Mail size={18} />
            Mail
          </Link>

          <Link href="/dashboard/settings" className={getClassName("/dashboard/settings")}>
            <Settings size={18} />
            Settings
          </Link>
        </>
      )}
    </nav>
  );
}

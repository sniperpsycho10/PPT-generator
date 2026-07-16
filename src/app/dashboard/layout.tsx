import React from "react";
import Link from "next/link";
import "./dashboard.css";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import SignOutButton from "./SignOutButton";
import LiveToaster from "./LiveToaster";
import SidebarNav from "./SidebarNav";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const dbUser = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  
  if (!dbUser || dbUser.role === "Pending" || dbUser.role === "Rejected") {
    redirect("/pending-approval");
  }

  const userRole = dbUser.role;
  const isAdmin = userRole === 'Admin' || userRole === 'Super Admin';

  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header" style={{ 
          position: 'relative', 
          overflow: 'hidden',
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          minHeight: '130px'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "url('/background.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.5,
            zIndex: 0
          }} />
          <div style={{ position: 'relative', zIndex: 1, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            <h2 style={{ marginBottom: '0.2rem', lineHeight: 1.2, color: 'white' }}>JSPL</h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'white', opacity: 0.9 }}>Workshop Platform</p>
          </div>
        </div>
        <SidebarNav isAdmin={isAdmin} />
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-title">Dashboard</div>
          <div className="header-profile" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NotificationBell />
            <ThemeToggle />
            <div className="profile-pill">
              {session?.user?.image ? (
                <img src={session.user.image} alt="Avatar" style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2px solid white' }} />
              ) : (
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--jspl-blue) 0%, var(--jspl-blue-light) 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', border: '2px solid white' }}>
                  {(session?.user?.name || 'A')[0]}
                </div>
              )}
              <div className="profile-info">
                <div className="profile-name">{session?.user?.name || 'User'}</div>
                <div className={`badge badge-${userRole.toLowerCase().replace(' ', '-')}`}>
                  {userRole}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(0,0,0,0.1)', height: '24px', margin: '0 4px' }}></div>
              <SignOutButton />
            </div>
          </div>
        </header>
        <div className="dashboard-content">
          {children}
        </div>
      </main>
      <LiveToaster isAdmin={isAdmin} />
    </div>
  );
}

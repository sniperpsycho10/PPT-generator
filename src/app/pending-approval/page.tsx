import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import SignOutButton from "../dashboard/SignOutButton";
import { Clock, XCircle } from "lucide-react";

export default async function PendingApprovalPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const dbUser = await prisma.user.findUnique({ where: { id: (session.user as any).id } });

  // If the user is already approved, redirect to dashboard
  if (dbUser && dbUser.role !== "Pending" && dbUser.role !== "Rejected") {
    redirect("/dashboard");
  }

  const isRejected = dbUser?.role === "Rejected";

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7f6', padding: '1rem' }}>
      <div className="card glass" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '3rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          {isRejected ? (
            <XCircle size={64} color="var(--danger)" style={{ margin: '0 auto' }} />
          ) : (
            <Clock size={64} color="var(--jspl-blue)" style={{ margin: '0 auto' }} />
          )}
        </div>
        <h1 style={{ fontSize: '2rem', color: '#333', marginBottom: '1rem' }}>
          {isRejected ? 'Access Rejected' : 'Pending Approval'}
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
          {isRejected 
            ? "Your request for access has been reviewed and rejected by an administrator. If you believe this is a mistake, you can request access again." 
            : "Your account has been created successfully, but it requires administrator approval before you can access the dashboard. Please check back later."}
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          {isRejected && (
            <form action="/api/users/request-access" method="POST" style={{ width: '100%' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
                Request Access Again
              </button>
            </form>
          )}
          <SignOutButton 
            className="btn"
            showText={true}
            style={{ 
              width: '100%', 
              padding: '1rem', 
              background: '#f8f9fa', 
              border: '1px solid #ddd', 
              color: '#333',
              fontSize: '1rem',
              textDecoration: 'none',
              marginTop: '0',
              borderRadius: 'var(--border-radius)'
            }} 
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import "./login.css";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [role, setRole] = useState<"User" | "Administrator">("User");

  return (
    <div className="login-container">
      <div className="login-left">
        <h1>PWMS</h1>
        <h3>Power Plant Workshop Management System</h3>
        <p>Jindal Steel & Power</p>
      </div>

      <div className="login-right">
        <div className="glass-card">
          <h2>Welcome</h2>
          
          <div className="role-toggles">
            <button 
              type="button" 
              className={`role-btn ${role === "User" ? "active" : "inactive"}`}
              onClick={() => setRole("User")}
            >
              User
            </button>
            <button 
              type="button" 
              className={`role-btn ${role === "Administrator" ? "active" : "inactive"}`}
              onClick={() => setRole("Administrator")}
            >
              Administrator
            </button>
          </div>

          <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
            <button 
              type="button" 
              className="login-btn"
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#FFFFFF" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                  <path fill="#FFFFFF" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                  <path fill="#FFFFFF" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                  <path fill="#FFFFFF" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                </g>
              </svg>
              Sign in with Google
            </button>
          </div>
          
          <div className="login-footer">
            Powered by Jindal Steel & Power<br />
            PWMS Version 1.0
          </div>
        </div>
      </div>
    </div>
  );
}

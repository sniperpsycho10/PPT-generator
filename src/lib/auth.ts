import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      },
      allowDangerousEmailAccountLinking: true,
      httpOptions: {
        timeout: 15000
      }
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  events: {
    async createUser(message) {
      if (!message.user.email) return;
      const email = message.user.email.toLowerCase();
      const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
      const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
      
      let initialRole = "Pending";
      if (email === superAdminEmail) initialRole = "SuperAdmin";
      else if (email === adminEmail) initialRole = "Admin";

      try {
        await prisma.user.update({
          where: { id: message.user.id },
          data: { role: initialRole }
        });
      } catch (e) {
        console.error("[NextAuth] Failed to forcefully set initial role in createUser event:", e);
      }
    }
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return true;
      const email = user.email.toLowerCase();
      const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
      const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
      
      let targetRole = null;
      if (email === superAdminEmail) targetRole = "SuperAdmin";
      else if (email === adminEmail) targetRole = "Admin";
      
      if (targetRole) {
        try {
          // Check if user exists before attempting update to prevent race conditions
          // where PrismaAdapter hasn't created the user yet on first login.
          const existingUser = await prisma.user.findUnique({ where: { email } });
          if (existingUser && existingUser.role !== targetRole) {
            await prisma.user.update({
              where: { email },
              data: { role: targetRole }
            });
          }
        } catch (e) {
          console.error(`[NextAuth] Failed to update role for ${email} in signIn callback:`, e);
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.departmentId = (user as any).departmentId;
        token.picture = user.image;
        
        let tokenRole = (user as any).role || "Pending";
        
        if (user.email) {
          const email = user.email.toLowerCase();
          const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
          const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
          
          if (email === superAdminEmail) tokenRole = "SuperAdmin";
          else if (email === adminEmail) tokenRole = "Admin";
        }
        
        token.role = tokenRole;
      }
      
      // Allow session updates (e.g. from client side when role is changed)
      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).departmentId = token.departmentId;
        session.user.image = token.picture as string | null | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  debug: process.env.NODE_ENV === 'development',
};

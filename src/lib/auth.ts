import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-client-secret",
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
  },
  events: {
    async createUser(message) {
      // Forcefully set role to Pending on creation to override any Prisma cache/defaults
      const email = message.user.email?.toLowerCase();
      const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
      const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
      
      let initialRole = "Pending";
      if (email === superAdminEmail) initialRole = "Super Admin";
      else if (email === adminEmail) initialRole = "Admin";

      try {
        await prisma.user.update({
          where: { id: message.user.id },
          data: { role: initialRole }
        });
      } catch (e) {
        console.error("Failed to forcefully set initial role", e);
      }
    }
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return true;
      const email = user.email.toLowerCase();
      const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
      const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
      
      let targetRole = "User";
      if (email === superAdminEmail) targetRole = "Super Admin";
      else if (email === adminEmail) targetRole = "Admin";
      
      if (targetRole !== "User") {
        try {
          await prisma.user.update({
            where: { email: user.email },
            data: { role: targetRole }
          });
        } catch (e) {
          console.error(`Failed to update role for ${user.email}`, e);
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "Pending";
        
        // Ensure roles are correct immediately on first login
        if (user.email) {
          const email = user.email.toLowerCase();
          const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
          const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
          
          if (email === superAdminEmail) token.role = "Super Admin";
          else if (email === adminEmail) token.role = "Admin";
        }
        
        token.departmentId = (user as any).departmentId;
        token.picture = user.image;
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
};

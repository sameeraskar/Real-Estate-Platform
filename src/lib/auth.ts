import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@demo.com" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        if (!email) return null;

        // Fetch user including tenantId in ONE query (during sign in only)
        const user = await prisma.user.findUnique({ 
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            tenantId: true,
          }
        });
        
        if (!user) return null;

        // Return user with all needed fields including tenantId
        return { 
          id: user.id, 
          email: user.email, 
          name: user.name ?? undefined,
          tenantId: user.tenantId,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign in (when user object exists from authorize())
      // Store user id and tenantId in the token
      if (user) {
        token.userId = user.id;
        token.tenantId = (user as any).tenantId;
      }
      
      // After initial sign in, token persists with userId and tenantId
      // No need to query the database on every request
      // This is a critical optimization for JWT strategy
      
      return token;
    },
    async session({ session, token }) {
      // Populate session with data from token
      if (session.user) {
        session.user.id = token.userId as string;
      }
      (session as any).tenantId = token.tenantId as string;
      
      return session;
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the currently authenticated user from the server session
 * Returns null if not authenticated or missing required fields
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }

  // Extract user id and tenantId
  const userId = session.user.id;
  const tenantId = (session as any).tenantId;
  
  // Ensure we have both user id and tenantId
  if (!userId || !tenantId) {
    console.error('Session missing userId or tenantId:', { userId, tenantId });
    return null;
  }

  return {
    id: userId,
    email: session.user.email ?? undefined,
    name: session.user.name ?? undefined,
    tenantId,
  };
}

/**
 * Require authentication or throw 401 Response
 * Use this in API routes that must be authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }
  
  return user;
}
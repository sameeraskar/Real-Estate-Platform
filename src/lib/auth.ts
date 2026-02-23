import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token }) {
      if (token?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { tenantId: true },
        });
        if (dbUser) (token as any).tenantId = dbUser.tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).tenantId = (token as any).tenantId;
      return session;
    },
  },
};

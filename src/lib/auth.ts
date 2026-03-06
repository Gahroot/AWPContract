import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// Session configuration constants
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds
const SESSION_UPDATE_AGE = 24 * 60 * 60; // 1 day in seconds

export const { handlers, auth, signIn, signOut } = NextAuth({
  // PrismaAdapter type mismatch with Auth.js v5 - known issue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(db) as any,
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
          include: { territory: { select: { id: true, name: true } } },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          territoryId: user.territory?.id || null,
          territoryName: user.territory?.name || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.sub = user.id;
        token.territoryId = (user as { territoryId?: string | null }).territoryId ?? null;
        token.territoryName = (user as { territoryName?: string | null }).territoryName ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.sub as string;
        session.user.territoryId = (token.territoryId as string) ?? null;
        session.user.territoryName = (token.territoryName as string) ?? null;
      }
      return session;
    },
  },
});

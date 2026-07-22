import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 12,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            memberships: {
              where: { active: true },
              take: 1,
            },
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!valid) {
          return null;
        }

        const membership = user.memberships[0];

        if (!membership) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: membership.role,
          organizationId: membership.organizationId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId;
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
      }
      return session;
    },
  },
};
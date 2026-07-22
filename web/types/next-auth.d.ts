import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: string;
      organizationId: string;
    };
  }

  interface User {
    id: string;
    role: string;
    organizationId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: string;
    organizationId: string;
  }
}
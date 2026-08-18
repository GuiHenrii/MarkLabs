import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@marklabs/database";
import bcrypt from "bcryptjs";
import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      role?: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH] Missing credentials");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          console.log("[AUTH] User not found or no password:", { email: credentials.email });
          return null;
        }

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (passwordsMatch) {
          console.log("[AUTH] Password matched, returning user:", { id: user.id, email: user.email });
          return user;
        }

        console.log("[AUTH] Password mismatch");
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log("[JWT CALLBACK] Adding user to token:", { userId: user.id });
        token.id = user.id;
        token.role = user.role;
      } else {
        console.log("[JWT CALLBACK] No user provided, token state:", { id: token.id });
      }
      return token;
    },
    async session({ session, token }) {
      console.log("[SESSION CALLBACK] Creating session:", {
        tokenId: token.id,
        sessionUserEmail: session.user?.email,
      });
      if (session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.role = token.role as any;
      }
      return session;
    },
  },
});

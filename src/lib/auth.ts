import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rateLimiter"

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    //add the user's database id to the JWT token
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    // Make the ID available in the session
    async session({ session, token }) {
      if (token) session.user.id = token.id as string;
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Rate limit by email to prevent brute force
        const ip = (credentials?.email as string) || "unknown"
        const allowed = await checkRateLimit(ip)
        if (!allowed) {
          throw new Error("Too many login attempts. Please try again later.")
        }
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
});
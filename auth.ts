import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { authConfig } from "@/auth.config";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Orbit Station",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user?.password) return null; // OAuth-only account

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      if (!user.username) {
        let isUnique = false;
        let generatedUsername = "";
        while (!isUnique) {
          generatedUsername = `Pilot${Math.floor(1000 + Math.random() * 9000)}`;
          const existingUser = await db.user.findUnique({ where: { username: generatedUsername }});
          if (!existingUser) isUnique = true;
        }
        await db.user.update({
          where: { id: user.id },
          data: { username: generatedUsername, name: user.name || "New Pilot" }
        });
      }
    }
  },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        // Don't store massive base64 images in JWT cookies
        delete token.picture;
        delete token.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id as string;
      // Ensure session doesn't try to send a giant default image
      session.user.image = null;
      return session;
    },
  },
});

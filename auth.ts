import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { authConfig } from "@/auth.config";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { sendEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Orbit Station",
      credentials: {
        email: { label: "Email / Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const input = credentials.email as string;
        const user = await db.user.findFirst({
          where: {
            OR: [
              { email: input },
              { username: input },
            ]
          },
        });

        if (!user?.password) return null; // OAuth-only account

        if (!user.emailVerified) {
          throw new Error("Please verify your email address to log in.");
        }

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
      if (!(user as any).username) {
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

        // New Login Device Check
        try {
          const cookieStore = await cookies();
          const deviceId = cookieStore.get("orbit_device_id")?.value;
          
          if (!deviceId) {
            const reqHeaders = await headers();
            const userAgent = reqHeaders.get("user-agent") || "Unknown Device";
            const ip = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || "Unknown IP";
            
            const newDeviceId = randomBytes(16).toString("hex");
            
            // Try setting the cookie. May fail if headers are already sent in some edge cases.
            cookieStore.set("orbit_device_id", newDeviceId, {
              maxAge: 60 * 60 * 24 * 365,
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
            });

            // Send notification email asynchronously
            if (user.email) {
               sendEmail({
                 to: user.email,
                 subject: "New Login Detected - Orbit Station",
                 html: `
                   <div style="font-family: sans-serif; padding: 20px; color: #1f2937;">
                     <h2 style="color: #6d28d9;">New Login Detected</h2>
                     <p>Pilot <strong>${user.name || "Unknown"}</strong>,</p>
                     <p>We detected a new login to your Orbit Station account.</p>
                     <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                       <ul style="list-style: none; padding: 0; margin: 0;">
                         <li style="margin-bottom: 8px;"><strong>Time:</strong> ${new Date().toUTCString()}</li>
                         <li style="margin-bottom: 8px;"><strong>IP Address:</strong> ${ip}</li>
                         <li><strong>Device/Browser:</strong> ${userAgent}</li>
                       </ul>
                     </div>
                     <p>If this was you, you can safely ignore this email.</p>
                     <p>If this wasn't you, please secure your account immediately.</p>
                   </div>
                 `
               }).catch(console.error);
            }
          }
        } catch (e) {
          console.error("Failed to check/set device cookie", e);
        }
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

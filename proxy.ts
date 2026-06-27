import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * Proxy menggunakan authConfig yang RINGAN (tanpa Prisma/Node.js modules)
 * agar kompatibel dengan Edge Runtime Next.js.
 *
 * Logic proteksi route ada di authConfig.callbacks.authorized
 *
 * Menggantikan middleware.ts yang deprecated di Next.js v16.
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/station",
    "/settings/:path*",
  ],
};

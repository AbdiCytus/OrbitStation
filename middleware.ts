import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * Middleware menggunakan authConfig yang RINGAN (tanpa Prisma/Node.js modules)
 * agar kompatibel dengan Edge Runtime Next.js.
 *
 * Logic proteksi route ada di authConfig.callbacks.authorized
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    /*
     * Match semua request path KECUALI yang dimulai dengan:
     * - api/ (semua API routes — auth dilakukan di dalam route itu sendiri)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - halaman publik (/, /login, /register, /[username])
     */
    "/station/:path*",
    "/settings/:path*",
  ],
};

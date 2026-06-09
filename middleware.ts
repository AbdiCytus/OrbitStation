import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * Middleware menggunakan authConfig yang RINGAN (tanpa Prisma/Node.js modules)
 * agar kompatibel dengan Edge Runtime Next.js.
 *
 * Logic proteksi route ada di authConfig.callbacks.authorized
 */
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    /*
     * Match semua request path KECUALI yang dimulai dengan:
     * - api/auth (NextAuth route)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

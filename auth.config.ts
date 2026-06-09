import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

/**
 * Auth config yang ringan — TANPA Prisma adapter.
 * Digunakan oleh middleware (Edge Runtime) yang tidak support Node.js modules.
 * 
 * Full auth config (dengan Prisma) ada di auth.ts
 */
export const authConfig: NextAuthConfig = {
  providers: [GitHub, Google],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLoginPage = nextUrl.pathname.startsWith("/login");
      const isOnRegisterPage = nextUrl.pathname.startsWith("/register");
      const isPublicRoute =
        nextUrl.pathname.startsWith("/api/auth") ||
        nextUrl.pathname.startsWith("/_next") ||
        nextUrl.pathname.startsWith("/favicon") ||
        // Halaman profil publik Station bisa diakses tanpa login
        nextUrl.pathname.match(/^\/[^/]+$/) !== null;

      if (isOnLoginPage || isOnRegisterPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/station", nextUrl));
        }
        return true;
      }

      if (!isLoggedIn && !isPublicRoute) {
        return false; // Redirect ke /login
      }

      return true;
    },
  },
};

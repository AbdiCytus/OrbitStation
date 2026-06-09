export { auth as middleware } from "@/auth";

export const config = {
  // Proteksi semua route kecuali halaman publik, API auth, dan static assets
  matcher: [
    "/((?!login|register|api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
};

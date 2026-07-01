import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { auth } from "@/auth";

/**
 * Helper to authenticate an API request.
 * It first checks for a Bearer token (for OAuth apps).
 * If no Bearer token is provided, it falls back to the NextAuth session.
 * 
 * Returns the userId (string) if authenticated, or a NextResponse object (error) if not.
 */
export async function getApiUserId(req: Request): Promise<string | NextResponse> {
  const authHeader = req.headers.get("authorization");

  // 1. Check for Bearer Token
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const jwtSecret = process.env.AUTH_SECRET;

    if (!jwtSecret) {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    try {
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(token, secret, {
        issuer: process.env.NEXTAUTH_URL ?? "https://orbitstation.com",
      });

      if (payload.sub) {
        return payload.sub; // return userId
      }
    } catch {
      return NextResponse.json(
        { error: "invalid_token", error_description: "The access token is expired or invalid." },
        {
          status: 401,
          headers: { "WWW-Authenticate": "Bearer error=\"invalid_token\"" },
        }
      );
    }
  }

  // 2. Fallback to NextAuth Session (if user accesses API via the Web UI)
  const session = await auth();
  if (session?.user?.id) {
    return session.user.id;
  }

  // 3. If neither token nor session is valid
  return NextResponse.json(
    { error: "unauthorized", error_description: "Missing or invalid Authorization header or session." },
    {
      status: 401,
      headers: { "WWW-Authenticate": "Bearer realm=\"Orbit Station\"" },
    }
  );
}

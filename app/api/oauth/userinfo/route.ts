import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jwtVerify } from "jose";

// ============================================================
// GET /api/oauth/userinfo
// Kembalikan profil user berdasarkan Bearer JWT yang valid
// ============================================================
export async function GET(req: Request) {
  // --- Ambil token dari Authorization header ---
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "unauthorized", error_description: "Missing or invalid Authorization header. Expected: Bearer <token>" },
      {
        status: 401,
        headers: { "WWW-Authenticate": "Bearer realm=\"Orbit Station\"" },
      }
    );
  }

  const token = authHeader.slice(7); // Hapus prefix "Bearer "

  // --- Verifikasi JWT ---
  const jwtSecret = process.env.AUTH_SECRET;
  if (!jwtSecret) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  let payload: { sub?: string; client_id?: string; scope?: string };
  try {
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload: verified } = await jwtVerify(token, secret, {
      issuer: process.env.NEXTAUTH_URL ?? "https://orbitstation.com",
    });
    payload = verified as typeof payload;
  } catch {
    return NextResponse.json(
      { error: "invalid_token", error_description: "The access token is expired or invalid." },
      {
        status: 401,
        headers: { "WWW-Authenticate": "Bearer error=\"invalid_token\"" },
      }
    );
  }

  const userId = payload.sub;
  if (!userId) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  // --- Ambil data user dari database ---
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
      callsign: true,
      titleBadge: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "user_not_found", error_description: "The user associated with this token no longer exists." },
      { status: 404 }
    );
  }

  // --- Kembalikan profil dalam format OIDC standar ---
  return NextResponse.json({
    sub: user.id,
    name: user.name,
    preferred_username: user.username,
    email: user.email,
    picture: user.image,
    // Extended Orbit Station fields
    callsign: user.callsign,
    title_badge: user.titleBadge,
  });
}

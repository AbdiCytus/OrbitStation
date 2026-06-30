import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getApiUserId } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization",
};

// Preflight handler
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// ============================================================
// GET /api/oauth/userinfo
// Kembalikan profil user berdasarkan Bearer JWT yang valid
// ============================================================
export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(ip, 100, 60000)) {
    return NextResponse.json({ error: "rate_limit_exceeded", error_description: "Too many requests" }, { status: 429 });
  }

  const userIdOrResponse = await getApiUserId(req);
  if (typeof userIdOrResponse !== "string") {
    // Apabila error, kembalikan response dengan CORS headers
    const res = userIdOrResponse;
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  const userId = userIdOrResponse;

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
  }, { headers: CORS_HEADERS });
}

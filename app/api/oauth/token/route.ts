import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SignJWT } from "jose";

// ============================================================
// POST /api/oauth/token
// Server-to-server: Tukarkan authorization_code dengan JWT access_token
// ============================================================
export async function POST(req: Request) {
  let body: Record<string, string>;

  // Support both form-urlencoded and JSON body
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await req.formData();
    body = Object.fromEntries(
      Array.from(formData.entries()).map(([k, v]) => [k, v.toString()])
    );
  } else {
    body = await req.json().catch(() => ({}));
  }

  const { grant_type, code, client_id, client_secret, redirect_uri } = body;

  // --- Validasi grant_type ---
  if (grant_type !== "authorization_code") {
    return NextResponse.json(
      { error: "unsupported_grant_type", error_description: "Only 'authorization_code' is supported." },
      { status: 400 }
    );
  }

  if (!code || !client_id || !client_secret || !redirect_uri) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing required parameters: code, client_id, client_secret, redirect_uri." },
      { status: 400 }
    );
  }

  // --- Verifikasi Client credentials ---
  const oauthApp = await db.oAuthApp.findUnique({ where: { clientId: client_id } });
  if (!oauthApp || oauthApp.clientSecret !== client_secret) {
    return NextResponse.json(
      { error: "invalid_client", error_description: "Invalid client_id or client_secret." },
      { status: 401 }
    );
  }

  // --- Verifikasi Authorization Code ---
  const authCode = await db.oAuthCode.findUnique({ where: { code } });

  if (!authCode) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Authorization code not found or already used." },
      { status: 400 }
    );
  }

  // Pastikan kode belum kedaluwarsa
  if (authCode.expiresAt < new Date()) {
    await db.oAuthCode.delete({ where: { code } }); // hapus kode basi
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Authorization code has expired." },
      { status: 400 }
    );
  }

  // Pastikan kode dipakai oleh client dan redirect_uri yang benar
  if (authCode.clientId !== client_id || authCode.redirectUri !== redirect_uri) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Code was issued for a different client or redirect_uri." },
      { status: 400 }
    );
  }

  // --- Konsumsi kode (hapus setelah pakai — ONE-TIME USE) ---
  await db.oAuthCode.delete({ where: { code } });

  // --- Generate JWT Access Token ---
  const jwtSecret = process.env.AUTH_SECRET;
  if (!jwtSecret) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  const secret = new TextEncoder().encode(jwtSecret);
  const expiresInSeconds = 3600; // 1 jam

  const access_token = await new SignJWT({
    sub: authCode.userId,
    client_id: client_id,
    scope: "profile email",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .setIssuer(process.env.NEXTAUTH_URL ?? "https://orbitstation.com")
    .sign(secret);

  return NextResponse.json({
    access_token,
    token_type: "Bearer",
    expires_in: expiresInSeconds,
    scope: "profile email",
  });
}

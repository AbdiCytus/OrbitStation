import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// POST /api/oauth/test-start
// Simpan client credentials di cookie sementara, lalu redirect ke authorize
export async function POST(req: Request) {
  const { clientId, clientSecret } = await req.json();

  if (!clientId?.trim() || !clientSecret?.trim()) {
    return NextResponse.json({ error: "clientId and clientSecret are required." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/oauth/test-callback`;

  // Simpan secret di httpOnly cookie (berlaku 5 menit saja)
  cookieStore.set("_orbit_test_secret", JSON.stringify({ clientId, clientSecret }), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 300, // 5 menit
    path: "/",
  });

  // Redirect ke consent screen
  const authorizeUrl = new URL(`${origin}/api/oauth/authorize`);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("state", "orbit_test");

  return NextResponse.json({ redirectUrl: authorizeUrl.toString() });
}

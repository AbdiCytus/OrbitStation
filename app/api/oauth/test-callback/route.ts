import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/oauth/test-callback?code=...&state=...
// Menerima authorization code, melakukan token exchange, dan menampilkan hasilnya sebagai HTML
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Jika user menekan Deny
  if (error) {
    return renderHtml("❌ Access Denied", `
      <p class="sub">The user denied access to the application.</p>
      <p class="error-box">Error: ${error}</p>
      <a href="/oauth-test" class="btn-back">← Try Again</a>
    `, "error");
  }

  if (!code) {
    return renderHtml("❌ Missing Code", `
      <p class="sub">No authorization code was received in the callback.</p>
      <a href="/oauth-test" class="btn-back">← Try Again</a>
    `, "error");
  }

  // Baca credentials dari cookie
  const cookieStore = await cookies();
  const rawCreds = cookieStore.get("_orbit_test_secret")?.value;
  if (!rawCreds) {
    return renderHtml("❌ Session Expired", `
      <p class="sub">Test credentials cookie has expired. Please start the flow again.</p>
      <a href="/oauth-test" class="btn-back">← Try Again</a>
    `, "error");
  }

  let clientId: string, clientSecret: string;
  try {
    ({ clientId, clientSecret } = JSON.parse(rawCreds));
  } catch {
    return renderHtml("❌ Invalid Session", `<a href="/oauth-test" class="btn-back">← Try Again</a>`, "error");
  }

  // Hapus cookie setelah dipakai
  cookieStore.delete("_orbit_test_secret");

  const redirectUri = `${origin}/api/oauth/test-callback`;

  // ── Langkah 1: Tukar code → access_token ──
  let tokenData: { access_token?: string; error?: string; error_description?: string };
  try {
    const tokenRes = await fetch(`${origin}/api/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });
    tokenData = await tokenRes.json();
  } catch (e) {
    return renderHtml("❌ Token Exchange Failed", `
      <p class="sub">Could not reach the token endpoint.</p>
      <a href="/oauth-test" class="btn-back">← Try Again</a>
    `, "error");
  }

  if (!tokenData.access_token) {
    return renderHtml("❌ Token Exchange Failed", `
      <p class="sub">The server returned an error during token exchange.</p>
      <div class="code-block"><pre>${JSON.stringify(tokenData, null, 2)}</pre></div>
      <a href="/oauth-test" class="btn-back">← Try Again</a>
    `, "error");
  }

  // ── Langkah 2: Pakai access_token untuk ambil profil ──
  let userInfo: Record<string, unknown>;
  try {
    const userRes = await fetch(`${origin}/api/oauth/userinfo`, {
      headers: { "Authorization": `Bearer ${tokenData.access_token}` },
    });
    userInfo = await userRes.json();
  } catch {
    return renderHtml("❌ UserInfo Failed", `
      <p class="sub">Could not fetch user profile using the access token.</p>
      <a href="/oauth-test" class="btn-back">← Try Again</a>
    `, "error");
  }

  // ── Sukses! Tampilkan hasil ──
  const avatarHtml = userInfo.picture
    ? `<img src="${userInfo.picture}" alt="avatar" style="width:72px;height:72px;border-radius:50%;border:2px solid rgba(124,92,252,0.5);object-fit:cover;" />`
    : `<div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#7c5cfc,#22d3ee);display:flex;align-items:center;justify-content:center;font-size:1.75rem;font-weight:800;color:#fff;">${String(userInfo.name || "?").charAt(0).toUpperCase()}</div>`;

  const tokenPreview = `${tokenData.access_token.slice(0, 20)}...${tokenData.access_token.slice(-10)}`;

  return renderHtml("✅ OAuth Flow Successful!", `
    <div class="user-row">
      ${avatarHtml}
      <div>
        <p class="user-name">${userInfo.name ?? "—"}</p>
        <p class="user-email">${userInfo.email ?? "—"}</p>
        ${userInfo.preferred_username ? `<p class="user-username">@${userInfo.preferred_username}</p>` : ""}
      </div>
    </div>

    <div class="section-label">🔑 Access Token (preview)</div>
    <div class="code-block"><code>${tokenPreview}</code></div>

    <div class="section-label">📋 Full User Profile (from /api/oauth/userinfo)</div>
    <div class="code-block"><pre>${JSON.stringify(userInfo, null, 2)}</pre></div>

    <a href="/oauth-test" class="btn-back">← Test Again</a>
  `, "success");
}

function renderHtml(title: string, body: string, type: "success" | "error" = "success") {
  const titleColor = type === "success" ? "#4ade80" : "#f87171";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} – Orbit Station OAuth Test</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Space Grotesk", system-ui, sans-serif;
      background: #030712;
      color: #f0f4ff;
      min-height: 100dvh;
      display: flex; align-items: center; justify-content: center;
      padding: 1rem;
      background-image: radial-gradient(ellipse at 20% 50%, rgba(124,92,252,0.08) 0%, transparent 60%);
    }
    .card {
      background: rgba(17,24,39,0.85);
      border: 1px solid rgba(124,92,252,0.2);
      border-radius: 20px;
      padding: 2.5rem;
      width: 100%; max-width: 560px;
      backdrop-filter: blur(24px);
      box-shadow: 0 25px 50px rgba(0,0,0,0.6);
      display: flex; flex-direction: column; gap: 1.25rem;
    }
    h1 { font-size: 1.25rem; font-weight: 800; color: ${titleColor}; }
    .sub { color: #6b7db3; font-size: 0.875rem; }
    .user-row { display: flex; align-items: center; gap: 1rem; }
    .user-name { font-size: 1rem; font-weight: 700; color: #f0f4ff; }
    .user-email { font-size: 0.8125rem; color: #6b7db3; }
    .user-username { font-size: 0.8125rem; color: #a78bfa; }
    .section-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7db3; }
    .code-block {
      background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px; padding: 1rem;
      font-family: monospace; font-size: 0.75rem; color: #a78bfa;
      overflow-x: auto; word-break: break-all;
    }
    pre { white-space: pre-wrap; }
    .error-box { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 0.75rem; color: #f87171; font-size: 0.8125rem; }
    .btn-back {
      display: inline-block; padding: 0.625rem 1.25rem;
      background: rgba(124,92,252,0.15); border: 1px solid rgba(124,92,252,0.35);
      border-radius: 10px; color: #a78bfa; font-weight: 700;
      text-decoration: none; font-size: 0.875rem; text-align: center;
      transition: background 0.2s;
    }
    .btn-back:hover { background: rgba(124,92,252,0.3); }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    ${body}
  </div>
</body>
</html>`;

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

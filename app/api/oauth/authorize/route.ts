import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// ============================================================
// GET /api/oauth/authorize
// Menampilkan Consent Screen kepada pengguna
// ============================================================
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const client_id = searchParams.get("client_id");
  const redirect_uri = searchParams.get("redirect_uri");
  const response_type = searchParams.get("response_type");
  const state = searchParams.get("state") ?? "";

  // --- Validasi parameter dasar ---
  if (!client_id || !redirect_uri || response_type !== "code") {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing or invalid parameters. Required: client_id, redirect_uri, response_type=code" },
      { status: 400 }
    );
  }

  // --- Validasi Client terdaftar ---
  const oauthApp = await db.oAuthApp.findUnique({ where: { clientId: client_id } });
  if (!oauthApp) {
    return NextResponse.json(
      { error: "invalid_client", error_description: "Unknown client_id." },
      { status: 400 }
    );
  }

  // --- Validasi Redirect URI ---
  if (!oauthApp.redirectUris.includes(redirect_uri)) {
    return NextResponse.json(
      { error: "invalid_redirect_uri", error_description: "The redirect_uri is not registered for this client." },
      { status: 400 }
    );
  }

  // --- Cek apakah user sudah login di Orbit Station ---
  const session = await auth();
  if (!session?.user?.id) {
    // Belum login: simpan params dan arahkan ke halaman login dulu
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl, 302);
  }

  // --- Cek apakah app ini milik user sendiri, ATAU user sudah pernah consent ---
  const isOwner = oauthApp.ownerId === session.user.id;
  const existingConsent = await db.oAuthConsent.findUnique({
    where: {
      userId_clientId: {
        userId: session.user.id,
        clientId: client_id,
      }
    }
  });

  if (isOwner || existingConsent) {
    // Auto-approve: Langsung buat kode dan redirect tanpa menampilkan HTML consent
    const code = `code_${generateCode(40)}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

    await db.oAuthCode.create({
      data: { code, clientId: client_id, userId: session.user.id, redirectUri: redirect_uri, expiresAt },
    });

    const callbackUrl = new URL(redirect_uri);
    callbackUrl.searchParams.set("code", code);
    if (state) callbackUrl.searchParams.set("state", state);

    return NextResponse.redirect(callbackUrl.toString(), 302);
  }

  // --- Tampilkan Consent Screen (HTML inline) ---
  const appName = oauthApp.name;
  const userName = session.user.name ?? session.user.email ?? "User";
  const userAvatar = session.user.image;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Authorize ${appName} – Orbit Station</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Space Grotesk", system-ui, sans-serif;
      background: #030712;
      color: #f0f4ff;
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background-image: radial-gradient(ellipse at 20% 50%, rgba(124, 92, 252, 0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(34, 211, 238, 0.05) 0%, transparent 50%);
    }
    .card {
      background: rgba(17, 24, 39, 0.8);
      border: 1px solid rgba(124, 92, 252, 0.2);
      border-radius: 20px;
      padding: 2.5rem;
      width: 100%;
      max-width: 420px;
      backdrop-filter: blur(24px);
      box-shadow: 0 25px 50px rgba(0,0,0,0.6);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .orbit-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: #a78bfa;
      font-size: 0.8125rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .orbit-dot { width: 8px; height: 8px; background: #7c5cfc; border-radius: 50%; box-shadow: 0 0 8px #7c5cfc; }
    .connect-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }
    .app-icon {
      width: 56px; height: 56px;
      background: linear-gradient(135deg, #7c5cfc, #22d3ee);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: 800; color: #fff;
      flex-shrink: 0;
    }
    .arrow { color: rgba(124,92,252,0.6); font-size: 1.25rem; }
    .user-icon {
      width: 56px; height: 56px;
      border-radius: 50%;
      border: 2px solid rgba(124,92,252,0.4);
      overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #5b3fde, #22d3ee);
      font-size: 1.25rem; font-weight: 800; color: #fff;
      flex-shrink: 0;
    }
    .user-icon img { width: 100%; height: 100%; object-fit: cover; }
    h1 { font-size: 1.125rem; font-weight: 800; text-align: center; }
    h1 span { color: #a78bfa; }
    .sub { font-size: 0.8125rem; color: #6b7db3; text-align: center; }
    .permissions {
      background: rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }
    .perm-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7db3; margin-bottom: 0.25rem; }
    .perm-item {
      display: flex; align-items: center; gap: 0.625rem;
      font-size: 0.8125rem; color: #c4cde8;
    }
    .perm-check { color: #4ade80; font-size: 0.875rem; }
    .btn-row { display: flex; gap: 0.75rem; }
    .btn {
      flex: 1; padding: 0.75rem; border-radius: 10px;
      font-family: inherit; font-size: 0.9rem; font-weight: 700;
      cursor: pointer; border: none; transition: all 0.2s;
    }
    .btn-allow {
      background: linear-gradient(135deg, #7c5cfc, #5b3fde);
      color: #fff;
      box-shadow: 0 4px 16px rgba(124,92,252,0.35);
    }
    .btn-allow:hover { filter: brightness(1.15); }
    .btn-deny {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      color: #9aa5c4;
    }
    .btn-deny:hover { background: rgba(255,255,255,0.1); color: #f0f4ff; }
    .warning { font-size: 0.7rem; color: #4b5675; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="orbit-badge">
      <span class="orbit-dot"></span>
      Orbit Station SSO
    </div>
    
    <div class="connect-row">
      <div class="app-icon">${appName.charAt(0).toUpperCase()}</div>
      <span class="arrow">⇄</span>
      <div class="user-icon">
        ${userAvatar ? `<img src="${userAvatar}" alt="${userName}" />` : userName.charAt(0).toUpperCase()}
      </div>
    </div>

    <div>
      <h1><span>${appName}</span> wants access to your Orbit Station</h1>
      <p class="sub" style="margin-top: 0.5rem">Signed in as <strong>${userName}</strong></p>
    </div>

    <div class="permissions">
      <p class="perm-label">This app will be able to access:</p>
      <div class="perm-item"><span class="perm-check">✓</span> Your username and display name</div>
      <div class="perm-item"><span class="perm-check">✓</span> Your email address</div>
      <div class="perm-item"><span class="perm-check">✓</span> Your profile avatar</div>
    </div>

    <form action="/api/oauth/authorize" method="POST" class="btn-row" style="flex-direction: column; gap: 0.75rem">
      <input type="hidden" name="client_id" value="${client_id}" />
      <input type="hidden" name="redirect_uri" value="${redirect_uri}" />
      <input type="hidden" name="state" value="${state}" />
      <div class="btn-row">
        <button type="submit" name="action" value="deny" class="btn btn-deny">Deny</button>
        <button type="submit" name="action" value="allow" class="btn btn-allow">Allow Access</button>
      </div>
    </form>

    <p class="warning">By allowing, ${appName} can use your Orbit Station identity to log you in. Orbit Station will not share your password.</p>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// ============================================================
// POST /api/oauth/authorize
// Menangani keputusan user (Allow / Deny) dan menerbitkan kode
// ============================================================
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const action = formData.get("action");
  const client_id = formData.get("client_id")?.toString();
  const redirect_uri = formData.get("redirect_uri")?.toString();
  const state = formData.get("state")?.toString() ?? "";

  if (!client_id || !redirect_uri) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  // Jika user menolak
  if (action !== "allow") {
    const denyUrl = new URL(redirect_uri);
    denyUrl.searchParams.set("error", "access_denied");
    denyUrl.searchParams.set("error_description", "The user denied access.");
    if (state) denyUrl.searchParams.set("state", state);
    return NextResponse.redirect(denyUrl.toString(), 302);
  }

  // Validasi client sekali lagi
  const oauthApp = await db.oAuthApp.findUnique({ where: { clientId: client_id } });
  if (!oauthApp || !oauthApp.redirectUris.includes(redirect_uri)) {
    return NextResponse.json({ error: "invalid_client" }, { status: 400 });
  }

  // Simpan consent agar ke depannya bisa bypass
  await db.oAuthConsent.upsert({
    where: {
      userId_clientId: {
        userId: session.user.id,
        clientId: client_id,
      }
    },
    update: {},
    create: {
      userId: session.user.id,
      clientId: client_id,
    }
  });

  // Generate authorization code (kode sekali pakai, expired 5 menit)
  const code = `code_${generateCode(40)}`;
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

  await db.oAuthCode.create({
    data: {
      code,
      clientId: client_id,
      userId: session.user.id,
      redirectUri: redirect_uri,
      expiresAt,
    },
  });

  // Redirect kembali ke web pihak ketiga dengan kode
  const callbackUrl = new URL(redirect_uri);
  callbackUrl.searchParams.set("code", code);
  if (state) callbackUrl.searchParams.set("state", state);

  return NextResponse.redirect(callbackUrl.toString(), 302);
}

function generateCode(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

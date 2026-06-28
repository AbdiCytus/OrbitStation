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
  
  // Ambil data user dari DB agar selalu dapat avatar terbaru (terutama jika baru diupload ke profil)
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { image: true, name: true, email: true }
  });

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
  const userName = dbUser?.name ?? dbUser?.email ?? session.user.name ?? session.user.email ?? "User";
  const userAvatar = dbUser?.image ?? session.user.image ?? "";
  const appHomepage = (oauthApp as any).homepageUrl ?? "";

  // Coba fetch favicon nyata dari HTML metadata halaman homepage client
  let appIconImg = "";
  if (appHomepage) {
    try {
      const urlObj = new URL(appHomepage);
      const baseUrl = urlObj.origin;

      // Fetch HTML homepage dengan timeout 3 detik
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const pageRes = await fetch(appHomepage, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; OrbitStation/1.0; +https://orbitstation.app)",
          "Accept": "text/html,application/xhtml+xml",
        },
      }).catch(() => null);
      clearTimeout(timeoutId);

      if (pageRes?.ok) {
        const html = await pageRes.text();
        // Cari berbagai format icon link
        const iconPatterns = [
          /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i,
          /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i,
          /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i,
          /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon["']/i,
        ];
        for (const pattern of iconPatterns) {
          const match = html.match(pattern);
          if (match?.[1]) {
            const iconHref = match[1];
            try {
              appIconImg = new URL(iconHref, baseUrl).toString();
            } catch {
              appIconImg = iconHref;
            }
            break;
          }
        }
        // Fallback ke /favicon.ico jika tidak ditemukan di HTML
        if (!appIconImg) {
          appIconImg = `${baseUrl}/favicon.ico`;
        }
      }
    } catch {
      // Abaikan error fetch, tampilkan fallback huruf
    }
  }

  const html = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Authorize ${appName} – Orbit Station</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800&display=swap" rel="stylesheet">
  
  <link rel="stylesheet" href="/globals.css">
  
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      height: 100%;
    }

    body {
      background-color: #03000a;
      color: #f8fafc;
      font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    }

    /* ── Cosmic Background (mirrors login page) ── */
    .cosmic-bg {
      position: fixed;
      inset: 0;
      background-color: #03000a;
      overflow: hidden;
      z-index: 0;
      pointer-events: none;
    }
    .cosmic-stars {
      position: absolute;
      inset: 0;
      background-image:
        radial-gradient(1px 1px at 20px 30px, #fff, rgba(0,0,0,0)),
        radial-gradient(1.5px 1.5px at 40px 70px, #fff, rgba(0,0,0,0)),
        radial-gradient(2px 2px at 50px 160px, #fff, rgba(0,0,0,0)),
        radial-gradient(1.5px 1.5px at 90px 40px, #fff, rgba(0,0,0,0)),
        radial-gradient(3px 3px at 130px 80px, #e0c8ff, rgba(0,0,0,0)),
        radial-gradient(1px 1px at 160px 120px, #fff, rgba(0,0,0,0));
      background-repeat: repeat;
      background-size: 200px 200px;
      animation: cosmic-drift 80s linear infinite;
      opacity: 0.8;
    }
    .cosmic-aurora {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background:
        radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.3), transparent 30%),
        radial-gradient(circle at 20% 80%, rgba(14, 165, 233, 0.2), transparent 30%),
        radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.2), transparent 30%);
      animation: cosmic-pulse 15s ease-in-out infinite alternate;
      filter: blur(60px);
    }
    .cosmic-comet {
      position: absolute;
      top: 10%;
      left: -10%;
      width: 300px;
      height: 4px;
      background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,1));
      border-radius: 50%;
      filter: drop-shadow(0 0 20px #fff) drop-shadow(0 0 10px #a78bfa);
      transform: rotate(30deg);
      animation: cosmic-shoot 8s infinite;
    }
    .cosmic-dust {
      position: absolute;
      inset: 0;
      background-image:
        radial-gradient(1px 1px at 25% 35%, rgba(139, 92, 246, 0.6), transparent),
        radial-gradient(1.5px 1.5px at 75% 65%, rgba(14, 165, 233, 0.5), transparent),
        radial-gradient(2px 2px at 15% 85%, rgba(236, 72, 153, 0.4), transparent);
      background-size: 150px 150px;
      animation: cosmic-drift 50s linear infinite reverse;
      opacity: 0.5;
      filter: blur(1px);
    }
    @keyframes cosmic-drift {
      0%   { background-position: 0 0; }
      100% { background-position: -600px 600px; }
    }
    @keyframes cosmic-pulse {
      0%   { transform: scale(1);   opacity: 0.6; }
      100% { transform: scale(1.1); opacity: 1;   }
    }
    @keyframes cosmic-shoot {
      0%   { transform: translateX(-10vw) translateY(-10vh) rotate(30deg); opacity: 0; }
      10%  { opacity: 1; }
      20%  { transform: translateX(110vw) translateY(110vh) rotate(30deg); opacity: 0; }
      100% { opacity: 0; }
    }

    /* ── Card ── */
    .card {
      background: rgba(15, 15, 25, 0.6);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.1);
      border-radius: 24px;
      padding: 2.5rem;
      width: 100%;
      max-width: 420px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      position: relative;
      z-index: 10;
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
      width: 60px; height: 60px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: 800; color: #a78bfa;
      flex-shrink: 0;
      overflow: hidden;
      box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);
    }
    .app-icon img { width: 100%; height: 100%; object-fit: contain; border-radius: 14px; }
    .fallback-letter {
      font-size: 1.5rem;
      font-weight: 800;
      color: #a78bfa;
      text-transform: uppercase;
    }
    .arrow { color: rgba(124,92,252,0.6); font-size: 1.25rem; }
    .user-icon {
      width: 60px; height: 60px;
      border-radius: 50%;
      border: 2px solid rgba(139, 92, 246, 0.5);
      overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      background: rgba(139, 92, 246, 0.25);
      font-size: 1.25rem; font-weight: 800; color: #fff;
      flex-shrink: 0;
      box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
    }
    .user-icon img { width: 100%; height: 100%; object-fit: cover; display: block; }
    h1 { font-size: 1.125rem; font-weight: 800; text-align: center; }
    h1 span { color: #a78bfa; text-shadow: 0 0 12px rgba(139, 92, 246, 0.6); }
    .sub { font-size: 0.8125rem; color: #94a3b8; text-align: center; }
    .permissions {
      background: rgba(0,0,0,0.4);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);
    }
    .perm-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 0.25rem; }
    .perm-item {
      display: flex; align-items: center; gap: 0.625rem;
      font-size: 0.8125rem; color: #e2e8f0;
    }
    .perm-check { color: #4ade80; font-size: 0.875rem; }
    .btn-row { display: flex; gap: 0.75rem; }
    .btn {
      flex: 1; padding: 0.75rem; border-radius: 12px;
      font-family: inherit; font-size: 0.95rem; font-weight: 700;
      cursor: pointer; border: none; transition: all 0.2s;
    }
    .btn-allow {
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
      color: #fff;
      box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4), inset 0 2px 5px rgba(255,255,255,0.2);
    }
    .btn-allow:hover { transform: scale(1.02); filter: brightness(1.15); }
    .btn-allow:active { transform: scale(0.95); }
    .btn-deny {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: #cbd5e1;
    }
    .btn-deny:hover { background: rgba(255,255,255,0.1); color: #f8fafc; }
    .warning { font-size: 0.7rem; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="cosmic-bg" aria-hidden="true">
    <div class="cosmic-stars"></div>
    <div class="cosmic-aurora" style="opacity: 0.6; transform: scale(1.2);"></div>
    <div class="cosmic-comet"></div>
    <div class="cosmic-dust"></div>
  </div>

  <div class="card">
    <div class="orbit-badge">
      <span class="orbit-dot"></span>
      Orbit Station SSO
    </div>

    <div class="connect-row">
      <div class="app-icon" id="app-icon-wrap">
        ${appIconImg
          ? `<img
              src="${appIconImg}"
              alt="${appName}"
              referrerpolicy="no-referrer"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            /><span class="fallback-letter" style="display: none; align-items: center; justify-content: center; width: 100%; height: 100%;">${appName.charAt(0).toUpperCase()}</span>`
          : `<span class="fallback-letter" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">${appName.charAt(0).toUpperCase()}</span>`
        }
      </div>
      <span class="arrow">⇄</span>
      <div class="user-icon" id="user-icon-wrap">
        ${userAvatar
          ? `<img
              src="${userAvatar}"
              alt="${userName}"
              referrerpolicy="no-referrer"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            /><span class="fallback-letter" style="display: none; align-items: center; justify-content: center; width: 100%; height: 100%;">${userName.charAt(0).toUpperCase()}</span>`
          : `<span class="fallback-letter" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">${userName.charAt(0).toUpperCase()}</span>`
        }
      </div>
    </div>

    <div>
      <h1><span>${appName}</span> wants access to your Orbit Station</h1>
      <p class="sub" style="margin-top: 0.5rem">Signed in as <strong style="color: #cbd5e1">${userName}</strong></p>
    </div>

    <div class="permissions">
      <p class="perm-label">This app will be able to access:</p>
      <div class="perm-item"><span class="perm-check">✓</span> Your username and display name</div>
      <div class="perm-item"><span class="perm-check">✓</span> Your email address</div>
      <div class="perm-item"><span class="perm-check">✓</span> Your profile avatar</div>
    </div>

    <form action="/api/oauth/authorize" method="POST" style="display: flex; flex-direction: column; gap: 0.75rem">
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

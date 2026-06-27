"use client";
import { useState } from "react";

type TechId = "nextjs" | "express" | "laravel" | "django" | "fastapi" | "go";
type Step = { title: string; code?: string; lang?: string; note?: string };
type TechDoc = { id: TechId; name: string; color: string; Logo: () => React.ReactElement; steps: Step[] };


// ── Placeholder-based syntax highlighter (avoids re-highlighting spans) ──
function highlight(raw: string, lang: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const ph: string[] = [];
  const save = (html: string) => { const k = `\x00${ph.length}\x00`; ph.push(html); return k; };
  const restore = (s: string) => s.replace(/\x00(\d+)\x00/g, (_, i) => ph[Number(i)]);

  let s = esc(raw);

  if (lang === "bash") {
    s = s.replace(/("([^"]*)")/g, (_, m) => save(`<span style="color:#a3e635">${esc(m)}</span>`));
    s = s.replace(/(#[^\n]+)/g, (m) => save(`<span style="color:#4b5675">${m}</span>`));
    s = s.replace(/\b(curl|node|php|python3?|go|npm|composer|pip3?|export|echo|git)\b/g,
      (m) => save(`<span style="color:#22d3ee">${m}</span>`));
    s = s.replace(/\b([A-Z_][A-Z0-9_]{2,})\b/g,
      (m) => save(`<span style="color:#fb923c">${m}</span>`));
    return restore(s);
  }

  // 1. strings first
  s = s.replace(/(`[^`]*`|&quot;[^&]*&quot;|&#39;[^&]*&#39;)/g,
    (m) => save(`<span style="color:#a3e635">${m}</span>`));
  // 2. comments
  s = s.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)/g,
    (m) => save(`<span style="color:#4b5675">${m}</span>`));
  // 3. decorators / annotations
  s = s.replace(/(@\w+)/g, (m) => save(`<span style="color:#f97316">${m}</span>`));
  // 4. keywords
  const KW = /\b(import|from|export|default|const|let|var|function|return|async|await|if|else|new|class|extends|require|use|namespace|public|protected|private|def|self|router|app|package|fmt|func|type|struct|interface|for|range|in|and|or|not|True|False|None|null|undefined|true|false|echo|void|static)\b/g;
  s = s.replace(KW, (m) => save(`<span style="color:#c084fc">${m}</span>`));
  // 5. PascalCase types
  s = s.replace(/\b([A-Z][A-Za-z0-9_]*)\b/g, (m) => save(`<span style="color:#38bdf8">${m}</span>`));
  // 6. numbers
  s = s.replace(/\b(\d+)\b/g, (m) => save(`<span style="color:#fb923c">${m}</span>`));

  return restore(s);
}

// ── SVG Logos ──
const Logos: Record<TechId, () => React.ReactElement> = {
  nextjs: () => (
    <svg width="20" height="20" viewBox="0 0 180 180" fill="none">
      <mask id="nj" style={{maskType:"alpha"}} maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="180">
        <circle cx="90" cy="90" r="90" fill="black"/>
      </mask>
      <g mask="url(#nj)">
        <circle cx="90" cy="90" r="90" fill="black"/>
        <path d="M149.508 157.52L69.142 54H54V125.97H66.1758V69.3059L139.366 164.985C142.774 162.575 146.064 160.032 149.508 157.52Z" fill="white"/>
        <rect x="115" y="54" width="12" height="72" fill="white"/>
      </g>
    </svg>
  ),
  express: () => (
    <svg width="20" height="20" viewBox="0 0 256 256" fill="none">
      <rect width="256" height="256" rx="32" fill="#000"/>
      <text x="20" y="165" fontSize="130" fontWeight="900" fill="white" fontFamily="Arial">e</text>
    </svg>
  ),
  laravel: () => (
    <svg width="20" height="20" viewBox="0 0 50 52" fill="none">
      <path d="M49.626 11.564a.809.809 0 0 1 .028.209v10.972a.8.8 0 0 1-.402.694l-9.209 5.302V39.25c0 .286-.152.55-.4.694L20.42 51.01c-.044.025-.092.041-.14.058-.018.006-.035.017-.054.022a.805.805 0 0 1-.41 0c-.022-.006-.042-.018-.063-.026-.044-.016-.09-.03-.132-.054L.402 39.944A.801.801 0 0 1 0 39.25V6.334c0-.072.01-.143.028-.209.006-.022.02-.041.028-.063.014-.039.026-.079.046-.116.01-.02.028-.037.042-.056.024-.033.046-.067.076-.097.023-.02.05-.039.076-.058.026-.02.049-.044.078-.06h.001L10.21.143a.802.802 0 0 1 .8 0l9.626 5.556h.001c.029.017.051.04.078.06.026.018.053.038.076.058.03.03.052.064.076.097.014.019.032.036.042.056.02.037.032.077.046.116.008.022.022.041.028.063.018.066.029.137.029.209v20.559l8.008-4.618V11.773c0-.072.011-.143.029-.209.006-.022.02-.041.028-.063.014-.039.026-.079.046-.116.01-.02.028-.037.042-.056.024-.033.046-.067.076-.097.023-.02.05-.039.076-.058.026-.02.049-.044.078-.06h.001l9.626-5.555a.801.801 0 0 1 .8 0l9.626 5.555c.03.016.053.04.079.06.025.019.052.038.076.058.03.03.051.064.075.097.014.019.032.036.042.056.021.037.033.077.046.116.008.022.022.041.028.063zm-1.574 10.718V13.87l-3.363 1.94-4.646 2.678v8.412l8.01-4.618zm-9.61 16.505V30.37l-4.57 2.612-13.05 7.458v8.489l17.62-10.102zM1.6 7.679v31.175L19.22 48.956v-8.49l-9.204-5.256-.003-.002-.004-.002c-.025-.015-.05-.035-.074-.053-.02-.017-.042-.03-.061-.048-.024-.02-.043-.045-.065-.068-.016-.02-.035-.038-.049-.059-.018-.027-.03-.057-.044-.086-.012-.026-.025-.051-.032-.079-.012-.037-.016-.075-.02-.113-.003-.02-.01-.038-.01-.058V14.537L4.965 11.86 1.6 7.679z" fill="#FF2D20"/>
    </svg>
  ),
  django: () => (
    <svg width="20" height="20" viewBox="0 0 256 256" fill="none">
      <rect width="256" height="256" rx="32" fill="#092E20"/>
      <path d="M135.6 10h34.8v177.4c-17.8 3.4-30.9 4.8-45.1 4.8-42.5 0-64.6-19.2-64.6-56 0-35.5 23.5-58.5 59.9-58.5 5.7 0 10 .5 15 1.9V10zm0 96.5c-4-1.4-7.3-1.9-11.5-1.9-17.6 0-27.8 10.8-27.8 29.7 0 18.4 9.7 28.5 27.5 28.5 3.8 0 6.9-.3 11.8-1.1v-55.2z" fill="white"/>
    </svg>
  ),
  fastapi: () => (
    <svg width="20" height="20" viewBox="0 0 256 256" fill="none">
      <rect width="256" height="256" rx="128" fill="#009688"/>
      <path d="M140 28L68 144h60l-12 84 84-116h-60z" fill="white"/>
    </svg>
  ),
  go: () => (
    <svg width="32" height="20" viewBox="0 0 206 78" fill="none">
      <path d="M16.2 24.1c-.4 0-.5-.2-.3-.5l2.1-2.7c.2-.3.7-.5 1.1-.5h35.7c.4 0 .5.3.3.6l-1.7 2.6c-.2.3-.7.6-1 .6l-36.2-.1zM1 33.3c-.4 0-.5-.2-.3-.5l2.1-2.7c.2-.3.7-.5 1.1-.5h45.6c.4 0 .6.3.5.6l-.8 2.4c-.1.4-.5.6-.9.6L1 33.3zM25.3 42.5c-.4 0-.5-.3-.3-.6l1.4-2.5c.2-.3.6-.6 1-.6h20c.4 0 .6.3.6.7l-.2 2.4c0 .4-.4.7-.7.7l-21.8-.1z" fill="#00ACD7"/>
      <path d="M153.1 22.1c-6.3 1.6-10.6 2.8-16.8 4.4-1.5.4-1.6.5-2.9-1-1.5-1.7-2.6-2.8-4.7-3.8-6.3-3.1-12.4-2.2-18.1 1.5-6.8 4.4-10.3 10.9-10.2 19 .1 8 5.6 14.6 13.5 15.7 6.8.9 12.5-1.5 17-6.6.9-1.1 1.7-2.3 2.7-3.7h-19.3c-2.1 0-2.6-1.3-1.9-3 1.3-3.1 3.7-8.3 5.1-10.9.3-.6 1-1.6 2.5-1.6h36.4c-.2 2.7-.2 5.4-.6 8.1-1.1 7.2-3.8 13.8-8.2 19.6-7.2 9.5-16.6 15.4-28.5 17-9.8 1.3-18.9-.6-26.9-6.6-7.4-5.6-11.6-13-12.7-22.2-1.3-10.9 1.9-20.7 8.5-29.3C94.1 9.7 103.4 4 114.3 2.1c8.8-1.5 17.2-.4 24.8 4.7 5 3.1 8.6 7.5 11 13.1.6.9.2 1.4-1 1.7v.5z" fill="#00ACD7"/>
      <path d="M186.2 64.6c-9.1-.2-17.4-2.8-24.4-8.8-5.9-5.1-9.6-11.6-10.8-19.3-1.8-11.3 1.3-21.3 8.1-30.2 7.3-9.6 16.1-14.6 28-16.7 10.2-1.8 19.8-.8 28.5 5.1 7.9 5.4 12.8 12.7 14.1 22.3 1.7 13.5-2.2 24.5-11.5 33.9-6.6 6.7-14.7 10.9-24 12.8-2.7.5-5.4.6-8 .9zm23.8-40.4c-.1-1.3-.1-2.3-.3-3.3-1.8-9.9-10.9-15.5-20.4-13.3-9.3 2.1-15.3 8-17.5 17.4-1.8 7.8 2 15.7 9.2 19 5.9 2.6 11.8 2.2 17.4-.8 7.9-4.4 11.3-11.1 11.6-19z" fill="#00ACD7"/>
    </svg>
  ),
};

const ORBIT_URL = "https://your-orbit-domain.com";

const DOCS: TechDoc[] = [
  {
    id: "nextjs", name: "Next.js", color: "#fff", Logo: Logos.nextjs,
    steps: [
      { title: "Install NextAuth.js", code: `npm install next-auth`, lang: "bash" },
      { title: "Add Environment Variables", code: `NEXTAUTH_URL=https://your-app.com\nNEXTAUTH_SECRET=your_secret_here\nORBIT_CLIENT_ID=orbit_xxxxxxxxxx\nORBIT_CLIENT_SECRET=secret_xxxxxxxxxx`, lang: "bash" },
      { title: "Create NextAuth Config (app/api/auth/[...nextauth]/route.ts)", code: `import NextAuth from "next-auth";\n\nconst handler = NextAuth({\n  providers: [\n    {\n      id: "orbit",\n      name: "Orbit Station",\n      type: "oauth",\n      authorization: "${ORBIT_URL}/api/oauth/authorize",\n      token: "${ORBIT_URL}/api/oauth/token",\n      userinfo: "${ORBIT_URL}/api/oauth/userinfo",\n      clientId: process.env.ORBIT_CLIENT_ID,\n      clientSecret: process.env.ORBIT_CLIENT_SECRET,\n      profile(profile) {\n        return {\n          id: profile.sub,\n          name: profile.name,\n          email: profile.email,\n          image: profile.picture,\n        };\n      },\n    },\n  ],\n});\n\nexport { handler as GET, handler as POST };`, lang: "ts" },
      { title: "Add Login Button", code: `import { signIn } from "next-auth/react";\n\nexport default function Login() {\n  return (\n    <button onClick={() => signIn("orbit")}>\n      Login with Orbit Station\n    </button>\n  );\n}`, lang: "tsx" },
      { title: "Beacon URL for 1-Click SSO", note: "Use this URL as your Beacon target in Orbit Station:", code: `https://your-app.com/api/auth/signin/orbit`, lang: "bash" },
    ],
  },
  {
    id: "express", name: "Express.js", color: "#68d391", Logo: Logos.express,
    steps: [
      { title: "Install Dependencies", code: `npm install express express-session node-fetch dotenv`, lang: "bash" },
      { title: "Add Environment Variables (.env)", code: `PORT=3001\nAPP_URL=http://localhost:3001\nORBIT_URL=${ORBIT_URL}\nORBIT_CLIENT_ID=orbit_xxxxxxxxxx\nORBIT_CLIENT_SECRET=secret_xxxxxxxxxx\nSESSION_SECRET=your_session_secret`, lang: "bash" },
      { title: "Initiation Route (Pemantik SSO)", code: `// GET /auth/orbit/login\napp.get("/auth/orbit/login", (req, res) => {\n  const url = new URL(\`\${process.env.ORBIT_URL}/api/oauth/authorize\`);\n  url.searchParams.set("client_id", process.env.ORBIT_CLIENT_ID);\n  url.searchParams.set("redirect_uri", \`\${process.env.APP_URL}/auth/callback\`);\n  url.searchParams.set("response_type", "code");\n  res.redirect(302, url.toString());\n});`, lang: "js" },
      { title: "Callback Route (Token Exchange)", code: `app.get("/auth/callback", async (req, res) => {\n  const { code } = req.query;\n  const tokenRes = await fetch(\`\${process.env.ORBIT_URL}/api/oauth/token\`, {\n    method: "POST",\n    headers: { "Content-Type": "application/x-www-form-urlencoded" },\n    body: new URLSearchParams({\n      grant_type: "authorization_code",\n      code, client_id: process.env.ORBIT_CLIENT_ID,\n      client_secret: process.env.ORBIT_CLIENT_SECRET,\n      redirect_uri: \`\${process.env.APP_URL}/auth/callback\`,\n    }),\n  });\n  const { access_token } = await tokenRes.json();\n  const profile = await fetch(\`\${process.env.ORBIT_URL}/api/oauth/userinfo\`, {\n    headers: { Authorization: \`Bearer \${access_token}\` },\n  }).then(r => r.json());\n  req.session.user = profile;\n  res.redirect("/dashboard");\n});`, lang: "js" },
      { title: "Beacon URL for 1-Click SSO", note: "Use this URL as your Beacon target:", code: `http://localhost:3001/auth/orbit/login`, lang: "bash" },
    ],
  },
  {
    id: "laravel", name: "Laravel", color: "#fb923c", Logo: Logos.laravel,
    steps: [
      { title: "Install Socialite", code: `composer require laravel/socialite`, lang: "bash" },
      { title: "Add to config/services.php", code: `'orbit' => [\n  'client_id'     => env('ORBIT_CLIENT_ID'),\n  'client_secret' => env('ORBIT_CLIENT_SECRET'),\n  'redirect'      => env('ORBIT_REDIRECT_URI'),\n  'base_uri'      => env('ORBIT_URL'),\n],`, lang: "php" },
      { title: "Add Environment Variables (.env)", code: `ORBIT_URL=${ORBIT_URL}\nORBIT_CLIENT_ID=orbit_xxxxxxxxxx\nORBIT_CLIENT_SECRET=secret_xxxxxxxxxx\nORBIT_REDIRECT_URI=https://your-app.com/auth/orbit/callback`, lang: "bash" },
      { title: "Create Custom Socialite Provider (app/Providers/OrbitSocialite.php)", code: `<?php\nnamespace App\\Providers;\nuse Laravel\\Socialite\\Two\\AbstractProvider;\nuse Laravel\\Socialite\\Two\\User;\n\nclass OrbitSocialite extends AbstractProvider {\n  protected $scopes = [];\n  protected function getAuthUrl($state) {\n    return $this->buildAuthUrlFromBase(\n      config('services.orbit.base_uri') . '/api/oauth/authorize', $state\n    );\n  }\n  protected function getTokenUrl() {\n    return config('services.orbit.base_uri') . '/api/oauth/token';\n  }\n  protected function getUserByToken($token) {\n    $res = $this->getHttpClient()->get(\n      config('services.orbit.base_uri') . '/api/oauth/userinfo',\n      ['headers' => ['Authorization' => "Bearer {$token}"]]\n    );\n    return json_decode($res->getBody(), true);\n  }\n  protected function mapUserToObject(array $user) {\n    return (new User)->setRaw($user)->map([\n      'id' => $user['sub'], 'name' => $user['name'],\n      'email' => $user['email'], 'avatar' => $user['picture'] ?? null,\n    ]);\n  }\n}`, lang: "php" },
      { title: "Controller Routes (routes/web.php)", code: `Route::get('/auth/orbit', [AuthController::class, 'redirectToOrbit']);\nRoute::get('/auth/orbit/callback', [AuthController::class, 'handleOrbitCallback']);`, lang: "php" },
      { title: "Beacon URL for 1-Click SSO", note: "Use this URL as your Beacon target:", code: `https://your-app.com/auth/orbit`, lang: "bash" },
    ],
  },
  {
    id: "django", name: "Django", color: "#4ade80", Logo: Logos.django,
    steps: [
      { title: "Install Dependencies", code: `pip install requests django`, lang: "bash" },
      { title: "Add Environment Variables", code: `export ORBIT_URL="${ORBIT_URL}"\nexport ORBIT_CLIENT_ID="orbit_xxxxxxxxxx"\nexport ORBIT_CLIENT_SECRET="secret_xxxxxxxxxx"\nexport ORBIT_REDIRECT_URI="https://your-app.com/auth/orbit/callback"`, lang: "bash" },
      { title: "Initiation View (views.py)", code: `import os\nfrom django.shortcuts import redirect\nfrom urllib.parse import urlencode\n\ndef orbit_login(request):\n    params = urlencode({\n        "client_id": os.environ["ORBIT_CLIENT_ID"],\n        "redirect_uri": os.environ["ORBIT_REDIRECT_URI"],\n        "response_type": "code",\n    })\n    return redirect(f"{os.environ['ORBIT_URL']}/api/oauth/authorize?{params}")`, lang: "python" },
      { title: "Callback View (views.py)", code: `import requests\n\ndef orbit_callback(request):\n    code = request.GET.get("code")\n    token_res = requests.post(\n        f"{os.environ['ORBIT_URL']}/api/oauth/token",\n        data={\n            "grant_type": "authorization_code",\n            "code": code,\n            "client_id": os.environ["ORBIT_CLIENT_ID"],\n            "client_secret": os.environ["ORBIT_CLIENT_SECRET"],\n            "redirect_uri": os.environ["ORBIT_REDIRECT_URI"],\n        },\n    )\n    access_token = token_res.json()["access_token"]\n    profile = requests.get(\n        f"{os.environ['ORBIT_URL']}/api/oauth/userinfo",\n        headers={"Authorization": f"Bearer {access_token}"},\n    ).json()\n    request.session["user"] = profile\n    return redirect("/dashboard")`, lang: "python" },
      { title: "Register URLs (urls.py)", code: `from django.urls import path\nfrom . import views\n\nurlpatterns = [\n    path("auth/orbit/", views.orbit_login, name="orbit_login"),\n    path("auth/orbit/callback/", views.orbit_callback),\n]`, lang: "python" },
      { title: "Beacon URL for 1-Click SSO", note: "Use this URL as your Beacon target:", code: `https://your-app.com/auth/orbit/`, lang: "bash" },
    ],
  },
  {
    id: "fastapi", name: "FastAPI", color: "#06b6d4", Logo: Logos.fastapi,
    steps: [
      { title: "Install Dependencies", code: `pip install fastapi uvicorn httpx python-dotenv itsdangerous`, lang: "bash" },
      { title: "Add Environment Variables (.env)", code: `ORBIT_URL=${ORBIT_URL}\nORBIT_CLIENT_ID=orbit_xxxxxxxxxx\nORBIT_CLIENT_SECRET=secret_xxxxxxxxxx\nORBIT_REDIRECT_URI=https://your-app.com/auth/callback`, lang: "bash" },
      { title: "Initiation & Callback Routes (main.py)", code: `import os, httpx\nfrom fastapi import FastAPI\nfrom fastapi.responses import RedirectResponse\nfrom urllib.parse import urlencode\n\napp = FastAPI()\n\n@app.get("/auth/orbit/login")\nasync def orbit_login():\n    params = urlencode({\n        "client_id": os.environ["ORBIT_CLIENT_ID"],\n        "redirect_uri": os.environ["ORBIT_REDIRECT_URI"],\n        "response_type": "code",\n    })\n    return RedirectResponse(f"{os.environ['ORBIT_URL']}/api/oauth/authorize?{params}")\n\n@app.get("/auth/callback")\nasync def orbit_callback(code: str):\n    async with httpx.AsyncClient() as client:\n        token_res = await client.post(\n            f"{os.environ['ORBIT_URL']}/api/oauth/token",\n            data={\n                "grant_type": "authorization_code",\n                "code": code,\n                "client_id": os.environ["ORBIT_CLIENT_ID"],\n                "client_secret": os.environ["ORBIT_CLIENT_SECRET"],\n                "redirect_uri": os.environ["ORBIT_REDIRECT_URI"],\n            },\n        )\n        token = token_res.json()["access_token"]\n        profile = (await client.get(\n            f"{os.environ['ORBIT_URL']}/api/oauth/userinfo",\n            headers={"Authorization": f"Bearer {token}"},\n        )).json()\n    return {"user": profile}`, lang: "python" },
      { title: "Beacon URL for 1-Click SSO", note: "Use this URL as your Beacon target:", code: `https://your-app.com/auth/orbit/login`, lang: "bash" },
    ],
  },
  {
    id: "go", name: "Golang", color: "#38bdf8", Logo: Logos.go,
    steps: [
      { title: "Install Dependencies", code: `go mod init myapp\ngo get golang.org/x/oauth2`, lang: "bash" },
      { title: "Configure OAuth (main.go)", code: `package main\n\nimport (\n  "os"\n  "golang.org/x/oauth2"\n)\n\nvar orbitOAuthConfig = &oauth2.Config{\n  ClientID:     os.Getenv("ORBIT_CLIENT_ID"),\n  ClientSecret: os.Getenv("ORBIT_CLIENT_SECRET"),\n  RedirectURL:  os.Getenv("ORBIT_REDIRECT_URI"),\n  Endpoint: oauth2.Endpoint{\n    AuthURL:  os.Getenv("ORBIT_URL") + "/api/oauth/authorize",\n    TokenURL: os.Getenv("ORBIT_URL") + "/api/oauth/token",\n  },\n}`, lang: "go" },
      { title: "Initiation Handler (main.go)", code: `func orbitLoginHandler(w http.ResponseWriter, r *http.Request) {\n  url := orbitOAuthConfig.AuthCodeURL("random-state-string")\n  http.Redirect(w, r, url, http.StatusFound)\n}`, lang: "go" },
      { title: "Callback Handler (main.go)", code: `func orbitCallbackHandler(w http.ResponseWriter, r *http.Request) {\n  code := r.URL.Query().Get("code")\n  token, _ := orbitOAuthConfig.Exchange(r.Context(), code)\n  client := orbitOAuthConfig.Client(r.Context(), token)\n  resp, _ := client.Get(os.Getenv("ORBIT_URL") + "/api/oauth/userinfo")\n  defer resp.Body.Close()\n  var profile map[string]interface{}\n  json.NewDecoder(resp.Body).Decode(&profile)\n  // Save profile to session\n  fmt.Fprintf(w, "Welcome %v!", profile["name"])\n}`, lang: "go" },
      { title: "Register Routes (main.go)", code: `func main() {\n  http.HandleFunc("/auth/orbit/login", orbitLoginHandler)\n  http.HandleFunc("/auth/callback", orbitCallbackHandler)\n  http.ListenAndServe(":8080", nil)\n}`, lang: "go" },
      { title: "Beacon URL for 1-Click SSO", note: "Use this URL as your Beacon target:", code: `https://your-app.com/auth/orbit/login`, lang: "bash" },
    ],
  },
];

export default function DocsPage() {
  const [activeTech, setActiveTech] = useState<TechId>("nextjs");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const doc = DOCS.find(d => d.id === activeTech)!;

  function copyCode(code: string, idx: number) {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(160deg, #0a0514 0%, #030712 40%, #050d1a 70%, #030d14 100%)",
      backgroundAttachment: "fixed",
      fontFamily: "'Space Grotesk', system-ui, sans-serif",
      color: "#f0f4ff",
      position: "relative",
    }}>
      {/* Floating orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "60vw", height: "60vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,92,252,0.12) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "30%", right: "-15%", width: "50vw", height: "50vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "20%", width: "40vw", height: "40vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(91,63,222,0.09) 0%, transparent 70%)" }} />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
      {/* Top Nav */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "1rem 2rem", display: "flex", alignItems: "center", gap: "1rem", position: "sticky", top: 0, zIndex: 50, background: "rgba(3,7,18,0.85)", backdropFilter: "blur(16px)" }}>
        <a href="/settings" style={{ color: "#6b7db3", fontSize: "0.8rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.375rem" }}>
          ← Back to Settings
        </a>
        <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
        <span style={{ color: "#a78bfa", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          🔌 Orbit Station SSO
        </span>
        <span style={{ color: "#f0f4ff", fontWeight: 700, fontSize: "0.875rem" }}>Developer Documentation</span>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 800, margin: "0 0 0.75rem", background: "linear-gradient(135deg, #a78bfa, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            SSO Integration Guide
          </h1>
          <p style={{ color: "#6b7db3", fontSize: "1rem", margin: 0 }}>
            Integrate Orbit Station as a login provider in your app — step by step, from zero to 1-click Beacon login.
          </p>
        </div>

        {/* Prerequisites strip */}
        <div style={{ background: "rgba(124,92,252,0.08)", border: "1px solid rgba(124,92,252,0.2)", borderRadius: "14px", padding: "1.25rem 1.5rem", marginBottom: "2.5rem", display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          <div>
            <p style={{ color: "#a78bfa", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.375rem" }}>AUTHORIZE</p>
            <code style={{ color: "#f0f4ff", fontSize: "0.8rem", fontFamily: "monospace" }}>/api/oauth/authorize</code>
          </div>
          <div>
            <p style={{ color: "#a78bfa", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.375rem" }}>TOKEN</p>
            <code style={{ color: "#f0f4ff", fontSize: "0.8rem", fontFamily: "monospace" }}>/api/oauth/token</code>
          </div>
          <div>
            <p style={{ color: "#a78bfa", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.375rem" }}>USERINFO</p>
            <code style={{ color: "#f0f4ff", fontSize: "0.8rem", fontFamily: "monospace" }}>/api/oauth/userinfo</code>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
            <a href="/settings" style={{ color: "#a78bfa", fontSize: "0.8rem", textDecoration: "underline" }}>Register your app first →</a>
          </div>
        </div>

        {/* Tech Selector */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          {DOCS.map(tech => (
            <button
              key={tech.id}
              type="button"
              onClick={() => setActiveTech(tech.id)}
              style={{
                display: "flex", alignItems: "center", gap: "0.625rem",
                padding: "0.625rem 1.25rem", borderRadius: "12px", cursor: "pointer",
                fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 700,
                border: activeTech === tech.id ? `1.5px solid ${tech.color}` : "1.5px solid rgba(255,255,255,0.08)",
                background: activeTech === tech.id ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
                color: activeTech === tech.id ? tech.color : "#6b7db3",
                transition: "all 0.2s",
                backdropFilter: "blur(8px)",
                opacity: activeTech === tech.id ? 1 : 0.7,
              }}
            >
              <tech.Logo />
              {tech.name}
            </button>
          ))}
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {doc.steps.map((step, idx) => (
            <div key={idx} style={{ background: "rgba(17,24,39,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", overflow: "hidden" }}>
              {/* Step Header */}
              <div style={{ padding: "0.875rem 1.25rem", borderBottom: step.code ? "1px solid rgba(255,255,255,0.05)" : undefined, display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ background: "rgba(124,92,252,0.2)", border: "1px solid rgba(124,92,252,0.35)", borderRadius: "50%", width: "24px", height: "24px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800, color: "#a78bfa", flexShrink: 0 }}>
                  {idx + 1}
                </span>
                <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#e2e8f0" }}>{step.title}</span>
              </div>

              {step.note && (
                <div style={{ padding: "0.75rem 1.25rem", background: "rgba(34,211,238,0.05)", borderBottom: step.code ? "1px solid rgba(255,255,255,0.05)" : undefined }}>
                  <p style={{ margin: 0, color: "#22d3ee", fontSize: "0.8rem" }}>💡 {step.note}</p>
                </div>
              )}

              {step.code && (
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", top: "0.75rem", right: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {step.lang && (
                      <span style={{ color: "#4b5675", fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase" }}>{step.lang}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => copyCode(step.code!, idx)}
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: copiedIdx === idx ? "#4ade80" : "#6b7db3", fontSize: "0.7rem", padding: "3px 10px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}
                    >
                      {copiedIdx === idx ? "✓ Copied!" : "Copy"}
                    </button>
                  </div>
                  <pre style={{ margin: 0, padding: "1.25rem", overflowX: "auto", fontSize: "0.825rem", lineHeight: 1.7, fontFamily: "'Fira Code', 'Cascadia Code', monospace", background: "rgba(0,0,0,0.35)" }}>
                    <code dangerouslySetInnerHTML={{ __html: highlight(step.code, step.lang ?? "ts") }} />
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Beacon callout */}
        <div style={{ marginTop: "2.5rem", background: "linear-gradient(135deg, rgba(124,92,252,0.12), rgba(34,211,238,0.06))", border: "1px solid rgba(124,92,252,0.3)", borderRadius: "16px", padding: "1.75rem" }}>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 700 }}>🚀 How Beacon 1-Click Login Works</h3>
          <p style={{ margin: 0, color: "#6b7db3", fontSize: "0.875rem", lineHeight: 1.7 }}>
            After your integration is live, any Orbit Station user can add a Beacon pointing to your <strong style={{ color: "#a78bfa" }}>Initiation URL</strong>. On first click they&apos;ll see the consent screen. On all subsequent clicks, <strong style={{ color: "#22d3ee" }}>they&apos;ll be logged in instantly</strong> thanks to the <em>Remember Consent</em> system — no button presses, no waiting.
          </p>
        </div>

        <p style={{ textAlign: "center", color: "#1e2d45", fontSize: "0.75rem", marginTop: "3rem" }}>
          Orbit Station OAuth 2.0 · Standard Authorization Code Flow
        </p>
      </div>
      </div>
    </div>
  );
}

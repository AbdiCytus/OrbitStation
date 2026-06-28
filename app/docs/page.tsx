"use client";
import { useState } from "react";

type TechId = "nextjs" | "express" | "laravel" | "django" | "fastapi" | "go";
type Step = { title: string; code?: string; lang?: string; note?: string };
type TechDoc = { id: TechId; name: string; color: string; Logo: () => React.ReactElement; steps: Step[] };


// ── Placeholder-based syntax highlighter (avoids re-highlighting spans) ──
function highlight(raw: string, lang: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const ph: string[] = [];
  const save = (html: string) => { const k = `__ph${ph.length}__`; ph.push(html); return k; };
  const restore = (s: string) => {
    let prev = "";
    while (s !== prev) {
      prev = s;
      s = s.replace(/__ph(\d+)__/g, (_, i) => ph[Number(i)]);
    }
    return s;
  };

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

const ORBIT_URL = "https://orbit-station-domain.com";

const DOCS: TechDoc[] = [
  {
    id: "nextjs", name: "Next.js", color: "#fff", Logo: () => <img src="/nextjs.webp" alt="Next.js" style={{ width: "20px", height: "20px", objectFit: "contain" }} />,
    steps: [
      { title: "Install NextAuth.js", code: `npm install next-auth`, lang: "bash" },
      { title: "Add Environment Variables (.env)", note: "NextAuth automatically derives the redirect URI from NEXTAUTH_URL.", code: `NEXTAUTH_SECRET=your_super_secret_string\nORBIT_URL=${ORBIT_URL}\nORBIT_CLIENT_ID=orbit_xxxxxxxxxx\nORBIT_CLIENT_SECRET=secret_xxxxxxxxxx\n\n# --- LOCAL DEVELOPMENT ---\nNEXTAUTH_URL=http://localhost:3000\n\n# --- PRODUCTION ---\n# NEXTAUTH_URL=https://yourdomain.com`, lang: "bash" },
      { title: "Create NextAuth Config (app/api/auth/[...nextauth]/route.ts)", code: `import NextAuth from "next-auth";\n\nconst handler = NextAuth({\n  providers: [\n    {\n      id: "orbit",\n      name: "Orbit Station",\n      type: "oauth",\n      authorization: {\n        url: \`\${process.env.ORBIT_URL}/api/oauth/authorize\`,\n        params: { scope: "profile email" },\n      },\n      token: \`\${process.env.ORBIT_URL}/api/oauth/token\`,\n      userinfo: \`\${process.env.ORBIT_URL}/api/oauth/userinfo\`,\n      clientId: process.env.ORBIT_CLIENT_ID,\n      clientSecret: process.env.ORBIT_CLIENT_SECRET,\n      client: {\n        token_endpoint_auth_method: "client_secret_post",\n      },\n      profile(profile) {\n        return {\n          id: profile.sub,\n          name: profile.name,\n          email: profile.email,\n          image: profile.picture,\n        };\n      },\n    },\n  ],\n  cookies: {\n    sessionToken: {\n      name: \`client_app.session-token\`,\n      options: {\n        httpOnly: true,\n        sameSite: "lax",\n        path: "/",\n        secure: process.env.NODE_ENV === "production",\n      },\n    },\n  },\n});\n\nexport { handler as GET, handler as POST };`, lang: "ts" },
      { title: "Create Manual Login Button (app/components/LoginButton.tsx)", note: "Must be a Client Component because of the onClick handler.", code: `"use client";\n\nimport { signIn } from "next-auth/react";\n\nexport default function LoginButton() {\n  return (\n    <button onClick={() => signIn("orbit", { callbackUrl: "/dashboard" })}>\n      Sign in with Orbit Station\n    </button>\n  );\n}`, lang: "tsx" },
      { title: "Create 1-Click SSO Bypass Route (app/orbit/page.tsx)", note: "This page automatically logs the user in when accessed via Orbit Station Beacon.", code: `"use client";\n\nimport { useEffect } from "react";\nimport { signIn } from "next-auth/react";\n\nexport default function OrbitSSOHandler() {\n  useEffect(() => {\n    // Automatically trigger NextAuth login in the background\n    signIn("orbit", { callbackUrl: "/dashboard" });\n  }, []);\n\n  return (\n    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#030712", color: "#a78bfa" }}>\n      <p style={{ fontFamily: "monospace", fontSize: "1.2rem" }}>\n        🚀 Preparing launch to Orbit Station...\n      </p>\n    </div>\n  );\n}`, lang: "tsx" },
      { title: "Run Development Server", note: "Next.js defaults to port 3000.", code: `npm run dev`, lang: "bash" },
      { title: "Beacon URL for 1-Click SSO", note: "Ensure this EXACT URL is in Orbit Station Settings as Beacon target:", code: `http://localhost:3000/orbit`, lang: "bash" },
    ],
  },
  {
    id: "express", name: "Express.js", color: "#68d391", Logo: () => <img src="/express.webp" alt="Express.js" style={{ width: "20px", height: "20px", objectFit: "contain", background: "white", borderRadius: "50%" }} />,
    steps: [
      { title: "Install Dependencies", note: "Requires Node.js v18+ for native fetch API.", code: `npm install express express-session dotenv`, lang: "bash" },
      { title: "Add Environment Variables (.env)", code: `PORT=3000\nSESSION_SECRET=your_session_secret\nORBIT_URL=${ORBIT_URL}\nORBIT_CLIENT_ID=orbit_xxxxxxxxxx\nORBIT_CLIENT_SECRET=secret_xxxxxxxxxx\n\n# --- LOCAL DEVELOPMENT ---\nORBIT_REDIRECT_URI=http://localhost:3000/auth/callback\n\n# --- PRODUCTION ---\n# ORBIT_REDIRECT_URI=https://yourdomain.com/auth/callback`, lang: "bash" },
      { title: "Setup Server & Middleware (index.js)", code: `const express = require("express");\nconst session = require("express-session");\nrequire("dotenv").config();\n\nconst app = express();\n\n// Required to enable req.session\napp.use(session({\n  secret: process.env.SESSION_SECRET,\n  resave: false,\n  saveUninitialized: true\n}));`, lang: "js" },
      { title: "Initiation Route", code: `app.get("/auth/orbit/login", (req, res) => {\n  const url = new URL(\`\${process.env.ORBIT_URL}/api/oauth/authorize\`);\n  url.searchParams.set("client_id", process.env.ORBIT_CLIENT_ID);\n  url.searchParams.set("redirect_uri", process.env.ORBIT_REDIRECT_URI);\n  url.searchParams.set("response_type", "code");\n  res.redirect(302, url.toString());\n});`, lang: "js" },
      { title: "Callback Route (Token Exchange)", code: `app.get("/auth/callback", async (req, res) => {\n  const { code } = req.query;\n  const tokenRes = await fetch(\`\${process.env.ORBIT_URL}/api/oauth/token\`, {\n    method: "POST",\n    headers: { "Content-Type": "application/x-www-form-urlencoded" },\n    body: new URLSearchParams({\n      grant_type: "authorization_code",\n      code, \n      client_id: process.env.ORBIT_CLIENT_ID,\n      client_secret: process.env.ORBIT_CLIENT_SECRET,\n      redirect_uri: process.env.ORBIT_REDIRECT_URI,\n    }),\n  });\n  const { access_token } = await tokenRes.json();\n  const profile = await fetch(\`\${process.env.ORBIT_URL}/api/oauth/userinfo\`, {\n    headers: { Authorization: \`Bearer \${access_token}\` },\n  }).then(r => r.json());\n\n  req.session.user = profile;\n  res.redirect("/dashboard");\n});\n\napp.listen(process.env.PORT || 3000, () => console.log("Server running"));`, lang: "js" },
      { title: "Start Express Server", note: "Runs the application on port 3000.", code: `node index.js`, lang: "bash" },
      { title: "Beacon URL for 1-Click SSO", note: "Use this URL as your Beacon target:", code: `http://localhost:3000/auth/orbit/login`, lang: "bash" },
    ],
  },
  {
    id: "laravel", name: "Laravel", color: "#fb923c", Logo: () => <img src="/laravel.webp" alt="Laravel" style={{ width: "20px", height: "20px", objectFit: "contain" }} />,
    steps: [
      { title: "Install Socialite", code: `composer require laravel/socialite`, lang: "bash" },
      { title: "Add Environment Variables (.env)", code: `ORBIT_URL=${ORBIT_URL}\nORBIT_CLIENT_ID=orbit_xxxxxxxxxx\nORBIT_CLIENT_SECRET=secret_xxxxxxxxxx\n\n# --- LOCAL DEVELOPMENT ---\nORBIT_REDIRECT_URI=http://127.0.0.1:8000/auth/orbit/callback\n\n# --- PRODUCTION ---\n# ORBIT_REDIRECT_URI=https://yourdomain.com/auth/orbit/callback`, lang: "bash" },
      { title: "Add to config/services.php", code: `'orbit' => [\n  'client_id'     => env('ORBIT_CLIENT_ID'),\n  'client_secret' => env('ORBIT_CLIENT_SECRET'),\n  'redirect'      => env('ORBIT_REDIRECT_URI'),\n  'base_uri'      => env('ORBIT_URL'),\n],`, lang: "php" },
      { title: "Create Custom Socialite Provider (app/Providers/OrbitSocialite.php)", code: `<?php\nnamespace App\\Providers;\nuse Laravel\\Socialite\\Two\\AbstractProvider;\nuse Laravel\\Socialite\\Two\\User;\n\nclass OrbitSocialite extends AbstractProvider {\n  protected $scopes = [];\n  protected function getAuthUrl($state) {\n    return $this->buildAuthUrlFromBase(\n      config('services.orbit.base_uri') . '/api/oauth/authorize', $state\n    );\n  }\n  protected function getTokenUrl() {\n    return config('services.orbit.base_uri') . '/api/oauth/token';\n  }\n  protected function getUserByToken($token) {\n    $res = $this->getHttpClient()->get(\n      config('services.orbit.base_uri') . '/api/oauth/userinfo',\n      ['headers' => ['Authorization' => "Bearer {$token}"]]\n    );\n    return json_decode($res->getBody(), true);\n  }\n  protected function mapUserToObject(array $user) {\n    return (new User)->setRaw($user)->map([\n      'id' => $user['sub'] ?? null,\n      'name' => $user['name'] ?? null,\n      'email' => $user['email'] ?? null,\n      'avatar' => $user['picture'] ?? null,\n    ]);\n  }\n}`, lang: "php" },
      { title: "Register Driver (app/Providers/AppServiceProvider.php)", code: `<?php\nnamespace App\\Providers;\n\nuse Illuminate\\Support\\ServiceProvider;\nuse Laravel\\Socialite\\Facades\\Socialite;\nuse App\\Providers\\OrbitSocialite;\n\nclass AppServiceProvider extends ServiceProvider\n{\n    public function register(): void {}\n\n    public function boot(): void\n    {\n        Socialite::extend('orbit', function ($app) {\n            $config = $app['config']['services.orbit'];\n            return Socialite::buildProvider(OrbitSocialite::class, $config);\n        });\n    }\n}`, lang: "php" },
      { title: "Create AuthController (app/Http/Controllers/AuthController.php)", code: `<?php\nnamespace App\\Http\\Controllers;\n\nuse Illuminate\\Http\\Request;\nuse Laravel\\Socialite\\Facades\\Socialite;\n\nclass AuthController extends Controller\n{\n    public function redirectToOrbit()\n    {\n        return Socialite::driver('orbit')->redirect();\n    }\n\n    public function handleOrbitCallback()\n    {\n        try {\n            $orbitUser = Socialite::driver('orbit')->user();\n            dd([\n                'id' => $orbitUser->getId(),\n                'name' => $orbitUser->getName(),\n                'email' => $orbitUser->getEmail(),\n                'avatar' => $orbitUser->getAvatar(),\n                'token' => $orbitUser->token\n            ]);\n        } catch (\\Exception $e) {\n            return response()->json(['error' => 'Authentication Failed: ' . $e->getMessage()], 500);\n        }\n    }\n}`, lang: "php" },
      { title: "Controller Routes (routes/web.php)", code: `use App\\Http\\Controllers\\AuthController;\n\nRoute::get('/auth/orbit', [AuthController::class, 'redirectToOrbit']);\nRoute::get('/auth/orbit/callback', [AuthController::class, 'handleOrbitCallback']);`, lang: "php" },
      { title: "Start Development Server", note: "Artisan automatically uses 127.0.0.1:8000.", code: `php artisan serve`, lang: "bash" },
      { title: "Beacon URL for 1-Click SSO", note: "Use this URL as your Beacon target:", code: `http://127.0.0.1:8000/auth/orbit`, lang: "bash" },
    ],
  },
  {
    id: "django", name: "Django", color: "#4ade80", Logo: () => <img src="/django.webp" alt="Django" style={{ width: "20px", height: "20px", objectFit: "contain" }} />,
    steps: [
      { title: "Install Dependencies", code: `pip install django requests python-dotenv`, lang: "bash" },
      { title: "Add Environment Variables (.env)", code: `ORBIT_URL=${ORBIT_URL}\nORBIT_CLIENT_ID=orbit_xxxxxxxxxx\nORBIT_CLIENT_SECRET=secret_xxxxxxxxxx\n\n# --- LOCAL DEVELOPMENT ---\nORBIT_REDIRECT_URI=http://127.0.0.1:8000/auth/orbit/callback\n\n# --- PRODUCTION ---\n# ORBIT_REDIRECT_URI=https://yourdomain.com/auth/orbit/callback`, lang: "bash" },
      { title: "Configure Settings (core/settings.py)", code: `import os\nfrom dotenv import load_dotenv\n\nload_dotenv()\n\n# Add 'sso_client' to INSTALLED_APPS\nINSTALLED_APPS = [\n    ...,\n    'sso_client',\n]`, lang: "python" },
      { title: "Initiation View (sso_client/views.py)", code: `import os, requests\nfrom django.shortcuts import redirect\nfrom urllib.parse import urlencode\n\ndef orbit_login(request):\n    params = urlencode({\n        "client_id": os.environ["ORBIT_CLIENT_ID"],\n        "redirect_uri": os.environ["ORBIT_REDIRECT_URI"],\n        "response_type": "code",\n    })\n    return redirect(f"{os.environ['ORBIT_URL']}/api/oauth/authorize?{params}")`, lang: "python" },
      { title: "Callback View (sso_client/views.py)", code: `def orbit_callback(request):\n    code = request.GET.get("code")\n    token_res = requests.post(\n        f"{os.environ['ORBIT_URL']}/api/oauth/token",\n        data={\n            "grant_type": "authorization_code",\n            "code": code,\n            "client_id": os.environ["ORBIT_CLIENT_ID"],\n            "client_secret": os.environ["ORBIT_CLIENT_SECRET"],\n            "redirect_uri": os.environ["ORBIT_REDIRECT_URI"],\n        },\n    )\n    access_token = token_res.json()["access_token"]\n    profile = requests.get(\n        f"{os.environ['ORBIT_URL']}/api/oauth/userinfo",\n        headers={"Authorization": f"Bearer {access_token}"},\n    ).json()\n    \n    request.session["user"] = profile\n    return redirect("/dashboard")`, lang: "python" },
      { title: "Register URLs (core/urls.py)", code: `from django.urls import path\nfrom sso_client import views\n\nurlpatterns = [\n    path("auth/orbit/", views.orbit_login),\n    path("auth/orbit/callback", views.orbit_callback),\n    # Add your dashboard route here\n]`, lang: "python" },
      { title: "Migrate DB & Run Server", note: "Django requires database tables to store user sessions and runs on 127.0.0.1:8000 by default.", code: `python manage.py migrate\npython manage.py runserver`, lang: "bash" },
      { title: "Beacon URL for 1-Click SSO", note: "Use this exact initiation URL as your Beacon target:", code: `http://127.0.0.1:8000/auth/orbit/`, lang: "bash" },
    ],
  },
  {
    id: "fastapi", name: "FastAPI", color: "#06b6d4", Logo: () => <img src="/fastapi.webp" alt="FastAPI" style={{ width: "20px", height: "20px", objectFit: "contain" }} />,
    steps: [
      { title: "Install Dependencies", code: `pip install fastapi uvicorn httpx python-dotenv`, lang: "bash" },
      { title: "Add Environment Variables (.env)", code: `ORBIT_URL=${ORBIT_URL}\nORBIT_CLIENT_ID=orbit_xxxxxxxxxx\nORBIT_CLIENT_SECRET=secret_xxxxxxxxxx\n\n# --- LOCAL DEVELOPMENT ---\nORBIT_REDIRECT_URI=http://127.0.0.1:8000/auth/callback\n\n# --- PRODUCTION ---\n# ORBIT_REDIRECT_URI=https://yourdomain.com/auth/callback`, lang: "bash" },
      { title: "Setup App & Session Middleware (main.py)", note: "FastAPI is stateless, so we must add SessionMiddleware to persist user data.", code: `import os, httpx\nfrom fastapi import FastAPI, Request\nfrom fastapi.responses import RedirectResponse\nfrom starlette.middleware.sessions import SessionMiddleware\nfrom dotenv import load_dotenv\n\nload_dotenv()\n\napp = FastAPI()\n# Required to persist user session across requests\napp.add_middleware(SessionMiddleware, secret_key="super-secret-key")`, lang: "python" },
      { title: "Initiation Route", code: `@app.get("/auth/orbit/login")\nasync def orbit_login():\n    from urllib.parse import urlencode\n    params = urlencode({\n        "client_id": os.environ["ORBIT_CLIENT_ID"],\n        "redirect_uri": os.environ["ORBIT_REDIRECT_URI"],\n        "response_type": "code",\n    })\n    return RedirectResponse(f"{os.environ['ORBIT_URL']}/api/oauth/authorize?{params}")`, lang: "python" },
      { title: "Callback Route (Token Exchange)", code: `@app.get("/auth/callback")\nasync def orbit_callback(request: Request, code: str):\n    async with httpx.AsyncClient() as client:\n        token_res = await client.post(\n            f"{os.environ['ORBIT_URL']}/api/oauth/token",\n            data={\n                "grant_type": "authorization_code",\n                "code": code,\n                "client_id": os.environ["ORBIT_CLIENT_ID"],\n                "client_secret": os.environ["ORBIT_CLIENT_SECRET"],\n                "redirect_uri": os.environ["ORBIT_REDIRECT_URI"],\n            },\n        )\n        token = token_res.json()["access_token"]\n        profile = (await client.get(\n            f"{os.environ['ORBIT_URL']}/api/oauth/userinfo",\n            headers={"Authorization": f"Bearer {token}"},\n        )).json()\n\n    request.session["user"] = profile\n    return {"status": "success", "user": profile}`, lang: "python" },
      { title: "Start FastAPI Server", note: "Uvicorn implicitly binds to port 8000 by default.", code: `uvicorn main:app --reload`, lang: "bash" },
      { title: "Beacon URL for 1-Click SSO", note: "Use this URL as your Beacon target:", code: `http://127.0.0.1:8000/auth/orbit/login`, lang: "bash" },
    ],
  },
  {
    id: "go", name: "Golang", color: "#38bdf8", Logo: () => <img src="/golang.webp" alt="Golang" style={{ width: "32px", height: "20px", objectFit: "contain" }} />,
    steps: [
      { title: "Install Dependencies", code: `go mod init myapp\ngo get golang.org/x/oauth2 github.com/joho/godotenv`, lang: "bash" },
      { title: "Add Environment Variables (.env)", code: `ORBIT_URL=${ORBIT_URL}\nORBIT_CLIENT_ID=orbit_xxxxxxxxxx\nORBIT_CLIENT_SECRET=secret_xxxxxxxxxx\n\n# --- LOCAL DEVELOPMENT ---\nORBIT_REDIRECT_URI=http://localhost:8080/auth/callback\n\n# --- PRODUCTION ---\n# ORBIT_REDIRECT_URI=https://yourdomain.com/auth/callback`, lang: "bash" },
      { title: "Configure OAuth & Setup Env (main.go)", note: "We use godotenv to load the .env file securely.", code: `package main\n\nimport (\n  "encoding/json"\n  "fmt"\n  "net/http"\n  "os"\n  "log"\n  "golang.org/x/oauth2"\n  "github.com/joho/godotenv"\n)\n\nvar orbitOAuthConfig *oauth2.Config\n\nfunc init() {\n  if err := godotenv.Load(); err != nil {\n    log.Println("No .env file found")\n  }\n  orbitOAuthConfig = &oauth2.Config{\n    ClientID:     os.Getenv("ORBIT_CLIENT_ID"),\n    ClientSecret: os.Getenv("ORBIT_CLIENT_SECRET"),\n    RedirectURL:  os.Getenv("ORBIT_REDIRECT_URI"),\n    Endpoint: oauth2.Endpoint{\n      AuthURL:  os.Getenv("ORBIT_URL") + "/api/oauth/authorize",\n      TokenURL: os.Getenv("ORBIT_URL") + "/api/oauth/token",\n    },\n  }\n}`, lang: "go" },
      { title: "Initiation Handler", code: `func orbitLoginHandler(w http.ResponseWriter, r *http.Request) {\n  url := orbitOAuthConfig.AuthCodeURL("random-state-string")\n  http.Redirect(w, r, url, http.StatusFound)\n}`, lang: "go" },
      { title: "Callback Handler", code: `func orbitCallbackHandler(w http.ResponseWriter, r *http.Request) {\n  code := r.URL.Query().Get("code")\n  token, _ := orbitOAuthConfig.Exchange(r.Context(), code)\n  client := orbitOAuthConfig.Client(r.Context(), token)\n  resp, _ := client.Get(os.Getenv("ORBIT_URL") + "/api/oauth/userinfo")\n  defer resp.Body.Close()\n  \n  var profile map[string]interface{}\n  json.NewDecoder(resp.Body).Decode(&profile)\n  fmt.Fprintf(w, "SSO Connection Successful! Welcome %v!", profile["name"])\n}`, lang: "go" },
      { title: "Register Routes", code: `func main() {\n  http.HandleFunc("/auth/orbit/login", orbitLoginHandler)\n  http.HandleFunc("/auth/callback", orbitCallbackHandler)\n  fmt.Println("Server running on :8080")\n  http.ListenAndServe(":8080", nil)\n}`, lang: "go" },
      { title: "Start Golang Server", note: "Compile and run the application.", code: `go run main.go`, lang: "bash" },
      { title: "Beacon URL for 1-Click SSO", note: "Use this URL as your Beacon target:", code: `http://localhost:8080/auth/orbit/login`, lang: "bash" },
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
    <div className="login-page relative min-h-[100dvh] flex flex-col font-['Space_Grotesk',system-ui,sans-serif] text-[#f0f4ff]">
      {/* Premium Cosmic Background from Login */}
      <div className="cosmic-bg fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div className="cosmic-stars"></div>
        <div className="cosmic-aurora" style={{ opacity: 0.6, transform: "scale(1.2)" }}></div>
        <div className="cosmic-comet"></div>
        <div className="cosmic-dust"></div>
      </div>

      <div style={{ position: "relative", zIndex: 1, flex: 1 }}>
        {/* Top Nav */}
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "1rem 2rem", display: "flex", alignItems: "center", gap: "1rem", position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(3,7,18,0.85)", backdropFilter: "blur(16px)" }}>
          <a href="/settings" style={{ color: "#6b7db3", fontSize: "0.8rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.375rem" }}>
            ← Back to Settings
          </a>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
          <span style={{ color: "#a78bfa", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            🔌 Orbit Station SSO
          </span>
          <span style={{ color: "#f0f4ff", fontWeight: 700, fontSize: "0.875rem" }}>Developer Documentation</span>
        </div>

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "6rem 1.5rem 2rem" }}>
          {/* Hero */}
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h1 style={{ fontSize: "2.25rem", fontWeight: 800, margin: "0 0 0.75rem", background: "linear-gradient(135deg, #a78bfa, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              SSO Integration Guide
            </h1>
            <p style={{ color: "#6b7db3", fontSize: "1rem", margin: 0 }}>
              Integrate Orbit Station as a login provider in your app — step by step, from zero to 1-click Beacon login.
            </p>
          </div>

          {/* NEW: Step 0 - App Registration & Redirect URI Info */}
          <div style={{ background: "linear-gradient(to right, rgba(17,24,39,0.8), rgba(34,211,238,0.05))", border: "1px solid rgba(34,211,238,0.2)", borderRadius: "16px", padding: "1.75rem", marginBottom: "2rem" }}>
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem", fontWeight: 700, color: "#22d3ee", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>⚙️</span> Step 0: Register App & Setup Redirect URI
            </h3>
            <p style={{ margin: "0 0 1rem", color: "#e2e8f0", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Before writing code, register your application in the <a href="/settings" style={{ color: "#a78bfa", fontWeight: 600, textDecoration: "none", borderBottom: "1px dashed #a78bfa" }}>Settings</a> menu to get your <code style={{ color: "#fff", background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px" }}>Client ID</code> and <code style={{ color: "#fff", background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px" }}>Client Secret</code>. You will also be asked to fill in a <strong>Redirect URI</strong>.
            </p>
            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "8px", padding: "1.25rem", borderLeft: "3px solid #a78bfa" }}>
              <p style={{ margin: "0 0 0.5rem", color: "#a78bfa", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.05em" }}>WHAT IS A REDIRECT URI?</p>
              <p style={{ margin: "0 0 1rem", color: "#9ca3af", fontSize: "0.85rem", lineHeight: 1.6 }}>
                It is the exact endpoint in your application where Orbit Station will send the user back after a successful login. It <strong>must exactly match</strong> the callback route in your code. The URL changes depending on your deployment stage:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                {/* Local Development Column */}
                <div style={{ background: "rgba(34,211,238,0.03)", padding: "1rem", borderRadius: "8px", border: "1px dashed rgba(34,211,238,0.3)" }}>
                  <h4 style={{ color: "#22d3ee", margin: "0 0 0.75rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    💻 Local Development (Default Ports)
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.75rem", color: "#cbd5e1" }}>
                    <div><strong style={{ color: "#fff" }}>Next.js:</strong> <br /><code style={{ color: "#a3e635" }}>http://localhost:3000/api/auth/callback/orbit</code></div>
                    <div><strong style={{ color: "#fff" }}>Laravel / Django:</strong> <br /><code style={{ color: "#fb923c" }}>http://127.0.0.1:8000/auth/orbit/callback</code></div>
                    <div><strong style={{ color: "#fff" }}>Express:</strong> <br /><code style={{ color: "#68d391" }}>http://localhost:3000/auth/callback</code></div>
                    <div><strong style={{ color: "#fff" }}>FastAPI:</strong> <br /><code style={{ color: "#06b6d4" }}>http://127.0.0.1:8000/auth/callback</code></div>
                    <div><strong style={{ color: "#fff" }}>Golang:</strong> <br /><code style={{ color: "#38bdf8" }}>http://localhost:8080/auth/callback</code></div>
                  </div>
                </div>

                {/* Production Column */}
                <div style={{ background: "rgba(167,139,250,0.03)", padding: "1rem", borderRadius: "8px", border: "1px dashed rgba(167,139,250,0.3)" }}>
                  <h4 style={{ color: "#a78bfa", margin: "0 0 0.75rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    🌍 Production
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.75rem", color: "#cbd5e1" }}>
                    <div><strong style={{ color: "#fff" }}>Next.js:</strong> <br /><code style={{ color: "#a3e635" }}>https://yourdomain.com/api/auth/callback/orbit</code></div>
                    <div><strong style={{ color: "#fff" }}>Laravel / Django:</strong> <br /><code style={{ color: "#fb923c" }}>https://yourdomain.com/auth/orbit/callback</code></div>
                    <div><strong style={{ color: "#fff" }}>Express / FastAPI / Go:</strong> <br /><code style={{ color: "#38bdf8" }}>https://yourdomain.com/auth/callback</code></div>
                  </div>
                </div>
              </div>

              <p style={{ margin: "1rem 0 0", color: "#fbbf24", fontSize: "0.8rem", fontStyle: "italic" }}>
                ⚠️ <strong>Important:</strong> When moving to production, you must update the Redirect URI in your Orbit Station settings and use <strong>https://</strong>.
              </p>
            </div>
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

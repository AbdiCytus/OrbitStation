"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LinkIcon, KeyIcon, RocketLaunchIcon } from "@heroicons/react/20/solid";

type AuthMode = "oauth" | "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("oauth");
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleOAuth(provider: "github" | "google") {
    setLoadingProvider(provider);
    await signIn(provider, { callbackUrl: "/station" });
  }

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/station");
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        setLoading(false);
        return;
      }
      // Auto-login after register
      const result = await signIn("credentials", { email, password, redirect: false });
      setLoading(false);
      if (result?.error) {
        setMode("login");
        setError("Account created! Please sign in.");
      } else {
        router.push("/station");
      }
    } catch {
      setLoading(false);
      setError("Network error. Please try again.");
    }
  }

  return (
    <main className="login-page">
      {/* Starfield background */}
      <div className="starfield" aria-hidden="true">
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} className="star" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 4}s`,
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
          }} />
        ))}
      </div>

      <div className="login-card glass">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">⊕</div>
          <h1 className="text-gradient">Orbit Station</h1>
          <p className="login-subtitle">Your personal web portal in the stars</p>
        </div>

        <hr className="divider" />

        {/* Mode tabs */}
        <div className="login-tab-row">
          <button
            className={`login-tab ${mode === "oauth" ? "active" : ""}`}
            onClick={() => { setMode("oauth"); setError(null); }}
          >
            <LinkIcon width={16} height={16} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: "4px" }} /> OAuth
          </button>
          <button
            className={`login-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setError(null); }}
          >
            <KeyIcon width={16} height={16} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: "4px" }} /> Sign In
          </button>
          <button
            className={`login-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => { setMode("register"); setError(null); }}
          >
            <RocketLaunchIcon width={16} height={16} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: "4px" }} /> Register
          </button>
        </div>

        {/* Error */}
        {error && <p className="login-form-error">{error}</p>}

        {/* OAuth mode */}
        {mode === "oauth" && (
          <div className="login-actions">
            <button
              id="btn-signin-github"
              className="btn btn-secondary btn-lg login-provider-btn"
              onClick={() => handleOAuth("github")}
              disabled={loadingProvider !== null}
            >
              {loadingProvider === "github" ? <span className="spinner" /> : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              )}
              Continue with GitHub
            </button>

            <button
              id="btn-signin-google"
              className="btn btn-secondary btn-lg login-provider-btn"
              onClick={() => handleOAuth("google")}
              disabled={loadingProvider !== null}
            >
              {loadingProvider === "google" ? <span className="spinner" /> : (
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continue with Google
            </button>
          </div>
        )}

        {/* Sign In form */}
        {mode === "login" && (
          <form onSubmit={handleCredentialsLogin} className="login-actions" style={{ gap: "0.75rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <button
              id="btn-signin-credentials"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : "Sign In"}
            </button>
            <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#6b7db3" }}>
              No account?{" "}
              <button type="button" className="btn-text" onClick={() => setMode("register")} style={{ color: "#a78bfa" }}>
                Register here →
              </button>
            </p>
          </form>
        )}

        {/* Register form */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="login-actions" style={{ gap: "0.75rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Display Name</label>
              <input
                id="reg-name"
                className="input"
                type="text"
                placeholder="Your callsign"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password <span className="optional">(min 8 chars)</span></label>
              <input
                id="reg-password"
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <button
              id="btn-register"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : "Create Account"}
            </button>
            <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#6b7db3" }}>
              Already have an account?{" "}
              <button type="button" className="btn-text" onClick={() => setMode("login")} style={{ color: "#a78bfa" }}>
                Sign in →
              </button>
            </p>
          </form>
        )}

        <p className="login-terms">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  );
}

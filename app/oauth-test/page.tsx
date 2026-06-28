"use client";

import { useState, useEffect } from "react";

export default function OAuthTestPage() {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Ambil parameter dari URL saat halaman dimuat
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get("client_id");
    if (id) {
      setClientId(id);
    }
  }, []);

  async function handleStart() {
    if (!clientId.trim() || !clientSecret.trim()) {
      setError("Both Client ID and Client Secret are required.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/oauth/test-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: clientId.trim(), clientSecret: clientSecret.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.redirectUrl) {
        setError(data.error ?? "Failed to start OAuth flow.");
        setLoading(false);
        return;
      }
      // Redirect to consent screen
      window.location.href = data.redirectUrl;
    } catch {
      setError("Network error. Make sure the dev server is running.");
      setLoading(false);
    }
  }

  const cardStyle: React.CSSProperties = {
    background: "rgba(17,24,39,0.85)",
    border: "1px solid rgba(124,92,252,0.2)",
    borderRadius: "20px",
    backdropFilter: "blur(24px)",
    boxShadow: "0 25px 50px rgba(0,0,0,0.6)",
    width: "100%",
    maxWidth: "900px",
    display: "flex",
    overflow: "hidden", // So children border radius is respected if any
  };

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
      background: "#030712",
      backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(124,92,252,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(34,211,238,0.05) 0%, transparent 50%)",
      fontFamily: "var(--font-sans, 'Space Grotesk', system-ui, sans-serif)",
    }}>
      <div style={cardStyle} className="flex-col md:flex-row">
        
        {/* Left Section (Info) */}
        <div style={{ flex: 1, padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1.5rem", borderRight: "1px solid rgba(124,92,252,0.1)" }} className="border-b md:border-b-0 md:border-r border-white/5">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🔌</span>
              <span style={{ color: "#a78bfa", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Orbit Station — OAuth Test Client
              </span>
            </div>
            <h1 style={{ color: "#f0f4ff", fontWeight: 800, fontSize: "1.375rem", margin: 0 }}>
              Test Your SSO Integration
            </h1>
            <p style={{ color: "#6b7db3", fontSize: "0.8125rem", margin: 0 }}>
              Enter the credentials from your registered OAuth App in{" "}
              <a href="/settings" style={{ color: "#a78bfa", textDecoration: "underline" }}>
                Settings → Developer
              </a>
              . This tool will simulate the full OAuth flow.
            </p>
          </div>

          <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
            <p style={{ color: "#6b7db3", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>How It Works</p>
            {[
              { step: "1", text: "Enter your app's Client ID and Client Secret" },
              { step: "2", text: "Click \"Run Test\" to view the Orbit consent screen" },
              { step: "3", text: "Click \"Allow Access\" to approve" },
              { step: "4", text: "View the full profile JSON returned" },
            ].map(item => (
              <div key={item.step} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                <span style={{ background: "rgba(124,92,252,0.2)", border: "1px solid rgba(124,92,252,0.3)", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.625rem", fontWeight: 800, color: "#a78bfa", flexShrink: 0 }}>
                  {item.step}
                </span>
                <p style={{ color: "#c4cde8", fontSize: "0.8rem", margin: 0 }}>{item.text}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "auto" }}>
            <p style={{ color: "#4b5675", fontSize: "0.7rem", margin: 0 }}>
              Test callback URL must be registered:<br/>
              <code style={{ color: "#6b7db3", background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem", display: "inline-block", marginTop: "4px", wordBreak: "break-all" }}>
                {mounted ? `${window.location.origin}/api/oauth/test-callback` : "/api/oauth/test-callback"}
              </code>
            </p>
          </div>
        </div>

        {/* Right Section (Form) */}
        <div style={{ flex: 1, padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", justifyContent: "center", background: "rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <label style={{ color: "#9aafcf", fontSize: "0.8125rem", fontWeight: 600 }}>Client ID</label>
            <input
              className="input"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              placeholder="orbit_XXXXXXXXXXXXXXXX"
              style={{ width: "100%", fontFamily: "monospace", fontSize: "0.875rem", padding: "0.875rem" }}
              autoComplete="off"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <label style={{ color: "#9aafcf", fontSize: "0.8125rem", fontWeight: 600 }}>Client Secret</label>
            <input
              className="input"
              type="password"
              value={clientSecret}
              onChange={e => setClientSecret(e.target.value)}
              placeholder="secret_XXXXXXXXXXXXXXXX"
              style={{ width: "100%", fontFamily: "monospace", fontSize: "0.875rem", padding: "0.875rem" }}
              autoComplete="off"
            />
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "0.75rem", color: "#f87171", fontSize: "0.8125rem" }}>
              {error}
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleStart}
            disabled={loading}
            style={{ width: "100%", padding: "1rem", fontSize: "0.9375rem", marginTop: "1rem" }}
          >
            {loading ? "Redirecting to Consent Screen..." : "🚀 Run OAuth Test"}
          </button>
        </div>

      </div>
    </div>
  );
}


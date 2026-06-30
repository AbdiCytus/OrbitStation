"use client";

import { useState, useEffect } from "react";
import { pusherClient } from "@/lib/pusher-client";

export default function OAuthTestPage() {
  const [clientId, setClientId] = useState("");
  const [loginUrl, setLoginUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get("client_id");
    if (id) {
      setClientId(id);
    }
  }, []);

  useEffect(() => {
    if (!clientId) return;

    const channelName = `oauth-test-${clientId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind("test-success", () => {
      setSuccess(true);
      setLoading(false);
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [clientId]);

  async function handleStart() {
    if (!clientId.trim()) {
      setError("Client ID is required.");
      return;
    }
    if (!loginUrl.trim()) {
      setError("Client Login URL is required.");
      return;
    }
    
    try {
      new URL(loginUrl.trim());
    } catch {
      setError("Please enter a valid URL (e.g. http://localhost:3000/login).");
      return;
    }

    setError("");
    setLoading(true);
    setSuccess(false);

    // Buka login URL aplikasi client di tab baru
    window.open(loginUrl.trim(), "_blank", "noopener,noreferrer");
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
    overflow: "hidden",
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
                Orbit Station — OAuth Integration
              </span>
            </div>
            <h1 style={{ color: "#f0f4ff", fontWeight: 800, fontSize: "1.375rem", margin: 0 }}>
              Test E2E SSO Flow
            </h1>
            <p style={{ color: "#6b7db3", fontSize: "0.8125rem", margin: 0 }}>
              Verify if your Web Client can successfully complete the OAuth 2.0 flow and fetch a token from Orbit Station.
            </p>
          </div>

          <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
            <p style={{ color: "#6b7db3", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>How It Works</p>
            {[
              { step: "1", text: "Ensure your Web Client server is running." },
              { step: "2", text: "Enter your Client App's Login URL below." },
              { step: "3", text: "Click Launch to open your app and login with Orbit." },
              { step: "4", text: "We will listen for a successful token exchange in real-time." },
            ].map(item => (
              <div key={item.step} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                <span style={{ background: "rgba(124,92,252,0.2)", border: "1px solid rgba(124,92,252,0.3)", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.625rem", fontWeight: 800, color: "#a78bfa", flexShrink: 0 }}>
                  {item.step}
                </span>
                <p style={{ color: "#c4cde8", fontSize: "0.8rem", margin: 0 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section (Form) */}
        <div style={{ flex: 1, padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", justifyContent: "center", background: "rgba(0,0,0,0.2)" }}>
          {success ? (
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
              <div style={{ width: "80px", height: "80px", background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" }}>
                ✨
              </div>
              <h2 style={{ color: "#10b981", margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>Test Successful!</h2>
              <p style={{ color: "#9aafcf", fontSize: "0.9rem" }}>
                Your application successfully completed the OAuth flow and retrieved an access token from Orbit Station.
              </p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSuccess(false)}
                style={{ marginTop: "1rem" }}
              >
                Run Another Test
              </button>
            </div>
          ) : (
            <>
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
                <label style={{ color: "#9aafcf", fontSize: "0.8125rem", fontWeight: 600 }}>Your Web Client Login URL</label>
                <input
                  className="input"
                  value={loginUrl}
                  onChange={e => setLoginUrl(e.target.value)}
                  placeholder="http://localhost:3000/login"
                  style={{ width: "100%", fontFamily: "monospace", fontSize: "0.875rem", padding: "0.875rem" }}
                  autoComplete="off"
                />
                <span style={{ fontSize: "0.7rem", color: "#6b7db3" }}>URL that initiates the 'Login with Orbit' flow in your app.</span>
              </div>

              {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "0.75rem", color: "#f87171", fontSize: "0.8125rem" }}>
                  {error}
                </div>
              )}

              <button
                type="button"
                className={loading ? "btn btn-secondary" : "btn btn-primary"}
                onClick={loading ? () => setLoading(false) : handleStart}
                style={{ width: "100%", padding: "1rem", fontSize: "0.9375rem", marginTop: "1rem" }}
              >
                {loading ? "Cancel Waiting" : "🚀 Launch Client Test"}
              </button>
              
              {loading && (
                <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#a78bfa", animation: "pulse 2s infinite" }}>
                  Listening for token exchange...
                </p>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}

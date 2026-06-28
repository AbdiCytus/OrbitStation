"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getMyOAuthApps, createOAuthApp, deleteOAuthApp, updateOAuthApp, getPersonalToken } from "@/lib/actions";
import { PlayIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/solid";

type OAuthApp = {
  id: string;
  name: string;
  clientId: string;
  redirectUris: string[];
  homepageUrl: string | null;
  createdAt: Date;
};

type NewAppCredentials = {
  clientId: string;
  clientSecret: string;
  name: string;
};

export default function DeveloperTab() {
  const [apps, setApps] = useState<OAuthApp[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal: Create New App
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRedirectUris, setNewRedirectUris] = useState("https://");
  const [homepageUrl, setNewHomepageUrl] = useState("https://");
  const [creating, setCreating] = useState(false);

  // Modal: Show Credentials (only once after creation)
  const [credentials, setCredentials] = useState<NewAppCredentials | null>(null);
  const [copied, setCopied] = useState<"id" | "secret" | null>(null);

  // Modal: Confirm Delete
  const [deleteTarget, setDeleteTarget] = useState<OAuthApp | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal: Edit App
  const [editTarget, setEditTarget] = useState<OAuthApp | null>(null);
  const [editName, setEditName] = useState("");
  const [editRedirectUris, setEditRedirectUris] = useState("");
  const [editHomepageUrl, setEditHomepageUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // Personal Token
  const [personalToken, setPersonalToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  useEffect(() => {
    loadApps();
  }, []);

  async function loadApps() {
    setLoading(true);
    try {
      const data = await getMyOAuthApps();
      setApps(data as OAuthApp[]);
    } catch {
      toast.error("Failed to load OAuth apps.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) { toast.error("App name is required."); return; }
    const uris = newRedirectUris.split("\n").map(u => u.trim()).filter(Boolean);
    if (!uris.length) { toast.error("At least one redirect URI is required."); return; }

    setCreating(true);
    const res = await createOAuthApp(newName, uris, homepageUrl);
    setCreating(false);

    if ("error" in res) {
      toast.error(res.error);
      return;
    }

    toast.success("OAuth App created successfully!");
    setShowCreateModal(false);
    setNewName("");
    setNewRedirectUris("https://");
    setNewHomepageUrl("https://");

    // Show credentials ONCE
    setCredentials({
      clientId: res.data.clientId,
      clientSecret: (res.data as any).clientSecret,
      name: res.data.name,
    });

    await loadApps();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteOAuthApp(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);

    if ("error" in res) { toast.error(res.error); return; }
    toast.success("OAuth App deleted.");
    await loadApps();
  }

  async function handleSaveEdit() {
    if (!editTarget) return;
    if (!editName.trim()) { toast.error("App name is required."); return; }
    const uris = editRedirectUris.split("\n").map(u => u.trim()).filter(Boolean);
    if (!uris.length) { toast.error("At least one redirect URI is required."); return; }

    setSaving(true);
    const res = await updateOAuthApp(editTarget.id, editName, uris, editHomepageUrl);
    setSaving(false);

    if ("error" in res) { toast.error(res.error); return; }
    toast.success("App updated.");
    setEditTarget(null);
    await loadApps();
  }

  function handleCopy(value: string, type: "id" | "secret" | "personal") {
    navigator.clipboard.writeText(value);
    if (type === "personal") {
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    } else {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  }

  async function handleRevealPersonalToken() {
    setLoadingToken(true);
    const res = await getPersonalToken();
    setLoadingToken(false);
    if ("error" in res) {
      toast.error(res.error);
    } else {
      setPersonalToken(res.token!);
    }
  }

  const glassCard = {
    background: "var(--glass-bg)",
    border: "1px solid var(--glass-border)",
    backdropFilter: "var(--glass-blur)",
    borderRadius: "var(--radius-lg)"
  };

  const overlayStyle: React.CSSProperties = {
    position: "fixed", inset: 0,
    borderRadius: "var(--radius-lg)",
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 100, padding: "1rem",
  };

  const modalStyle: React.CSSProperties = {
    ...glassCard,
    width: "100%",
    maxWidth: "480px",
    padding: "2rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    borderRadius: "var(--radius-lg)",
    boxShadow: "0 25px 50px rgba(0,0,0,0.6)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h2 className="settings-section-title" style={{ marginBottom: "0.25rem" }}>OAuth Applications</h2>
          <p className="settings-page-sub" style={{ fontSize: "0.8125rem", margin: 0 }}>
            Register apps that can use Orbit Station as a login provider.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.open("/docs/api", "_blank")}
            style={{ fontSize: "0.8125rem" }}
          >
            📖 View Documentation
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + New App
          </button>
        </div>
      </div>

      {/* App List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-comet)" }}>
          Loading...
        </div>
      ) : apps.length === 0 ? (
        <div style={{ ...glassCard, padding: "2.5rem", textAlign: "center", display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
          <div style={{ fontSize: "2rem" }}>🔌</div>
          <p style={{ color: "#f0f4ff", fontWeight: 600, margin: 0 }}>No OAuth Apps Yet</p>
          <p style={{ color: "var(--color-comet)", fontSize: "0.8125rem", margin: 0 }}>
            Create your first app to enable SSO login via Orbit Station.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {apps.map(app => (
            <div key={app.id} style={{ ...glassCard, padding: "1.25rem", display: "flex", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "#f0f4ff", fontWeight: 700, margin: "0 0 0.25rem", fontSize: "0.9375rem" }}>{app.name}</p>
                <p style={{ color: "var(--color-comet)", fontSize: "0.75rem", margin: "0 0 0.5rem", fontFamily: "var(--font-mono)", overflowWrap: "break-word" }}>
                  Client ID: <span style={{ color: "#a78bfa" }}>{app.clientId}</span>
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                  {app.redirectUris.map((uri, i) => (
                    <span key={i} style={{ background: "rgba(124,92,252,0.12)", border: "1px solid rgba(124,92,252,0.25)", borderRadius: "999px", padding: "2px 10px", fontSize: "0.7rem", color: "#a78bfa", fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>
                      {uri}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: "36px", height: "36px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(34, 211, 238, 0.1)", color: "#22d3ee", borderColor: "rgba(34, 211, 238, 0.3)" }}
                  onClick={() => window.open(`/oauth-test?client_id=${app.clientId}`, "_blank")}
                  title="Test App"
                >
                  <PlayIcon style={{ width: "16px", height: "16px" }} />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: "36px", height: "36px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                  onClick={() => { setEditTarget(app); setEditName(app.name); setEditRedirectUris(app.redirectUris.join("\n")); setEditHomepageUrl(app.homepageUrl || "https://"); }}
                  title="Edit"
                >
                  <PencilIcon style={{ width: "16px", height: "16px" }} />
                </button>
                <button
                  type="button"
                  className="btn btn-danger-outline"
                  style={{ width: "36px", height: "36px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                  onClick={() => setDeleteTarget(app)}
                  title="Delete"
                >
                  <TrashIcon style={{ width: "16px", height: "16px" }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box: Personal Access Token */}
      <div style={{ ...glassCard, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", borderColor: "rgba(34, 211, 238, 0.25)" }}>
        <div>
          <h3 style={{ color: "#22d3ee", fontWeight: 700, margin: "0 0 0.5rem", fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            🔑 Personal Access Token (REST API)
          </h3>
          <p style={{ color: "var(--color-comet)", fontSize: "0.875rem", margin: 0, lineHeight: 1.5 }}>
            Use this token to interact with Orbit Station's REST API on your own behalf. 
            You can build custom clients, mobile apps, or scripts to access your profile and station data. 
            Keep this token safe as it grants full access to your account data.
          </p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {personalToken ? (
            <>
              <code style={{ flex: 1, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "0.75rem", color: "#22d3ee", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>
                {personalToken}
              </code>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleCopy(personalToken, "personal")}
                style={{ flexShrink: 0 }}
              >
                {tokenCopied ? "✓ Copied!" : "Copy Token"}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleRevealPersonalToken}
              disabled={loadingToken}
            >
              {loadingToken ? <span className="spinner" /> : "Reveal My Token"}
            </button>
          )}
        </div>
      </div>

      {/* Info box: How to integrate */}
      <div style={{ ...glassCard, padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem", borderColor: "rgba(124,92,252,0.25)" }}>
        <p style={{ color: "#a78bfa", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>📡 Integration Endpoints</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          {[
            { label: "Authorize", url: `${typeof window !== "undefined" ? window.location.origin : ""}/api/oauth/authorize` },
            { label: "Token Exchange", url: `${typeof window !== "undefined" ? window.location.origin : ""}/api/oauth/token` },
            { label: "User Info", url: `${typeof window !== "undefined" ? window.location.origin : ""}/api/oauth/userinfo` },
            { label: "REST API Docs", url: `${typeof window !== "undefined" ? window.location.origin : ""}/docs/api` },
          ].map(ep => (
            <div key={ep.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ color: "var(--color-comet)", fontSize: "0.75rem", minWidth: "90px" }}>{ep.label}</span>
              <code style={{ color: "#f0f4ff", fontSize: "0.75rem", fontFamily: "var(--font-mono)", background: "rgba(0,0,0,0.3)", padding: "2px 8px", borderRadius: "4px", wordBreak: "break-all" }}>
                {ep.url}
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* === MODAL: Create New App === */}
      {showCreateModal && (
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
          <div style={modalStyle}>
            <h3 style={{ color: "#f0f4ff", fontWeight: 800, margin: 0, fontSize: "1.125rem" }}>Register New OAuth App</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ color: "#9aafcf", fontSize: "0.8125rem", fontWeight: 600 }}>App Name</label>
              <input
                className="input"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Orbit Mini Game"
                style={{ width: "100%" }}
                autoFocus
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ color: "#9aafcf", fontSize: "0.8125rem", fontWeight: 600 }}>Base/Homepage URL</label>
              <input
                className="input"
                value={homepageUrl}
                onChange={e => setNewHomepageUrl(e.target.value)}
                placeholder="https://your-app.com"
                style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ color: "#9aafcf", fontSize: "0.8125rem", fontWeight: 600 }}>Redirect URIs</label>
              <p style={{ color: "var(--color-comet)", fontSize: "0.75rem", margin: 0 }}>Enter one URI per line. Must use https:// (or http://localhost for development).</p>
              <textarea
                className="input"
                value={newRedirectUris}
                onChange={e => setNewRedirectUris(e.target.value)}
                rows={3}
                placeholder={"https://your-app.com/callback\nhttp://localhost:3001/callback"}
                style={{ width: "100%", resize: "vertical", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                {creating ? <span className="spinner" /> : "Create App"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL: Show Credentials (one-time) === */}
      {credentials && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, borderColor: "rgba(124,92,252,0.4)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <h3 style={{ color: "#f0f4ff", fontWeight: 800, margin: 0, fontSize: "1.125rem" }}>
                🔐 Save Your Credentials
              </h3>
              <p style={{ color: "#f87171", fontSize: "0.8125rem", margin: 0, fontWeight: 600 }}>
                ⚠️ Client Secret is shown ONLY ONCE. Copy it now!
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {[
                { label: "App Name", value: credentials.name, type: null },
                { label: "Client ID", value: credentials.clientId, type: "id" as const },
                { label: "Client Secret", value: credentials.clientSecret, type: "secret" as const },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ color: "#9aafcf", fontSize: "0.75rem", fontWeight: 600 }}>{item.label}</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <code style={{ flex: 1, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "0.5rem 0.75rem", color: item.type ? "#a78bfa" : "#f0f4ff", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", wordBreak: "break-all", minHeight: "40px", display: "flex", alignItems: "center" }}>
                      {item.value}
                    </code>
                    {item.type && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: "0.375rem 0.75rem", fontSize: "0.8rem", flexShrink: 0 }}
                        onClick={() => handleCopy(item.value, item.type!)}
                      >
                        {copied === item.type ? "✓ Copied!" : "Copy"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "0.5rem" }}
              onClick={() => setCredentials(null)}
            >
              I've Saved the Credentials
            </button>
          </div>
        </div>
      )}

      {/* === MODAL: Confirm Delete === */}
      {deleteTarget && (
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
          <div style={{ ...modalStyle, maxWidth: "400px" }}>
            <h3 style={{ color: "#f0f4ff", fontWeight: 800, margin: 0 }}>Delete OAuth App?</h3>
            <p style={{ color: "var(--color-comet)", margin: 0, fontSize: "0.875rem" }}>
              This will permanently delete <strong style={{ color: "#f0f4ff" }}>{deleteTarget.name}</strong> and its credentials. Any apps using it will stop working immediately.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button type="button" className="btn btn-danger-outline" onClick={handleDelete} disabled={deleting}
                style={{ background: "rgba(239,68,68,0.15)" }}>
                {deleting ? <span className="spinner" /> : "Delete App"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL: Edit App === */}
      {editTarget && (
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setEditTarget(null); }}>
          <div style={modalStyle}>
            <h3 style={{ color: "#f0f4ff", fontWeight: 800, margin: 0, fontSize: "1.125rem" }}>Edit OAuth App</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ color: "#9aafcf", fontSize: "0.8125rem", fontWeight: 600 }}>App Name</label>
              <input className="input" value={editName} onChange={e => setEditName(e.target.value)} style={{ width: "100%" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ color: "#9aafcf", fontSize: "0.8125rem", fontWeight: 600 }}>Homepage URL</label>
              <input
                className="input"
                value={editHomepageUrl}
                onChange={e => setEditHomepageUrl(e.target.value)}
                style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ color: "#9aafcf", fontSize: "0.8125rem", fontWeight: 600 }}>Redirect URIs</label>
              <textarea
                className="input"
                value={editRedirectUris}
                onChange={e => setEditRedirectUris(e.target.value)}
                rows={3}
                style={{ width: "100%", resize: "vertical", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditTarget(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSaveEdit} disabled={saving}>
                {saving ? <span className="spinner" /> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

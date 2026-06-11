"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  bannerUrl: string | null;
  titleBadge: string | null;
  callsign: string | null;
  animationEnabled: boolean;
  station: { isPublic: boolean } | null;
};

type Props = { profile: Profile };

export default function SettingsClient({ profile }: Props) {
  const [name, setName] = useState(profile.name ?? "");
  const [username, setUsername] = useState(profile.username ?? "");
  const [callsign, setCallsign] = useState(profile.callsign ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl ?? "");
  const [titleBadge, setTitleBadge] = useState(profile.titleBadge ?? "");
  const [animationEnabled, setAnimationEnabled] = useState(profile.animationEnabled);
  const [isPublic, setIsPublic] = useState(profile.station?.isPublic ?? false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, callsign, bio, bannerUrl, titleBadge, animationEnabled, isPublic }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong");
      } else {
        setStatus("saved");
        router.refresh();
        setTimeout(() => setStatus("idle"), 2500);
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSave} className="settings-content">
      {/* Header */}
      <div className="settings-page-header">
        <div>
          <h1 className="settings-page-title">Settings</h1>
          <p className="settings-page-sub">Manage your Orbit Station profile and preferences.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button type="button" className="btn btn-secondary" onClick={() => window.location.href = "/station"}>
            Back
          </button>
          <button type="submit" className="btn btn-primary" disabled={status === "saving"}>
            {status === "saving" ? <span className="spinner" /> : "Save Changes"}
          </button>
          {status === "saved" && <span style={{ color: "#4ade80", fontSize: "0.875rem" }}>✓</span>}
        </div>
      </div>

      <div className="settings-grid-layout">
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Public profile cosmetics */}
          <section className="settings-section">
            <h2 className="settings-section-title">Public Profile</h2>

            {/* Title badge */}
            <div className="form-group">
              <label className="form-label" htmlFor="s-badge">Title Badge</label>
              <input
                id="s-badge"
                className="input"
                value={titleBadge}
                onChange={(e) => setTitleBadge(e.target.value)}
                maxLength={40}
                placeholder="e.g. Pioneer Pilot, Star Navigator…"
              />
            </div>

            {/* Banner URL */}
            <div className="form-group">
              <label className="form-label" htmlFor="s-banner">Banner Image URL</label>
              {bannerUrl && (
                <div className="beacon-preview-image" style={{ marginBottom: "0.5rem" }}>
                  <img src={bannerUrl} alt="Banner preview"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
              <input
                id="s-banner"
                className="input"
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://example.com/your-banner.jpg"
              />
            </div>
          </section>

          {/* Preferences */}
          <section className="settings-section">
            <h2 className="settings-section-title">Preferences</h2>

            {/* Animation toggle */}
            <div className="settings-toggle-row">
              <div className="settings-toggle-info">
                <span className="settings-toggle-label">Enable Animations</span>
                <span className="settings-toggle-desc">
                  Starfield canvas, floating beacons, sector transitions. Disable for performance or accessibility.
                </span>
              </div>
              <label className="toggle-switch" htmlFor="toggle-animation">
                <input
                  id="toggle-animation"
                  type="checkbox"
                  checked={animationEnabled}
                  onChange={(e) => setAnimationEnabled(e.target.checked)}
                />
                <span className="toggle-thumb" />
              </label>
            </div>

            {/* Public Profile toggle */}
            <div className="settings-toggle-row" style={{ marginTop: "1rem" }}>
              <div className="settings-toggle-info">
                <span className="settings-toggle-label">Public Station</span>
                <span className="settings-toggle-desc">
                  Allow anyone to visit your Orbit Station via your public URL.
                </span>
              </div>
              <label className="toggle-switch" htmlFor="toggle-public">
                <input
                  id="toggle-public"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <span className="toggle-thumb" />
              </label>
            </div>
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Profile */}
          <section className="settings-section">
            <h2 className="settings-section-title">Profile</h2>

            {/* Avatar row */}
            <div className="settings-avatar-row">
              {profile.image ? (
                <img src={profile.image} alt={profile.name ?? ""} className="settings-avatar" />
              ) : (
                <div className="settings-avatar" style={{
                  background: "linear-gradient(135deg,#5b3fde,#22d3ee)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.5rem", fontWeight: 800, color: "#fff"
                }}>
                  {(profile.name ?? "?").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="settings-avatar-info">
                <span className="settings-avatar-name">{profile.name ?? "No name"}</span>
                <span className="settings-avatar-email">{profile.email}</span>
              </div>
            </div>

            {/* Display name */}
            <div className="form-group">
              <label className="form-label" htmlFor="s-name">Display Name</label>
              <input
                id="s-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                placeholder="How others see your name"
              />
            </div>

            {/* Username */}
            <div className="form-group">
              <label className="form-label" htmlFor="s-username">
                Username
                <span className="form-label-hint"> — used in your public URL: /@username</span>
              </label>
              <input
                id="s-username"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                maxLength={32}
                placeholder="yourname"
              />
            </div>

            {/* Callsign */}
            <div className="form-group">
              <label className="form-label" htmlFor="s-callsign">
                Callsign
                <span className="form-label-hint"> — shown in the dashboard instead of "Pilot"</span>
              </label>
              <input
                id="s-callsign"
                className="input"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                maxLength={32}
                placeholder="e.g. Commander, Captain, Navigator…"
              />
            </div>

            {/* Bio */}
            <div className="form-group">
              <label className="form-label" htmlFor="s-bio">Bio</label>
              <textarea
                id="s-bio"
                className="input"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={300}
                placeholder="Tell the galaxy about yourself…"
              />
            </div>
          </section>
        </div>
      </div>
      {status === "error" && (
        <p className="login-form-error" style={{ marginTop: "1rem" }}>{errorMsg}</p>
      )}
    </form>
  );
}

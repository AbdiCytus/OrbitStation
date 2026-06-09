import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings — Orbit Station",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await getMyProfile();

  return (
    <div className="settings-page">
      <div className="station-bg" aria-hidden="true">
        <div className="nebula-blob nb1" />
        <div className="nebula-blob nb2" />
      </div>

      <div className="settings-container glass">
        <header className="settings-header">
          <a href="/station" className="btn btn-secondary btn-sm">← Back to Station</a>
          <h1 className="settings-title">Settings</h1>
          <p className="settings-sub">Manage your Orbit Station profile</p>
        </header>

        <section className="settings-section">
          <h2 className="settings-section-title">Profile</h2>
          <div className="settings-row">
            <label className="settings-label">Name</label>
            <span className="settings-value">{profile?.name ?? "—"}</span>
          </div>
          <div className="settings-row">
            <label className="settings-label">Email</label>
            <span className="settings-value">{profile?.email ?? "—"}</span>
          </div>
          <div className="settings-row">
            <label className="settings-label">Username</label>
            <span className="settings-value">
              {profile?.username ? `@${profile.username}` : <span className="muted">Not set yet</span>}
            </span>
          </div>
          <div className="settings-row">
            <label className="settings-label">Member since</label>
            <span className="settings-value">
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("en", { month: "long", year: "numeric" })
                : "—"}
            </span>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="settings-section-title">Coming Soon</h2>
          <p className="settings-coming-soon">
            Profile customization (username, bio, banner, title badge) will be available in a future update.
          </p>
        </section>
      </div>
    </div>
  );
}

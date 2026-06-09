"use client";

import { useState } from "react";
import type { PublicStationPage, Beacon, SectorWithBeacons } from "@/types";
import { incrementBeaconVisit } from "@/lib/actions";

type Props = {
  data: PublicStationPage;
};

export default function PublicProfileClient({ data }: Props) {
  const { user, station } = data;
  const sectors = station.sectors;

  const [activeSectorId, setActiveSectorId] = useState<string | "all">(
    sectors[0]?.id ?? "all"
  );
  const [selectedBeacon, setSelectedBeacon] = useState<Beacon | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const allBeacons = sectors.flatMap((s) => s.beacons);

  const visibleBeacons = (() => {
    let beacons: Beacon[] =
      activeSectorId === "all"
        ? allBeacons
        : sectors.find((s) => s.id === activeSectorId)?.beacons ?? [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      beacons = beacons.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q)
      );
    }
    return beacons;
  })();

  const pinnedBeacons = allBeacons.filter((b) => b.isPinned).slice(0, 6);

  function handleVisit(beacon: Beacon) {
    incrementBeaconVisit(beacon.id);
    window.open(beacon.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="profile-root">
      {/* Background */}
      <div className="station-bg" aria-hidden="true">
        <div className="nebula-blob nb1" />
        <div className="nebula-blob nb2" />
      </div>

      {/* ── BANNER + HEADER (ala ZZZ profile) ─────────────── */}
      <header className="profile-header">
        {/* Banner */}
        <div className="profile-banner">
          {user.bannerUrl ? (
            <img src={user.bannerUrl} alt="Banner" className="profile-banner-img" />
          ) : (
            <div className="profile-banner-default" />
          )}
          <div className="profile-banner-fade" />
        </div>

        {/* Info row */}
        <div className="profile-info-row">
          {/* Avatar */}
          <div className="profile-avatar-wrap">
            {user.image ? (
              <img src={user.image} alt={user.name ?? "Avatar"} className="profile-avatar" />
            ) : (
              <div className="profile-avatar profile-avatar-fallback">
                {(user.name ?? "?").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name + bio */}
          <div className="profile-identity">
            <div className="profile-name-row">
              <h1 className="profile-name">{user.name ?? user.username}</h1>
              {user.titleBadge && (
                <span className="badge badge-violet profile-badge">{user.titleBadge}</span>
              )}
            </div>
            {user.username && (
              <p className="profile-username">@{user.username}</p>
            )}
            {user.bio && <p className="profile-bio">{user.bio}</p>}
          </div>

          {/* Stats */}
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-value">{sectors.length}</span>
              <span className="profile-stat-label">Sectors</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{allBeacons.length}</span>
              <span className="profile-stat-label">Beacons</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">
                {allBeacons.reduce((a, b) => a + b.visitCount, 0)}
              </span>
              <span className="profile-stat-label">Total Visits</span>
            </div>
          </div>
        </div>
      </header>

      <div className="profile-body">
        {/* ── PINNED BEACONS ─────────────────────────────── */}
        {pinnedBeacons.length > 0 && (
          <section className="profile-section">
            <h2 className="profile-section-title">
              <span>📍</span> Pinned Coordinates
            </h2>
            <div className="pinned-grid">
              {pinnedBeacons.map((beacon) => (
                <button
                  key={beacon.id}
                  className="pinned-card glass"
                  onClick={() => handleVisit(beacon)}
                  id={`pinned-${beacon.id}`}
                >
                  {beacon.faviconUrl && (
                    <img
                      src={beacon.faviconUrl}
                      alt=""
                      width={20}
                      height={20}
                      className="pinned-favicon"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <span className="pinned-title">{beacon.title}</span>
                  <span className="pinned-visits">{beacon.visitCount} visits</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── SECTOR TABS + BEACON GRID ──────────────────── */}
        <section className="profile-section">
          <div className="profile-controls">
            {/* Search */}
            <div className="profile-search">
              <span className="navbar-search-icon">🔭</span>
              <input
                className="navbar-search-input"
                type="search"
                placeholder="Search beacons…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search beacons"
              />
            </div>

            {/* Sector tabs (horizontal scroll) */}
            <div className="profile-sector-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={activeSectorId === "all"}
                className={`profile-sector-tab ${activeSectorId === "all" ? "active" : ""}`}
                onClick={() => setActiveSectorId("all")}
                id="tab-all"
              >
                🌌 All ({allBeacons.length})
              </button>
              {sectors.map((s) => (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={activeSectorId === s.id}
                  className={`profile-sector-tab ${activeSectorId === s.id ? "active" : ""}`}
                  onClick={() => setActiveSectorId(s.id)}
                  id={`tab-${s.id}`}
                  style={activeSectorId === s.id && s.color ? { borderColor: s.color, color: s.color } : undefined}
                >
                  {s.icon ?? "📁"} {s.name} ({s.beacons.length})
                </button>
              ))}
            </div>
          </div>

          {visibleBeacons.length === 0 ? (
            <div className="station-empty">
              <div className="station-empty-icon">🔭</div>
              <p className="station-empty-title">No beacons here</p>
              <p className="station-empty-sub">
                {searchQuery ? `No results for "${searchQuery}"` : "This sector is empty."}
              </p>
            </div>
          ) : (
            <div className="beacon-grid">
              {visibleBeacons.map((beacon) => (
                <PublicBeaconCard
                  key={beacon.id}
                  beacon={beacon}
                  sector={sectors.find((s) => s.id === beacon.sectorId) ?? null}
                  onVisit={handleVisit}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Orbit Station watermark */}
      <footer className="profile-footer">
        <a href="/" className="profile-footer-link">
          ⊕ Orbit Station
        </a>
        <span className="profile-footer-sub">Create your own station for free</span>
      </footer>
    </div>
  );
}

// ── Beacon card for public profile (no edit controls) ──
function PublicBeaconCard({
  beacon,
  sector,
  onVisit,
}: {
  beacon: Beacon;
  sector: SectorWithBeacons | null;
  onVisit: (b: Beacon) => void;
}) {
  const domain = (() => {
    try { return new URL(beacon.url).hostname.replace("www.", ""); }
    catch { return beacon.url; }
  })();

  return (
    <article
      className="beacon-card glass"
      role="button"
      tabIndex={0}
      onClick={() => onVisit(beacon)}
      onKeyDown={(e) => e.key === "Enter" && onVisit(beacon)}
      id={`beacon-pub-${beacon.id}`}
      aria-label={`Visit ${beacon.title}`}
    >
      <div className="beacon-card-image">
        {beacon.imageUrl ? (
          <img
            src={beacon.imageUrl}
            alt={beacon.title}
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="beacon-card-image-placeholder">
            {beacon.faviconUrl ? (
              <img src={beacon.faviconUrl} alt="" width={32} height={32} />
            ) : (
              <span className="beacon-card-domain-initial">
                {domain.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        )}
        {beacon.isPinned && <span className="beacon-card-pin">📍</span>}
        {sector?.color && (
          <span
            className="beacon-card-sector-dot"
            style={{ backgroundColor: sector.color }}
            title={sector.name}
          />
        )}
      </div>
      <div className="beacon-card-body">
        <div className="beacon-card-meta">
          {beacon.faviconUrl && (
            <img src={beacon.faviconUrl} alt="" width={14} height={14} className="beacon-card-favicon" />
          )}
          <span className="beacon-card-domain">{domain}</span>
        </div>
        <h3 className="beacon-card-title">{beacon.title}</h3>
        {beacon.description && (
          <p className="beacon-card-desc">{beacon.description}</p>
        )}
      </div>
      <div className="beacon-card-footer">
        <span className="beacon-card-visits">
          {beacon.visitCount > 0 && `${beacon.visitCount} visits`}
        </span>
        <span className="btn btn-primary btn-sm">Visit →</span>
      </div>
    </article>
  );
}

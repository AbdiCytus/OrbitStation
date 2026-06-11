"use client";

import { useState } from "react";
import type { PublicStationPage, Beacon } from "@/types";
import { DynamicIcon } from "@/components/dynamic-icon";
import BeaconDetailModal from "@/components/beacon-detail-modal";
import StationNavbar from "@/components/station-navbar";
import { incrementBeaconVisit } from "@/lib/actions";
import "./public-profile.css";

type Props = {
  data: PublicStationPage;
  sessionUser?: any;
};

function CosmicBackground({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return (
      <div className="cosmic-bg">
        <div className="cosmic-stars"></div>
        <div className="cosmic-aurora"></div>
      </div>
    );
  }
  return (
    <div className="cosmic-bg">
      <div className="cosmic-stars"></div>
      <div className="cosmic-aurora"></div>
      <div className="cosmic-blackhole">
        <div className="accretion-disk"></div>
      </div>
      <div className="cosmic-asteroids"></div>
      <div className="cosmic-comet"></div>
      <div className="cosmic-comet comet-2"></div>
      <div className="cosmic-dust"></div>
    </div>
  );
}

export default function PublicProfileClient({ data, sessionUser }: Props) {
  const { user, station } = data;
  
  // Exclude "All", and filter active sectors to those that have beacons
  const sectors = station.sectors.filter(s => s.beacons.length > 0);
  
  const [activeSectorId, setActiveSectorId] = useState<string>(
    sectors[0]?.id ?? ""
  );
  
  const [selectedBeacon, setSelectedBeacon] = useState<Beacon | null>(null);

  const visibleBeacons = (sectors.find((s) => s.id === activeSectorId)?.beacons ?? []).slice(0, 6);

  function handleBeaconClick(beacon: Beacon) {
    incrementBeaconVisit(beacon.id);
    setSelectedBeacon(beacon);
  }

  const allBeaconsCount = station.sectors.reduce((acc, s) => acc + s.beacons.length, 0);

  const isOwnProfile = sessionUser?.id === user.id;
  const profileTitle = isOwnProfile ? user.name : `${user.name}'s Station`;

  const isAnimationEnabled = sessionUser && 'animationEnabled' in sessionUser 
    ? sessionUser.animationEnabled 
    : user.animationEnabled;

  return (
    <>
      {/* Station Navbar */}
      <StationNavbar 
        user={sessionUser} 
        displayName={sessionUser?.name || "Pilot"} 
        hideSearch={true} 
      />

      {/* Background Canvas: Kosmik, Aurora, Komet, Blackhole */}
      <CosmicBackground enabled={isAnimationEnabled} />

      <div className="zzz-wrapper" style={{ top: "60px" }}>
        {/* Modal Container */}
        <div className={`zzz-modal ${isAnimationEnabled ? "floating" : ""}`}>
          
          {/* Modal Background Sparkles */}
          {isAnimationEnabled && (
            <div className="zzz-modal-bg" aria-hidden="true">
              {Array.from({ length: 30 }).map((_, i) => {
                // Deterministic pseudo-random values to prevent hydration errors
                const r1 = (i * 13) % 100;
                const r2 = (i * 29) % 100;
                const r3 = (i * 7) % 3;
                const r4 = (i * 17) % 4;
                const r5 = (i * 11) % 2;

                return (
                  <span
                    key={i}
                    className="zzz-star-particle"
                    style={{
                      left: `${r1}%`,
                      top: `${r2}%`,
                      width: `${r3 + 1}px`,
                      height: `${r3 + 1}px`,
                      animationDelay: `${r4}s`,
                      animationDuration: `${r5 + 2}s`,
                    }}
                  />
                );
              })}
            </div>
          )}

          <div className="zzz-content">
            {/* Banner Section */}
            <div className="zzz-banner-container">
              <img 
                src={user.bannerUrl || "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=2000&auto=format&fit=crop"} 
                alt="Banner" 
                className="zzz-banner-img" 
              />
              <div className="zzz-banner-overlay">
                <div className="zzz-banner-left">
                  <div className="zzz-avatar">
                    {user.image ? (
                      <img src={user.image} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      user.name?.[0]?.toUpperCase() ?? "?"
                    )}
                  </div>
                  <div className="zzz-user-info">
                    <h1 className="zzz-user-name">{profileTitle || "Pilot"}</h1>
                    {user.username && (
                      <div className="zzz-user-username">@{user.username}</div>
                    )}
                    {user.titleBadge && (
                      <div className="zzz-user-badge">{user.titleBadge}</div>
                    )}
                  </div>
                </div>
                
                <div className="zzz-banner-right">
                  <div className="zzz-stats-row">
                    <div className="zzz-stat">
                      <div className="zzz-stat-val">{station.sectors.length}</div>
                      <div className="zzz-stat-label">Sectors</div>
                    </div>
                    <div className="zzz-stat">
                      <div className="zzz-stat-val">{allBeaconsCount}</div>
                      <div className="zzz-stat-label">Beacons</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="zzz-bio-bar">
              <div className="zzz-bio-text">"{user.bio || "Exploring the internet galaxy."}"</div>
            </div>

            {/* Sector Tabs */}
            {sectors.length > 0 && (
              <div className="zzz-sector-tabs">
                {sectors.map((s) => (
                  <button
                    key={s.id}
                    className={`zzz-sector-tab ${activeSectorId === s.id ? "active" : ""}`}
                    onClick={() => setActiveSectorId(s.id)}
                  >
                    {s.icon ? <DynamicIcon name={s.icon} /> : "📁"} {s.name} ({s.beacons.length})
                  </button>
                ))}
              </div>
            )}

            {/* Empty State */}
            {sectors.length === 0 && (
              <div style={{ padding: "4rem 2rem", textAlign: "center", color: "#a1a1aa", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: "4rem", marginBottom: "1rem", filter: "grayscale(1) opacity(0.5)" }}>📭</div>
                <h3 style={{ color: "#fff", fontSize: "1.5rem", marginBottom: "0.5rem" }}>No Public Beacons Found</h3>
                <p>{isOwnProfile ? "Pin some beacons on your dashboard to showcase them here." : "This pilot hasn't pinned any beacons yet."}</p>
              </div>
            )}

            {/* Beacons Grid */}
            {sectors.length > 0 && (
              <div className="zzz-beacon-grid">
                {visibleBeacons.map((beacon, idx) => (
                  <div 
                    key={beacon.id} 
                    className={`zzz-beacon-card ${user.animationEnabled ? "floating" : ""}`}
                    style={{ "--enter-delay": `${idx * 0.1}s`, animationDelay: `${(idx * 0.1)}s, ${(idx * 0.2)}s` } as any}
                    onClick={() => handleBeaconClick(beacon)}
                  >
                    {beacon.imageUrl ? (
                      <img src={beacon.imageUrl} alt={beacon.title} className="zzz-beacon-img" />
                    ) : beacon.faviconUrl ? (
                      <div className="zzz-beacon-placeholder">
                        <img src={beacon.faviconUrl} alt="" style={{ width: '3rem', height: '3rem', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' }} />
                      </div>
                    ) : (
                      <div className="zzz-beacon-placeholder">
                        {beacon.title[0]}
                      </div>
                    )}
                    <div className="zzz-beacon-info">
                      <div className="zzz-beacon-title">{beacon.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedBeacon && (
        <BeaconDetailModal
          beacon={selectedBeacon}
          sector={sectors.find((s) => s.id === selectedBeacon.sectorId) ?? null}
          onClose={() => setSelectedBeacon(null)}
          readOnly={true}
        />
      )}
    </>
  );
}

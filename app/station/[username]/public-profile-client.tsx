"use client";

import { useState, useEffect, useRef } from "react";
import type { PublicStationPage, Beacon } from "@/types";
import { DynamicIcon } from "@/components/dynamic-icon";
import BeaconDetailModal from "@/components/beacon-detail-modal";
import StationNavbar from "@/components/station-navbar";
import { incrementBeaconVisit } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { InformationCircleIcon } from "@heroicons/react/20/solid";
import { UserPlusIcon, ShareIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { sendFriendRequest, recordStationVisit } from "@/lib/actions";
import { motion, useAnimation, PanInfo, useDragControls } from "framer-motion";
import { getBadgeById, BADGE_COLORS } from "@/lib/badges/registry";
import FriendsModal from "@/components/friends-modal";
import { useNotifications } from "@/hooks/use-notifications";
import "./public-profile.css";

type Props = {
  data: PublicStationPage;
  sessionUser?: any;
  isFriendOrPending?: boolean;
};

function CosmicBackground({ enabled, isMobile }: { enabled: boolean; isMobile: boolean }) {
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
      {!isMobile && <div className="cosmic-asteroids"></div>}
      <div className="cosmic-comet"></div>
      {!isMobile && <div className="cosmic-comet comet-2"></div>}
      {!isMobile && <div className="cosmic-dust"></div>}
    </div>
  );
}

export default function PublicProfileClient({ data, sessionUser, isFriendOrPending }: Props) {
  const { user, station } = data;

  // Exclude "All", and filter active sectors to those that have beacons
  const sectors = station.sectors.filter(s => s.beacons.length > 0);

  const [activeSectorId, setActiveSectorId] = useState<string>(
    sectors[0]?.id ?? ""
  );

  const [selectedBeacon, setSelectedBeacon] = useState<Beacon | null>(null);
  const [stationSearch, setStationSearch] = useState("");
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const { stats, refetch: refetchNotifications } = useNotifications();
  const router = useRouter();
  const controls = useAnimation();
  const dragControls = useDragControls();
  const currentYRef = useRef(0);

  // 3 snap positions (in px from top of wrapper): 0 = full, mid, bottom-peek
  const getSnapPositions = () => {
    if (typeof window === "undefined") return [0, 200, 420];
    const vh = window.innerHeight - 60; // subtract navbar height
    return [
      0,            // full open (top)
      vh * 0.35,    // mid (~35% down)
      vh * 0.72,    // peeking (only header+handle visible)
    ];
  };

  const [hasVisited, setHasVisited] = useState(false);

  useEffect(() => {
    // Record visit on mount
    if (!hasVisited && station.id) {
      recordStationVisit(station.id, sessionUser?.id);
      setHasVisited(true);
    }
  }, [hasVisited, station.id, sessionUser?.id]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const visibleBeacons = (sectors.find((s) => s.id === activeSectorId)?.beacons ?? []).slice(0, 10);

  function handleBeaconClick(beacon: Beacon) {
    setSelectedBeacon(beacon);
  }

  const allBeaconsCount = station.totalBeacons ?? station.sectors.reduce((acc: number, s: any) => acc + s.beacons.length, 0);
  const totalSectorsCount = station.totalSectors ?? station.sectors.length;

  const isOwnProfile = sessionUser?.id === user.id;
  const profileTitle = isOwnProfile ? user.name : `${user.name}'s Station`;

  const isAnimationEnabled = sessionUser && 'animationEnabled' in sessionUser
    ? sessionUser.animationEnabled
    : false;

  return (
    <>
      {/* Station Navbar */}
      <StationNavbar
        user={sessionUser}
        displayName={sessionUser?.name || "Pilot"}
        hideSearch={false}
        searchQuery={stationSearch}
        onSearchChange={setStationSearch}
        searchPlaceholder={isMobile ? "Find Pilot" : "Find another pilot station"}
        onSearchSubmit={() => {
          if (stationSearch.trim()) {
            router.push(`/station/${stationSearch.trim()}`);
          }
        }}
        isPublicProfile={true}
        onOpenFriends={() => setShowFriendsModal(true)}
      />

      {/* Background Canvas: Kosmik, Aurora, Komet, Blackhole */}
      {sessionUser && (sessionUser as any).staticBackgroundEnabled ? (
        <div className="cosmic-bg fixed inset-0 z-[-1] pointer-events-none static-cosmic-bg" aria-hidden="true">
          <div className="cosmic-stars"></div>
          <div className="cosmic-aurora" style={{ opacity: 0.5, transform: "scale(1.2)" }}></div>
          <div className="cosmic-dust"></div>
        </div>
      ) : (
        <CosmicBackground enabled={isAnimationEnabled} isMobile={isMobile} />
      )}

      <div className="zzz-wrapper" style={{ top: "60px", pointerEvents: "none" }}>
        {/* Modal Container */}
        <motion.div
          className={`zzz-modal ${isAnimationEnabled ? "floating" : ""}`}
          drag={isMobile ? "y" : false}
          dragControls={dragControls}
          dragListener={false}
          animate={controls}
          initial={{ y: 0 }}
          dragConstraints={{ top: 0, bottom: isMobile ? (typeof window !== "undefined" ? (window.innerHeight - 60) * 0.85 : 500) : 0 }}
          dragElastic={0.05}
          onDrag={(e, info) => {
            currentYRef.current = info.offset.y;
          }}
          onDragEnd={(e, info) => {
            if (!isMobile) return;
            const snaps = getSnapPositions();
            const currentY = currentYRef.current;
            const velocity = info.velocity.y;

            // Find the nearest snap position based on current position & velocity
            let targetSnap = snaps[0];
            let minDist = Infinity;

            snaps.forEach((snap) => {
              // Weight by velocity direction: prefer snapping in direction of movement
              const adjustedSnap = snap - velocity * 0.05;
              const dist = Math.abs(currentY - adjustedSnap);
              if (dist < minDist) {
                minDist = dist;
                targetSnap = snap;
              }
            });

            currentYRef.current = targetSnap;
            controls.start({ y: targetSnap, transition: { type: "spring", stiffness: 300, damping: 30 } });
          }}
          style={{
            pointerEvents: "auto",
            touchAction: "auto",
            animation: isMobile ? "none" : undefined
          }}
        >

          {/* Draggable handle for mobile */}
          {isMobile && (
            <div
              onPointerDown={(e) => dragControls.start(e)}
              style={{ width: "100%", height: "30px", display: "flex", justifyContent: "center", alignItems: "center", cursor: "grab", flexShrink: 0, paddingTop: "8px", touchAction: "none" }}
            >
              <div style={{ width: "50px", height: "5px", backgroundColor: "rgba(255,255,255,0.4)", borderRadius: "3px" }} />
            </div>
          )}

          {/* Modal Background Sparkles */}
          {isAnimationEnabled && (
            <div className="zzz-modal-bg" aria-hidden="true">
              {Array.from({ length: isMobile ? 10 : 30 }).map((_, i) => {
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
                {(() => {
                  const badge = user.titleBadge ? getBadgeById(user.titleBadge) : null;
                  const isSpecial = badge?.rarity === "ekslusif";
                  const isExclusive = badge?.rarity === "super-ekslusif" || badge?.rarity === "developer";

                  const avatarBadgeClass = badge 
                    ? isExclusive 
                      ? `avatar-badge avatar-exclusive-${badge.id}`
                      : isSpecial 
                        ? `avatar-badge avatar-badge-special-${badge.color}`
                        : `avatar-badge avatar-badge-common-${badge.color}`
                    : '';

                  return (
                    <div className="zzz-banner-left">
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        {badge?.id === 'zodiac-horizon' && (
                          <div className="avatar-exclusive-zodiac-horizon-orbit-1 avatar-exclusive-zodiac-horizon-orbit-back" />
                        )}
                        {badge?.id === 'zodiac-horizon' && (
                          <div className="avatar-exclusive-zodiac-horizon-orbit-2 avatar-exclusive-zodiac-horizon-orbit-back" />
                        )}
                        <div 
                          className={`zzz-avatar ${avatarBadgeClass}`} 
                          style={{ '--avatar-radius': '46px', overflow: 'visible', position: 'relative', zIndex: 1 } as any}
                        >
                          <div className={`w-full h-full rounded-full overflow-hidden relative ${isExclusive || isSpecial ? 'public-badge-sweep' : ''}`}>
                            {user.image ? (
                              <img src={user.image} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', position: 'relative', zIndex: 10 }} />
                            ) : (
                              <span style={{ position: 'relative', zIndex: 10 }}>{user.name?.[0]?.toUpperCase() ?? "?"}</span>
                            )}
                          </div>
                        </div>
                        {badge?.id === 'zodiac-horizon' && (
                          <div className="avatar-exclusive-zodiac-horizon-orbit-1 avatar-exclusive-zodiac-horizon-orbit-front" />
                        )}
                        {badge?.id === 'zodiac-horizon' && (
                          <div className="avatar-exclusive-zodiac-horizon-orbit-2 avatar-exclusive-zodiac-horizon-orbit-front" />
                        )}
                      </div>
                      <div className="zzz-user-info">
                        <h1 className="zzz-user-name">{profileTitle || "Pilot"}</h1>
                        {user.username && (
                          <div className="zzz-user-username">@{user.username}</div>
                        )}
                        {badge && (
                          <div className="zodiac-orbit-wrapper" style={{ position: 'relative', width: 'fit-content', marginTop: '4px' }}>
                            {badge.id === 'zodiac-horizon' && (
                              <>
                                <div className="badge-zodiac-orbit-1 badge-zodiac-orbit-back" />
                                <div className="badge-zodiac-orbit-2 badge-zodiac-orbit-back" />
                              </>
                            )}
                            <div className={`badge-card ${isExclusive || isSpecial ? 'public-badge-sweep' : ''} ${badge.effectClass} pr-5 py-1.5 pl-1.5 rounded-full flex items-center gap-2.5 border backdrop-blur-sm shadow-lg`} style={{ position: 'relative', zIndex: 1 }}>
                              {badge.id === 'the-completionist' && <div className="badge-wave-layer" />}
                              {badge.id === 'zodiac-horizon' && <div className="badge-zodiac-wave-layer" />}
                              <div className="badge-icon w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0">
                                <DynamicIcon name={badge.icon} className="w-4 h-4 relative z-10" />
                              </div>
                              <span className="badge-content relative z-10 text-white font-bold tracking-wide text-[13px] drop-shadow-md" style={{marginRight: "1rem"}}>
                                {badge.name}
                              </span>
                            </div>
                            {badge.id === 'zodiac-horizon' && (
                              <>
                                <div className="badge-zodiac-orbit-1 badge-zodiac-orbit-front" />
                                <div className="badge-zodiac-orbit-2 badge-zodiac-orbit-front" />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="zzz-banner-right">
                  <div className="zzz-stats-row">
                    <div className="zzz-stat">
                      <div className="zzz-stat-val">{totalSectorsCount}</div>
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
            <div className="zzz-bio-bar" style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", gap: isMobile ? "1rem" : "0" }}>
              {/* Mobile: Add Friend + Share buttons in 1 row */}
              {isMobile && (
                <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
                  {sessionUser && sessionUser.id !== user.id && user.allowFriendRequests !== false && !isFriendOrPending && (
                    <button
                      className="btn btn-primary"
                      style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", flex: "1" }}
                      disabled={isAddingFriend}
                      onClick={async () => {
                        setIsAddingFriend(true);
                        const res = await sendFriendRequest(user.id);
                        if (res?.error) {
                          toast.error(res.error);
                        } else {
                          toast.success("Friend request sent!");
                        }
                        setIsAddingFriend(false);
                      }}
                    >
                      <UserPlusIcon width={16} height={16} />
                      {isAddingFriend ? "Sending..." : "Add Friend"}
                    </button>
                  )}
                  <button
                    className="btn btn-secondary hover:bg-white/10"
                    style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", flex: "1", background: "rgba(255,255,255,0.05)" }}
                    onClick={() => {
                      if (navigator.share) navigator.share({ title: profileTitle ?? undefined, url: window.location.href }).catch(() => { });
                      else { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }
                    }}
                  >
                    <ShareIcon width={16} height={16} /> Share
                  </button>
                </div>
              )}

              <div className="zzz-bio-text" style={{ flex: 1, textAlign: "center", padding: "0 1rem" }}>"{user.bio || "Exploring the internet galaxy."}"</div>

              <div style={{ display: "flex", gap: "0.5rem", flexDirection: isMobile ? "column" : "row", width: isMobile ? "100%" : "auto", justifyContent: "flex-end" }}>
                {!isMobile && sessionUser && sessionUser.id !== user.id && user.allowFriendRequests !== false && !isFriendOrPending && (
                  <button
                    className="btn btn-primary"
                    style={{ padding: "0.4rem 1rem", fontSize: "0.85rem", borderRadius: "20px", display: "flex", alignItems: "center", gap: "0.5rem" }}
                    disabled={isAddingFriend}
                    onClick={async () => {
                      setIsAddingFriend(true);
                      const res = await sendFriendRequest(user.id);
                      if (res?.error) {
                        toast.error(res.error);
                      } else {
                        toast.success("Friend request sent!");
                      }
                      setIsAddingFriend(false);
                    }}
                  >
                    <UserPlusIcon width={16} height={16} />
                    {isAddingFriend ? "Sending..." : "Add Friend"}
                  </button>
                )}
                {!isMobile && (
                  <button
                    className="btn btn-secondary hover:bg-white/10"
                    style={{ padding: "0.4rem 1rem", fontSize: "0.85rem", borderRadius: "20px", display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.05)" }}
                    onClick={() => {
                      if (navigator.share) navigator.share({ title: profileTitle ?? undefined, url: window.location.href }).catch(() => { });
                      else { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }
                    }}
                  >
                    <ShareIcon width={16} height={16} /> Share
                  </button>
                )}
              </div>
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
                    {s.icon ? <DynamicIcon name={s.icon} /> : "📁"} {s.name}
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
                    className={`zzz-beacon-card ${isAnimationEnabled ? "floating" : ""}`}
                    style={{ "--enter-delay": `${idx * 0.1}s`, animationDelay: isAnimationEnabled ? `${(idx * 0.1)}s, ${(idx * 0.2)}s` : "0s" } as any}
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
        </motion.div>
      </div>

      {selectedBeacon && (
        <BeaconDetailModal
          beacon={selectedBeacon}
          sector={sectors.find((s) => s.id === selectedBeacon.sectorId) ?? null}
          onClose={() => setSelectedBeacon(null)}
          readOnly={true}
        />
      )}

      <FriendsModal
        isOpen={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
        user={sessionUser}
        stats={stats}
        refetchStats={refetchNotifications}
      />
    </>
  );
}

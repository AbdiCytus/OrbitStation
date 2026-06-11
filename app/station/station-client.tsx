"use client";

import { useState, useMemo, useTransition, useCallback, useEffect } from "react";
import type { StationWithSectors, SectorWithBeacons, Beacon } from "@/types";
import BeaconCard from "@/components/beacon-card";
import AddBeaconModal from "@/components/add-beacon-modal";
import AddSectorModal from "@/components/add-sector-modal";
import EditSectorModal from "@/components/edit-sector-modal";
import EditBeaconModal from "@/components/edit-beacon-modal";
import BeaconDetailModal from "@/components/beacon-detail-modal";
import FriendsModal from "@/components/friends-modal";
import StationNavbar from "@/components/station-navbar";
import SpaceBackground from "@/components/space-background";
import StaticStarfield from "@/components/static-starfield";
import { deleteSector } from "@/lib/actions";
import { DynamicIcon } from "@/components/dynamic-icon";
import { PlusIcon, LockClosedIcon, PencilSquareIcon, MagnifyingGlassIcon, SparklesIcon, RocketLaunchIcon, FunnelIcon, ArrowsUpDownIcon, CheckIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  initialStation: StationWithSectors | null;
  user: { id: string; name: string | null; image: string | null; callsign: string | null; animationEnabled: boolean };
};

export default function StationClient({ initialStation, user }: Props) {
  const [station, setStation] = useState(initialStation);
  const [activeSectorId, setActiveSectorId] = useState<string | "all">("all");
  const [displaySectorId, setDisplaySectorId] = useState<string | "all">("all");
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [funFact, setFunFact] = useState("");

  const FUN_FACTS = [
    "Did you know? A day on Venus is longer than a year on Venus.",
    "Neutron stars can spin up to 600 times per second.",
    "There's a planet made almost entirely of diamond twice the size of Earth.",
    "The footprints on the Moon will likely be there for 100 million years.",
    "Space is completely silent. There is no atmosphere to carry sound waves.",
  ];


  // Clear entering class after animation
  useEffect(() => {
    if (isEntering) {
      const t = setTimeout(() => setIsEntering(false), 1000);
      return () => clearTimeout(t);
    }
  }, [isEntering, displaySectorId]);

  const handleTabClick = useCallback((newId: string | "all") => {
    if (newId === displaySectorId || isExiting) return;
    setActiveSectorId(newId);
    if (!user.animationEnabled) {
      setDisplaySectorId(newId);
      return;
    }
    setIsExiting(true);
    setFunFact(FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]);
    let delay = 800;
    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const conn = (navigator as any).connection;
      if (conn.effectiveType === "slow-2g") delay = 3500;
      else if (conn.effectiveType === "2g") delay = 2500;
      else if (conn.effectiveType === "3g") delay = 1500;
    }

    setTimeout(() => {
      setDisplaySectorId(newId);
      setIsExiting(false);
      setIsEntering(true);
    }, delay);
  }, [displaySectorId, isExiting, user.animationEnabled]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVisibility, setFilterVisibility] = useState<"all" | "public" | "private">("all");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "name_asc" | "name_desc" | "sector">("date_desc");
  const [openMenu, setOpenMenu] = useState<"filter" | "sort" | null>(null);
  const [selectedBeacon, setSelectedBeacon] = useState<Beacon | null>(null);
  const [editingBeacon, setEditingBeacon] = useState<Beacon | null>(null);
  const [showAddBeacon, setShowAddBeacon] = useState(false);
  const [showAddSector, setShowAddSector] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [editingSector, setEditingSector] = useState<SectorWithBeacons | null>(null);
  const [, startTransition] = useTransition();

  const sectors = station?.sectors ?? [];

  const visibleBeacons = useMemo(() => {
    let beacons: (Beacon & { _isPublic?: boolean; _sectorOrder?: number; _sectorName?: string })[] = [];
    
    if (displaySectorId === "all") {
      beacons = sectors.flatMap((s) => s.beacons.map(b => ({ ...b, _isPublic: s.isPublic, _sectorOrder: s.order, _sectorName: s.name })));
    } else {
      const s = sectors.find((s) => s.id === displaySectorId);
      beacons = s?.beacons.map(b => ({ ...b, _isPublic: s.isPublic, _sectorOrder: s.order, _sectorName: s.name })) ?? [];
    }

    if (filterVisibility === "public") {
      beacons = beacons.filter(b => b._isPublic);
    } else if (filterVisibility === "private") {
      beacons = beacons.filter(b => !b._isPublic);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      beacons = beacons.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q)
      );
    }

    if (sortBy === "name_asc") {
      beacons.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "name_desc") {
      beacons.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === "sector") {
      beacons.sort((a, b) => {
        const orderDiff = (a._sectorOrder ?? 0) - (b._sectorOrder ?? 0);
        if (orderDiff !== 0) return orderDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else if (sortBy === "date_asc") {
      beacons.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else { // date_desc
      beacons.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return beacons;
  }, [sectors, displaySectorId, searchQuery, filterVisibility, sortBy]);

  const [cols, setCols] = useState(6);
  useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth <= 480) setCols(1);
      else if (window.innerWidth <= 768) setCols(2);
      else if (window.innerWidth <= 1024) setCols(3);
      else if (window.innerWidth <= 1400) setCols(4);
      else setCols(6);
    };
    updateCols();
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, []);

  const columnWrapper = useMemo(() => {
    const wrapper = Array.from({ length: cols }, () => [] as { beacon: Beacon, globalIndex: number }[]);
    visibleBeacons.forEach((beacon, index) => {
      wrapper[index % cols].push({ beacon, globalIndex: index });
    });
    return wrapper;
  }, [visibleBeacons, cols]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("beacon-search-input")?.focus();
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".custom-dropdown")) {
        setOpenMenu(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const activeSector = sectors.find((s) => s.id === displaySectorId) ?? null;

  // ── Handlers ────────────────────────────────────────────────
  const handleSectorCreated = useCallback((newSector: SectorWithBeacons) => {
    setStation((prev) => {
      if (!prev) return prev;
      return { ...prev, sectors: [...prev.sectors, newSector] };
    });
    setActiveSectorId(newSector.id);
    setDisplaySectorId(newSector.id);
    setShowAddSector(false);
  }, []);

  const handleSectorUpdated = useCallback((updated: SectorWithBeacons) => {
    setStation((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sectors: prev.sectors.map((s) => s.id === updated.id ? { ...s, ...updated } : s),
      };
    });
    setEditingSector(null);
  }, []);

  const handleBeaconCreated = useCallback((newBeacon: Beacon) => {
    setStation((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sectors: prev.sectors.map((s) =>
          s.id === newBeacon.sectorId
            ? { ...s, beacons: [...s.beacons, newBeacon] }
            : s
        ),
      };
    });
    setShowAddBeacon(false);
  }, []);

  const handleBeaconUpdated = useCallback((updated: Beacon) => {
    setStation((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sectors: prev.sectors.map((s) => ({
          ...s,
          beacons: s.beacons.map((b) => b.id === updated.id ? updated : b),
        })),
      };
    });
    setEditingBeacon(null);
    setSelectedBeacon(null);
  }, []);

  const handleBeaconDeleted = useCallback((beaconId: string) => {
    setStation((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sectors: prev.sectors.map((s) => ({
          ...s,
          beacons: s.beacons.filter((b) => b.id !== beaconId),
        })),
      };
    });
    setSelectedBeacon(null);
    setEditingBeacon(null);
  }, []);

  const handleSectorDelete = useCallback((sectorId: string, moveToSectorId?: string) => {
    startTransition(async () => {
      const result = await deleteSector(sectorId, moveToSectorId);
      if (!result.error) {
        setStation((prev) => {
          if (!prev) return prev;
          let remaining = prev.sectors;
          if (moveToSectorId) {
            const deletedSector = remaining.find(s => s.id === sectorId);
            if (deletedSector && deletedSector.beacons.length > 0) {
              remaining = remaining.map(s => {
                if (s.id === moveToSectorId) {
                  return { ...s, beacons: [...s.beacons, ...deletedSector.beacons] };
                }
                return s;
              });
            }
          }
          remaining = remaining.filter((s) => s.id !== sectorId);
          return { ...prev, sectors: remaining };
        });
        setActiveSectorId("all");
        setDisplaySectorId("all");
        setEditingSector(null);
      }
    });
  }, [startTransition]);

  const displayName = user.callsign ?? user.name ?? "Pilot";
  const animEnabled = user.animationEnabled;

  return (
    <div className={`station-root${animEnabled ? "" : " no-animation"}`}>
      {/* Animated space canvas background or static fallback */}
      {animEnabled ? (
        <SpaceBackground 
          key="on" 
          sector={activeSectorId} 
          sectorColor={activeSector?.color} 
          animEnabled={true} 
          transitionDuration={(() => {
            if (typeof navigator !== "undefined" && "connection" in navigator) {
              const conn = (navigator as any).connection;
              if (conn.effectiveType === "slow-2g") return 3500;
              if (conn.effectiveType === "2g") return 2500;
              if (conn.effectiveType === "3g") return 1500;
            }
            return 800;
          })()}
        />
      ) : (
        <StaticStarfield 
          seed={activeSectorId ? activeSectorId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) : 42} 
          sectorColor={activeSector?.color} 
        />
      )}

      {/* Fun fact overlay */}
      {isExiting && user.animationEnabled && (
        <div className="fun-fact-overlay" style={{ animationDuration: (() => {
            if (typeof navigator !== "undefined" && "connection" in navigator) {
              const conn = (navigator as any).connection;
              if (conn.effectiveType === "slow-2g") return "3.5s";
              if (conn.effectiveType === "2g") return "2.5s";
              if (conn.effectiveType === "3g") return "1.5s";
            }
            return "0.8s";
          })() }}>
          <p className="fun-fact-text">
            <SparklesIcon width={20} height={20} style={{ display: "inline-block", marginRight: "0.5rem", verticalAlign: "middle" }} />
            {funFact}
          </p>
        </div>
      )}

      {/* Navbar */}
      <StationNavbar
        user={{ ...user, callsign: user.callsign }}
        hideSearch={true}
        displayName={displayName}
        onOpenFriends={() => setShowFriendsModal(true)}
      />

      <div className="station-layout">
        {/* Sidebar */}
        <aside className="station-sidebar glass">
          <div className="sidebar-header">
            <span className="sidebar-label">Sectors</span>
            <button
              id="btn-add-sector"
              className="btn-icon"
              title="Add new sector"
              onClick={() => setShowAddSector(true)}
            >
              <PlusIcon width={16} height={16} />
            </button>
          </div>

          <nav className="sector-list">
            <button
              id="tab-all"
              className={`sector-tab ${activeSectorId === "all" ? "active" : ""}`}
              onClick={() => handleTabClick("all")}
            >
              <span className="sector-tab-icon"><DynamicIcon name="GlobeAltIcon" /></span>
              <span className="sector-tab-name">All Beacons</span>
              <span className="sector-tab-count">
                {sectors.reduce((a, s) => a + s.beacons.length, 0)}
              </span>
            </button>

            {sectors.map((sector) => (
              <div key={sector.id} className="sector-tab-wrapper">
                <button
                  id={`tab-sector-${sector.id}`}
                  className={`sector-tab ${activeSectorId === sector.id ? "active" : ""}`}
                  onClick={() => handleTabClick(sector.id)}
                  style={activeSectorId === sector.id && sector.color
                    ? { borderLeftColor: sector.color, color: sector.color }
                    : undefined}
                >
                  <span className="sector-tab-icon"><DynamicIcon name={sector.icon} /></span>
                  <span className="sector-tab-name">
                    {sector.name}
                  </span>
                  <div
                    className="sector-tab-edit-btn"
                    onClick={(e) => { e.stopPropagation(); setEditingSector(sector); }}
                    title="Edit sector"
                    aria-label={`Edit ${sector.name}`}
                  >
                    <PencilSquareIcon width={14} height={14} />
                  </div>
                </button>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="station-main">
          <div className="station-section-header">
            <div>
              <h2 className="station-section-title">
                {displaySectorId === "all"
                  ? "All Beacons"
                  : <><DynamicIcon name={activeSector?.icon} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "0.25rem", width: "24px", height: "24px" }} /> {activeSector?.name ?? ""} {activeSector && !activeSector.isPublic && <LockClosedIcon width={20} height={20} style={{ display: "inline-block", verticalAlign: "middle", marginLeft: "0.5rem", opacity: 0.5 }} title="Private Sector" />}</>}
              </h2>
              <p className="station-section-sub">
                {visibleBeacons.length} beacon{visibleBeacons.length !== 1 ? "s" : ""}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>
            {sectors.length > 0 && (
              <button
                id="btn-add-beacon"
                className="btn btn-primary"
                onClick={() => setShowAddBeacon(true)}
                title="Add new beacon"
              >
                + Add Beacon
              </button>
            )}
          </div>

          <div key={`controls-${displaySectorId}`} className={`controls-anim-container ${isExiting ? "exiting" : isEntering ? "entering" : ""}`} style={{ marginBottom: "0.5rem", position: "relative", zIndex: 10 }}>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <style dangerouslySetInnerHTML={{__html: `
                .custom-dropdown-btn {
                  height: 38px;
                  width: 38px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 0;
                  border-radius: 8px;
                  transition: all 0.2s;
                  cursor: pointer;
                }
                .custom-dropdown-btn:hover {
                  background: rgba(139, 92, 246, 0.4) !important;
                  border-color: #a78bfa !important;
                  color: #fff !important;
                }
                .dropdown-option-btn:hover { background: rgba(139, 92, 246, 0.4) !important; }
                .staggered-item { }
                .entering .staggered-item {
                  animation-name: zoomInControl;
                  animation-duration: 0.3s;
                  animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275);
                  animation-fill-mode: backwards;
                }
                .exiting .staggered-item {
                  animation-name: zoomOutControl;
                  animation-duration: 0.2s;
                  animation-timing-function: ease-in;
                  animation-fill-mode: forwards;
                }
                .staggered-item:nth-child(2) { animation-delay: 0.0s; }
                .staggered-item:nth-child(3) { animation-delay: 0.05s; }
                .staggered-item:nth-child(4) { animation-delay: 0.1s; }
                
                @keyframes zoomInControl {
                  from { opacity: 0; transform: scale(0.8); }
                  to { opacity: 1; transform: scale(1); }
                }
                @keyframes zoomOutControl {
                  from { opacity: 1; transform: scale(1); }
                  to { opacity: 0; transform: scale(0.8); }
                }
                @keyframes floatControls {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-4px); }
                }
                .floating-controls { animation: floatControls 5s ease-in-out infinite; }
              `}} />
              
              {displaySectorId === "all" && (
                <div className="staggered-item">
                  <div className={`custom-dropdown ${user.animationEnabled ? "floating-controls" : ""}`} style={{ position: "relative" }}>
                    <button
                      className="custom-dropdown-btn"
                      style={{ background: filterVisibility !== "all" ? "rgba(139, 92, 246, 0.2)" : "rgba(15, 15, 25, 0.6)", border: `1px solid ${filterVisibility !== "all" ? "#a78bfa" : "rgba(255, 255, 255, 0.1)"}`, color: filterVisibility !== "all" ? "#fff" : "#a1a1aa" }}
                      onClick={() => setOpenMenu(openMenu === "filter" ? null : "filter")}
                      title="Filter by Visibility"
                    >
                      <FunnelIcon width={18} height={18} />
                    </button>
                    {openMenu === "filter" && (
                      <div style={{ position: "absolute", top: "calc(100% + 0.5rem)", left: 0, background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.5rem", zIndex: 50, minWidth: "150px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {[
                          { id: "all", label: "All Visibility" },
                          { id: "public", label: "Public" },
                          { id: "private", label: "Private" }
                        ].map(opt => (
                          <button
                            key={opt.id}
                            className="dropdown-option-btn"
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem", background: filterVisibility === opt.id ? "rgba(139, 92, 246, 0.2)" : "transparent", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", textAlign: "left", fontSize: "0.85rem", transition: "all 0.2s" }}
                            onClick={() => { setFilterVisibility(opt.id as any); setOpenMenu(null); }}
                          >
                            {opt.label}
                            {filterVisibility === opt.id && <CheckIcon width={14} height={14} style={{ color: "#a78bfa" }} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="staggered-item">
                <div className={`custom-dropdown ${user.animationEnabled ? "floating-controls" : ""}`} style={{ position: "relative" }}>
                  <button
                    className="custom-dropdown-btn"
                    style={{ background: sortBy !== "date_desc" ? "rgba(139, 92, 246, 0.2)" : "rgba(15, 15, 25, 0.6)", border: `1px solid ${sortBy !== "date_desc" ? "#a78bfa" : "rgba(255, 255, 255, 0.1)"}`, color: sortBy !== "date_desc" ? "#fff" : "#a1a1aa" }}
                    onClick={() => setOpenMenu(openMenu === "sort" ? null : "sort")}
                    title="Sort Beacons"
                  >
                    <ArrowsUpDownIcon width={18} height={18} />
                  </button>
                  {openMenu === "sort" && (
                    <div style={{ position: "absolute", top: "calc(100% + 0.5rem)", left: 0, background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.5rem", zIndex: 50, minWidth: "180px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {[
                        { id: "date_desc", label: "Date Added (Newest)" },
                        { id: "date_asc", label: "Date Added (Oldest)" },
                        { id: "name_asc", label: "Name (A-Z)" },
                        { id: "name_desc", label: "Name (Z-A)" },
                        { id: "sector", label: "Sector Order" }
                      ].filter(opt => opt.id !== "sector" || displaySectorId === "all").map(opt => (
                        <button
                          key={opt.id}
                          className="dropdown-option-btn"
                          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem", background: sortBy === opt.id ? "rgba(139, 92, 246, 0.2)" : "transparent", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", textAlign: "left", fontSize: "0.85rem", transition: "all 0.2s" }}
                          onClick={() => { setSortBy(opt.id as any); setOpenMenu(null); }}
                        >
                          {opt.label}
                          {sortBy === opt.id && <CheckIcon width={14} height={14} style={{ color: "#a78bfa" }} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {displaySectorId === "all" && (
                <div className="staggered-item" style={{ flex: 1, minWidth: "200px", maxWidth: "250px" }}>
                  <div className={`${user.animationEnabled ? "floating-controls" : ""}`} style={{ position: "relative", width: "100%", animationDelay: "0.4s" }}>
                    <MagnifyingGlassIcon style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", color: "#a1a1aa" }} />
                    <input
                      id="beacon-search-input"
                      type="text"
                      placeholder="Search beacons... (Ctrl+K)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: "100%",
                        height: "38px",
                        background: "rgba(15, 15, 25, 0.6)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        padding: "0 1rem 0 36px",
                        color: "#fff",
                        outline: "none",
                        transition: "all 0.2s"
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#a78bfa"}
                      onBlur={(e) => e.target.style.borderColor = "rgba(255, 255, 255, 0.1)"}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Beacon masonry grid */}
          {visibleBeacons.length === 0 ? (
            <div className={`station-empty ${isExiting ? "exiting" : isEntering ? "entering" : ""}`} key={`empty-${displaySectorId}-${filterVisibility}-${searchQuery}`}>
              {sectors.length === 0 ? (
                <>
                  <div className="station-empty-icon"><RocketLaunchIcon width={48} height={48} /></div>
                  <p className="station-empty-title">Your Station is empty</p>
                  <p className="station-empty-sub">
                    Create your first Sector to start organizing your web shortcuts.
                  </p>
                  <button className="btn btn-primary" onClick={() => setShowAddSector(true)}>
                    + Create First Sector
                  </button>
                </>
              ) : (
                <>
                  <div className="station-empty-icon">{searchQuery ? <MagnifyingGlassIcon width={48} height={48} /> : <SparklesIcon width={48} height={48} />}</div>
                  <p className="station-empty-title">
                    {searchQuery ? "No beacons found" : filterVisibility === "private" ? "No private beacons" : filterVisibility === "public" ? "No public beacons" : "No beacons yet"}
                  </p>
                  <p className="station-empty-sub">
                    {searchQuery
                      ? `Try a different search term`
                      : filterVisibility === "private" ? "There's no private sector or beacon in private sector." : filterVisibility === "public" ? "There's no public sector or beacon in public sector." : "Add your first web shortcut to this sector."}
                  </p>
                  {!searchQuery && filterVisibility === "all" && (
                    <button className="btn btn-primary" onClick={() => setShowAddBeacon(true)}>
                      + Add Beacon
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className={`beacon-masonry ${isExiting ? "exiting" : isEntering ? "entering" : ""}`} key={displaySectorId}>
              {columnWrapper.map((colItems, colIndex) => (
                <div className="beacon-masonry-col" key={`col-${colIndex}`}>
                  <AnimatePresence>
                    {colItems.map(({ beacon, globalIndex }) => (
                      <motion.div
                        layout={user.animationEnabled}
                        layoutId={user.animationEnabled ? `${displaySectorId}-${beacon.id}` : undefined}
                        initial={user.animationEnabled ? { opacity: 0, scale: 0.8 } : false}
                        animate={user.animationEnabled ? { opacity: 1, scale: 1 } : false}
                        exit={user.animationEnabled ? { opacity: 0, scale: 0.8 } : false}
                        transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
                        key={beacon.id}
                      >
                        <BeaconCard
                          beacon={beacon}
                          index={globalIndex}
                          onClick={() => setSelectedBeacon(beacon)}
                          onEdit={() => setEditingBeacon(beacon)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <FriendsModal 
        isOpen={showFriendsModal} 
        onClose={() => setShowFriendsModal(false)} 
        user={user} 
      />

      {/* Modals */}
      {showAddSector && (
        <AddSectorModal
          onClose={() => setShowAddSector(false)}
          onCreated={handleSectorCreated}
        />
      )}

      {showAddBeacon && (
        <AddBeaconModal
          sectors={sectors}
          defaultSectorId={activeSectorId !== "all" ? activeSectorId : undefined}
          onClose={() => setShowAddBeacon(false)}
          onCreated={handleBeaconCreated}
        />
      )}

      {editingSector && (
        <EditSectorModal
          sector={editingSector}
          sectors={sectors}
          onClose={() => setEditingSector(null)}
          onUpdated={handleSectorUpdated}
          onDeleted={handleSectorDelete}
        />
      )}

      {editingBeacon && (
        <EditBeaconModal
          beacon={editingBeacon}
          sectors={sectors}
          onClose={() => setEditingBeacon(null)}
          onUpdated={handleBeaconUpdated}
          onDeleted={handleBeaconDeleted}
        />
      )}

      {selectedBeacon && !editingBeacon && (
        <BeaconDetailModal
          beacon={selectedBeacon}
          sector={sectors.find((s) => s.id === selectedBeacon.sectorId) ?? null}
          onClose={() => setSelectedBeacon(null)}
          onUpdated={handleBeaconUpdated}
          onDeleted={handleBeaconDeleted}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useMemo, useTransition, useCallback, useEffect } from "react";
import type { StationWithSectors, SectorWithBeacons, Beacon } from "@/types";
import BeaconCard from "@/components/beacon-card";
import AddBeaconModal from "@/components/add-beacon-modal";
import AddSectorModal from "@/components/add-sector-modal";
import EditSectorModal from "@/components/edit-sector-modal";
import EditBeaconModal from "@/components/edit-beacon-modal";
import BeaconDetailModal from "@/components/beacon-detail-modal";
import StationNavbar from "@/components/station-navbar";
import SpaceBackground from "@/components/space-background";
import StaticStarfield from "@/components/static-starfield";
import { deleteSector } from "@/lib/actions";
import { DynamicIcon } from "@/components/dynamic-icon";
import { PlusIcon, LockClosedIcon, PencilSquareIcon, MagnifyingGlassIcon, SparklesIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";

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
  const [selectedBeacon, setSelectedBeacon] = useState<Beacon | null>(null);
  const [editingBeacon, setEditingBeacon] = useState<Beacon | null>(null);
  const [showAddBeacon, setShowAddBeacon] = useState(false);
  const [showAddSector, setShowAddSector] = useState(false);
  const [editingSector, setEditingSector] = useState<SectorWithBeacons | null>(null);
  const [, startTransition] = useTransition();

  const sectors = station?.sectors ?? [];

  const visibleBeacons = useMemo(() => {
    let beacons: Beacon[] = [];
    if (displaySectorId === "all") {
      beacons = sectors.flatMap((s) => s.beacons);
      beacons.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      beacons = sectors.find((s) => s.id === displaySectorId)?.beacons ?? [];
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
    return beacons;
  }, [sectors, activeSectorId, displaySectorId, searchQuery]);

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

  const handleSectorDelete = useCallback((sectorId: string) => {
    startTransition(async () => {
      const result = await deleteSector(sectorId);
      if (!result.error) {
        setStation((prev) => {
          if (!prev) return prev;
          const remaining = prev.sectors.filter((s) => s.id !== sectorId);
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

      {/* Fun Fact Overlay */}
      {isExiting && animEnabled && (
        <div className="fun-fact-overlay">
          <p className="fun-fact-text">
            <SparklesIcon width={20} height={20} style={{ display: "inline-block", marginRight: "0.5rem", verticalAlign: "middle" }} />
            {funFact}
          </p>
        </div>
      )}

      {/* Navbar */}
      <StationNavbar
        user={{ ...user, callsign: user.callsign }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        displayName={displayName}
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

          {/* Beacon masonry grid */}
          {visibleBeacons.length === 0 ? (
            <div className={`station-empty ${isExiting ? "exiting" : isEntering ? "entering" : ""}`} key={`empty-${displaySectorId}`}>
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
                    {searchQuery ? "No beacons found" : "No beacons yet"}
                  </p>
                  <p className="station-empty-sub">
                    {searchQuery
                      ? `Try a different search term`
                      : "Add your first web shortcut to this sector."}
                  </p>
                  {!searchQuery && (
                    <button className="btn btn-primary" onClick={() => setShowAddBeacon(true)}>
                      + Add Beacon
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className={`beacon-masonry ${isExiting ? "exiting" : isEntering ? "entering" : ""}`} key={displaySectorId}>
              {visibleBeacons.map((beacon, index) => (
                <BeaconCard
                  key={beacon.id}
                  beacon={beacon}
                  index={index}
                  onClick={() => setSelectedBeacon(beacon)}
                  onEdit={() => setEditingBeacon(beacon)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

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

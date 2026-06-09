"use client";

import { useState, useMemo, useTransition } from "react";
import type { StationWithSectors, SectorWithBeacons, Beacon } from "@/types";
import BeaconCard from "@/components/beacon-card";
import AddBeaconModal from "@/components/add-beacon-modal";
import AddSectorModal from "@/components/add-sector-modal";
import BeaconDetailModal from "@/components/beacon-detail-modal";
import StationNavbar from "@/components/station-navbar";
import { deleteSector } from "@/lib/actions";

type Props = {
  initialStation: StationWithSectors | null;
  user: { id: string; name: string | null; image: string | null };
};

export default function StationClient({ initialStation, user }: Props) {
  const [station, setStation] = useState(initialStation);
  const [activeSectorId, setActiveSectorId] = useState<string | "all">(
    initialStation?.sectors[0]?.id ?? "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBeacon, setSelectedBeacon] = useState<Beacon | null>(null);
  const [showAddBeacon, setShowAddBeacon] = useState(false);
  const [showAddSector, setShowAddSector] = useState(false);
  const [, startTransition] = useTransition();

  const sectors = station?.sectors ?? [];

  // Filter beacons based on active sector and search query
  const visibleBeacons = useMemo(() => {
    let beacons: Beacon[] = [];
    if (activeSectorId === "all") {
      beacons = sectors.flatMap((s) => s.beacons);
    } else {
      beacons = sectors.find((s) => s.id === activeSectorId)?.beacons ?? [];
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
  }, [sectors, activeSectorId, searchQuery]);

  const activeSector = sectors.find((s) => s.id === activeSectorId) ?? null;

  function handleSectorCreated(newSector: SectorWithBeacons) {
    setStation((prev) => {
      if (!prev) return prev;
      return { ...prev, sectors: [...prev.sectors, newSector] };
    });
    setActiveSectorId(newSector.id);
    setShowAddSector(false);
  }

  function handleBeaconCreated(newBeacon: Beacon) {
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
  }

  function handleBeaconDeleted(beaconId: string) {
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
  }

  function handleSectorDelete(sectorId: string) {
    startTransition(async () => {
      const result = await deleteSector(sectorId);
      if (!result.error) {
        setStation((prev) => {
          if (!prev) return prev;
          const remaining = prev.sectors.filter((s) => s.id !== sectorId);
          return { ...prev, sectors: remaining };
        });
        setActiveSectorId(
          station?.sectors.find((s) => s.id !== sectorId)?.id ?? "all"
        );
      }
    });
  }

  return (
    <div className="station-root">
      {/* Starfield */}
      <div className="station-bg" aria-hidden="true">
        <div className="nebula-blob nb1" />
        <div className="nebula-blob nb2" />
      </div>

      {/* Navbar */}
      <StationNavbar
        user={user}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="station-layout">
        {/* Sidebar — Sector tabs */}
        <aside className="station-sidebar glass">
          <div className="sidebar-header">
            <span className="sidebar-label">Sectors</span>
            <button
              id="btn-add-sector"
              className="btn-icon"
              title="Add new sector"
              onClick={() => setShowAddSector(true)}
            >
              +
            </button>
          </div>

          <nav className="sector-list">
            <button
              id="tab-all"
              className={`sector-tab ${activeSectorId === "all" ? "active" : ""}`}
              onClick={() => setActiveSectorId("all")}
            >
              <span className="sector-tab-icon">🌌</span>
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
                  onClick={() => setActiveSectorId(sector.id)}
                >
                  <span className="sector-tab-icon">{sector.icon ?? "📁"}</span>
                  <span className="sector-tab-name">{sector.name}</span>
                  <span className="sector-tab-count">{sector.beacons.length}</span>
                </button>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="station-main">
          {/* Section header */}
          <div className="station-section-header">
            <div>
              <h2 className="station-section-title">
                {activeSectorId === "all"
                  ? "All Beacons"
                  : (activeSector?.icon ?? "📁") + " " + (activeSector?.name ?? "")}
              </h2>
              <p className="station-section-sub">
                {visibleBeacons.length} beacon{visibleBeacons.length !== 1 ? "s" : ""}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>
            <button
              id="btn-add-beacon"
              className="btn btn-primary"
              onClick={() => setShowAddBeacon(true)}
              disabled={sectors.length === 0}
              title={sectors.length === 0 ? "Create a sector first" : "Add new beacon"}
            >
              + Add Beacon
            </button>
          </div>

          {/* Beacon grid */}
          {visibleBeacons.length === 0 ? (
            <div className="station-empty">
              {sectors.length === 0 ? (
                <>
                  <div className="station-empty-icon">🛸</div>
                  <p className="station-empty-title">Your Station is empty</p>
                  <p className="station-empty-sub">
                    Create your first Sector to start organizing your web shortcuts.
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowAddSector(true)}
                  >
                    + Create First Sector
                  </button>
                </>
              ) : (
                <>
                  <div className="station-empty-icon">
                    {searchQuery ? "🔭" : "✨"}
                  </div>
                  <p className="station-empty-title">
                    {searchQuery ? "No beacons found" : "No beacons yet"}
                  </p>
                  <p className="station-empty-sub">
                    {searchQuery
                      ? `Try a different search term`
                      : "Add your first web shortcut to this sector."}
                  </p>
                  {!searchQuery && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowAddBeacon(true)}
                    >
                      + Add Beacon
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="beacon-grid">
              {visibleBeacons.map((beacon) => (
                <BeaconCard
                  key={beacon.id}
                  beacon={beacon}
                  onClick={() => setSelectedBeacon(beacon)}
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

      {selectedBeacon && (
        <BeaconDetailModal
          beacon={selectedBeacon}
          sector={sectors.find((s) => s.id === selectedBeacon.sectorId) ?? null}
          onClose={() => setSelectedBeacon(null)}
          onDeleted={handleBeaconDeleted}
        />
      )}
    </div>
  );
}

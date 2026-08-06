"use client";

import React from "react";
import type { Beacon, SectorWithBeacons } from "@/types";
import BeaconCard from "@/components/beacon-card";
import {
  RocketLaunchIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

type BeaconGridViewProps = {
  visibleBeacons: Beacon[];
  paginatedBeacons: Beacon[];
  columnWrapper: { beacon: Beacon; globalIndex: number }[][];
  viewMode: "masonry" | "grid";
  displaySectorId: string | "all";
  allSectorsCount: number;
  allCollabSectors: SectorWithBeacons[];
  filterVisibility: "all" | "public" | "private";
  searchQuery: string;
  visitingProfile?: any;
  isCurrentSectorAdminOrOwner: boolean;
  user: { animationEnabled: boolean; hologramEnabled?: boolean };
  isExiting: boolean;
  isEntering: boolean;
  isFilterExiting: boolean;
  isFilterEntering: boolean;
  shrinkingBeacons: Set<string>;
  growingBeacons: Set<string>;
  onSelectBeacon: (beacon: Beacon) => void;
  onEditBeacon: (beacon: Beacon) => void;
  onAddSector: () => void;
  onAddBeacon: () => void;
};

export default function BeaconGridView({
  visibleBeacons,
  paginatedBeacons,
  columnWrapper,
  viewMode,
  displaySectorId,
  allSectorsCount,
  allCollabSectors,
  filterVisibility,
  searchQuery,
  visitingProfile,
  isCurrentSectorAdminOrOwner,
  user,
  isExiting,
  isEntering,
  isFilterExiting,
  isFilterEntering,
  shrinkingBeacons,
  growingBeacons,
  onSelectBeacon,
  onEditBeacon,
  onAddSector,
  onAddBeacon,
}: BeaconGridViewProps) {
  if (visibleBeacons.length === 0) {
    return (
      <div
        className={`station-empty ${isExiting && user.animationEnabled ? "exiting" : isEntering && user.animationEnabled ? "entering" : ""}`}
        key={`empty-${displaySectorId}-${filterVisibility}-${searchQuery}`}>
        {allSectorsCount === 0 ? (
          <>
            <div className="station-empty-icon">
              <RocketLaunchIcon width={48} height={48} />
            </div>
            <p className="station-empty-title">
              {visitingProfile
                ? "This Station is empty"
                : "Your Station is empty"}
            </p>
            <p className="station-empty-sub">
              {visitingProfile
                ? "This pilot hasn't created any sectors yet."
                : "Create your first Sector to start organizing your web shortcuts."}
            </p>
            {isCurrentSectorAdminOrOwner && (
              <button className="btn btn-primary" onClick={onAddSector}>
                + Create First Sector
              </button>
            )}
          </>
        ) : (
          <>
            <div className="station-empty-icon">
              {searchQuery ? (
                <MagnifyingGlassIcon width={48} height={48} />
              ) : (
                <SparklesIcon width={48} height={48} />
              )}
            </div>
            <p className="station-empty-title">
              {searchQuery
                ? "No beacons found"
                : filterVisibility === "private"
                  ? "No private beacons"
                  : filterVisibility === "public"
                    ? "No public beacons"
                    : "No beacons yet"}
            </p>
            <p className="station-empty-sub">
              {searchQuery
                ? `Try a different search term`
                : filterVisibility === "private"
                  ? "There's no private sector or beacon in private sector."
                  : filterVisibility === "public"
                    ? "There's no public sector or beacon in public sector."
                    : "Add your first web shortcut to this sector."}
            </p>
            {!searchQuery &&
              filterVisibility === "all" &&
              isCurrentSectorAdminOrOwner && (
                <button className="btn btn-primary" onClick={onAddBeacon}>
                  + Add Beacon
                </button>
              )}
          </>
        )}
      </div>
    );
  }

  return (
    <>
      {viewMode === "grid" && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
            .beacon-grid-view { display: grid; gap: 1rem; align-items: stretch; width: 100%; padding-bottom: 2rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
            @media (min-width: 640px) { .beacon-grid-view { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
            @media (min-width: 1024px) { .beacon-grid-view { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
            @media (min-width: 1280px) { .beacon-grid-view { grid-template-columns: repeat(6, minmax(0, 1fr)); } }
            .beacon-grid-view .beacon-card-wrapper { display: flex; height: 100%; width: 100%; }
            .beacon-grid-view .beacon-card { display: flex; flex-direction: column; height: 100%; max-height: 320px; overflow: hidden; width: 100%; margin: 0; }
            .beacon-grid-view .beacon-card-image { height: 130px !important; min-height: 130px !important; aspect-ratio: unset !important; }
            .beacon-grid-view .beacon-card-image > img { height: 100%; object-fit: cover; }
            .beacon-grid-view .beacon-card .beacon-card-body { flex: 1; overflow-y: auto; }
            .beacon-grid-view .beacon-card-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
            .beacon-grid-view .beacon-card-desc { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; white-space: normal; }
          `,
          }}
        />
      )}
      <div
        className={`${viewMode === "masonry" ? "beacon-masonry" : "beacon-grid-view"} ${isExiting && user.animationEnabled ? "exiting" : isEntering && user.animationEnabled ? "entering" : ""}`}
        key={`${displaySectorId}-${viewMode}`}>
        {viewMode === "masonry"
          ? columnWrapper.map((colItems, colIndex) => (
              <div className="beacon-masonry-col" key={`col-${colIndex}`}>
                {colItems.map(({ beacon, globalIndex }) => (
                  <div
                    className={`
                      beacon-card-wrapper
                      ${isFilterExiting ? "beacon-filter-exiting" : ""}
                      ${isFilterEntering ? "beacon-filter-entering" : ""}
                      ${shrinkingBeacons.has(beacon.id) ? "beacon-shrinking" : ""}
                      ${growingBeacons.has(beacon.id) ? "beacon-growing" : ""}
                    `}
                    style={{
                      animation: user.animationEnabled
                        ? `beacon-enter 0.4s cubic-bezier(0.22, 1, 0.36, 1) backwards`
                        : "none",
                      animationDelay: user.animationEnabled
                        ? `${(globalIndex % 6) * 0.05}s`
                        : "0s",
                      transformOrigin: "center center",
                    }}
                    key={beacon.id}>
                    <BeaconCard
                      beacon={beacon}
                      onClick={() => onSelectBeacon(beacon)}
                      onEdit={
                        isCurrentSectorAdminOrOwner
                          ? () => onEditBeacon(beacon)
                          : undefined
                      }
                      index={globalIndex}
                      isCollab={allCollabSectors.some(
                        (s) => s.id === beacon.sectorId,
                      )}
                      sectorName={(beacon as any)._sectorName}
                      isAllBeacons={displaySectorId === "all"}
                      hologramEnabled={user.hologramEnabled ?? false}
                    />
                  </div>
                ))}
              </div>
            ))
          : paginatedBeacons.map((beacon, globalIndex) => (
              <div
                className={`
                  beacon-card-wrapper
                  ${isFilterExiting ? "beacon-filter-exiting" : ""}
                  ${isFilterEntering ? "beacon-filter-entering" : ""}
                  ${shrinkingBeacons.has(beacon.id) ? "beacon-shrinking" : ""}
                  ${growingBeacons.has(beacon.id) ? "beacon-growing" : ""}
                `}
                style={{
                  animation: user.animationEnabled
                    ? `beacon-enter 0.4s cubic-bezier(0.22, 1, 0.36, 1) backwards`
                    : "none",
                  animationDelay: user.animationEnabled
                    ? `${(globalIndex % 6) * 0.05}s`
                    : "0s",
                  transformOrigin: "center center",
                }}
                key={beacon.id}>
                <BeaconCard
                  beacon={beacon}
                  onClick={() => onSelectBeacon(beacon)}
                  onEdit={
                    isCurrentSectorAdminOrOwner
                      ? () => onEditBeacon(beacon)
                      : undefined
                  }
                  index={globalIndex}
                  isCollab={allCollabSectors.some(
                    (s) => s.id === beacon.sectorId,
                  )}
                  sectorName={(beacon as any)._sectorName}
                  isAllBeacons={displaySectorId === "all"}
                  hologramEnabled={user.hologramEnabled ?? false}
                />
              </div>
            ))}
      </div>
    </>
  );
}

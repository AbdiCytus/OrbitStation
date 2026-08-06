"use client";

import React from "react";
import type { SectorWithBeacons, StationWithSectors } from "@/types";
import { DynamicIcon } from "@/components/dynamic-icon";
import {
  PlusIcon,
  PencilSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

type StationSidebarProps = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  activeSectorId: string | "all";
  handleTabClick: (sectorId: string | "all") => void;
  visitingProfile?: any;
  personalSectors: SectorWithBeacons[];
  allCollabSectors: SectorWithBeacons[];
  station: StationWithSectors | null;
  user: { animationEnabled: boolean };
  isIdle: boolean;
  isAnyModalOpen: boolean;
  draggedSectorIndex: number | null;
  dragOverSectorIndex: number | null;
  handleSectorDragStart: (e: React.DragEvent, index: number) => void;
  handleSectorDragOver: (e: React.DragEvent, index: number) => void;
  handleSectorDrop: (e: React.DragEvent, index: number) => void;
  handleSectorDragEnd: () => void;
  onAddSector: () => void;
  onEditSector: (sector: SectorWithBeacons) => void;
  onViewMembers: (sector: SectorWithBeacons) => void;
};

export default function StationSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  activeSectorId,
  handleTabClick,
  visitingProfile,
  personalSectors,
  allCollabSectors,
  station,
  user,
  isIdle,
  isAnyModalOpen,
  draggedSectorIndex,
  dragOverSectorIndex,
  handleSectorDragStart,
  handleSectorDragOver,
  handleSectorDrop,
  handleSectorDragEnd,
  onAddSector,
  onEditSector,
  onViewMembers,
}: StationSidebarProps) {
  return (
    <>
      {/* Mobile Sidebar Toggle Button */}
      {!isAnyModalOpen && (
        <div
          className="mobile-only sidebar-toggle-btn"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{
            position: "fixed",
            left: isSidebarOpen ? "260px" : "0",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 101, // Above backdrop
            background: "rgba(20, 20, 30, 0.95)",
            border: "1px solid var(--border-subtle)",
            borderLeft: "none",
            borderRadius: "0 8px 8px 0",
            padding: "0.75rem 0.5rem",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.25rem",
            transition:
              "left 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease",
            opacity: isIdle && !isSidebarOpen ? 0.3 : 1,
            cursor: "pointer",
            boxShadow: "4px 0 12px rgba(0,0,0,0.5)",
          }}>
          {isSidebarOpen ? (
            <ChevronLeftIcon width={16} height={16} />
          ) : (
            <ChevronRightIcon width={16} height={16} />
          )}
        </div>
      )}

      {/* Backdrop for mobile */}
      <div
        className={`sidebar-backdrop mobile-only ${isSidebarOpen ? "open" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar navigation */}
      <aside className={`station-sidebar glass ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <span className="sidebar-label">Sectors</span>
          {!visitingProfile && (
            <button
              id="btn-add-sector"
              className="btn-icon"
              data-tooltip="Add new sector"
              onClick={onAddSector}>
              <PlusIcon width={16} height={16} />
            </button>
          )}
        </div>

        <nav className="sector-list">
          <button
            id="tab-all"
            className={`sector-tab ${activeSectorId === "all" ? "active" : ""}`}
            onClick={() => handleTabClick("all")}>
            <span className="sector-tab-icon">
              <DynamicIcon name="GlobeAltIcon" />
            </span>
            <span className="sector-tab-name">All Beacons</span>
            <span className="sector-tab-count">
              {personalSectors.reduce((a, s) => a + s.beacons.length, 0)}
            </span>
          </button>

          {personalSectors.map((sector, idx) => (
            <div
              key={sector.id}
              className="sector-tab-wrapper"
              draggable
              onDragStart={(e) => handleSectorDragStart(e, idx)}
              onDragOver={(e) => handleSectorDragOver(e, idx)}
              onDrop={(e) => handleSectorDrop(e, idx)}
              onDragEnd={handleSectorDragEnd}
              style={{
                transition: user.animationEnabled
                  ? "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease"
                  : "none",
                opacity: draggedSectorIndex === idx ? 0.5 : 1,
                transform:
                  user.animationEnabled && dragOverSectorIndex === idx
                    ? draggedSectorIndex !== null && draggedSectorIndex > idx
                      ? "translateY(-4px)"
                      : "translateY(4px)"
                    : "none",
                borderTop:
                  dragOverSectorIndex === idx &&
                  draggedSectorIndex !== null &&
                  draggedSectorIndex > idx
                    ? "2px solid rgba(139, 92, 246, 0.5)"
                    : "2px solid transparent",
                borderBottom:
                  dragOverSectorIndex === idx &&
                  draggedSectorIndex !== null &&
                  draggedSectorIndex < idx
                    ? "2px solid rgba(139, 92, 246, 0.5)"
                    : "2px solid transparent",
              }}>
              <button
                id={`tab-sector-${sector.id}`}
                className={`sector-tab ${activeSectorId === sector.id ? "active" : ""}`}
                onClick={() => handleTabClick(sector.id)}
                style={
                  activeSectorId === sector.id && sector.color
                    ? { borderLeftColor: sector.color, color: sector.color }
                    : undefined
                }>
                <span className="sector-tab-icon">
                  <DynamicIcon name={sector.icon} />
                </span>
                <span className="sector-tab-name">{sector.name}</span>
                <div
                  className="sector-tab-edit-btn hidden md:flex"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSector(sector);
                  }}
                  data-tooltip="Edit sector"
                  aria-label={`Edit ${sector.name}`}>
                  <PencilSquareIcon width={14} height={14} />
                </div>
              </button>
            </div>
          ))}

          {allCollabSectors.length > 0 && (
            <>
              <div
                className="sidebar-label"
                style={{
                  marginTop: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "var(--color-starlight)",
                }}>
                <DynamicIcon name="UsersIcon" width={14} height={14} /> Collab
                Sectors
              </div>
              {allCollabSectors.map((sector) => {
                const isOwner = sector.stationId === station?.id;
                return (
                  <div
                    key={sector.id}
                    className="sector-tab-wrapper collab-sector-tab">
                    <button
                      id={`tab-sector-${sector.id}`}
                      className={`sector-tab group ${activeSectorId === sector.id ? "active" : ""}`}
                      onClick={() => handleTabClick(sector.id)}
                      style={
                        activeSectorId === sector.id && sector.color
                          ? {
                              borderLeftColor: sector.color,
                              color: sector.color,
                            }
                          : undefined
                      }>
                      <span className="sector-tab-icon">
                        <DynamicIcon name={sector.icon} />
                      </span>
                      <span className="sector-tab-name">{sector.name}</span>
                      {isOwner && (
                        <div className="relative w-6 h-6 flex items-center justify-center shrink-0 ml-1">
                          {/* Crown Icon (visible when NOT hovered) */}
                          <div
                            className="absolute inset-0 flex items-center justify-center text-yellow-500 opacity-100 group-hover:opacity-0 transition-opacity pointer-events-none"
                            data-tooltip="Sector Owner">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V18H19V19Z" />
                            </svg>
                          </div>
                          {/* Edit Button (visible when hovered on desktop, hidden on mobile) */}
                          <div
                            className="absolute inset-0 items-center justify-center text-gray-400 hover:text-white opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-white/10 rounded-md hidden md:flex"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditSector(sector);
                            }}
                            data-tooltip="Edit sector"
                            aria-label={`Edit ${sector.name}`}>
                            <PencilSquareIcon width={14} height={14} />
                          </div>
                        </div>
                      )}
                      {!isOwner && (
                        <div className="relative w-6 h-6 flex items-center justify-center shrink-0 ml-1">
                          <div
                            className="absolute inset-0 flex items-center justify-center text-gray-400 hover:text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-white/10 rounded-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewMembers(sector);
                            }}
                            data-tooltip="View Members"
                            aria-label={`View Members of ${sector.name}`}>
                            <DynamicIcon
                              name="UsersIcon"
                              width={14}
                              height={14}
                            />
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </nav>
      </aside>
    </>
  );
}

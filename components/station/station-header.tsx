"use client";

import React from "react";
import type { SectorWithBeacons, StationWithSectors } from "@/types";
import { DynamicIcon } from "@/components/dynamic-icon";
import {
  LockClosedIcon,
  ArrowPathIcon,
  EllipsisVerticalIcon,
  TagIcon,
  PencilSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

type StationHeaderProps = {
  displaySectorId: string | "all";
  activeSector: SectorWithBeacons | null;
  visibleBeaconsCount: number;
  searchQuery: string;
  allSectorsCount: number;
  isRefreshing: boolean;
  handleRefresh: () => void;
  isCurrentSectorAdminOrOwner: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onAddBeacon: () => void;
  onEditSector: () => void;
  onManageTags: () => void;
  station: StationWithSectors | null;
};

export default function StationHeader({
  displaySectorId,
  activeSector,
  visibleBeaconsCount,
  searchQuery,
  allSectorsCount,
  isRefreshing,
  handleRefresh,
  isCurrentSectorAdminOrOwner,
  mobileMenuOpen,
  setMobileMenuOpen,
  onAddBeacon,
  onEditSector,
  onManageTags,
  station,
}: StationHeaderProps) {
  return (
    <div
      className="station-section-header relative"
      style={{
        minHeight: "56px",
        display: "flex",
        alignItems: "center",
      }}>
      <AnimatePresence mode="wait">
        {!mobileMenuOpen ? (
          <motion.div
            key="title"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full flex justify-between items-center">
            <div className="min-w-0 pr-2" style={{ flex: 1 }}>
              <h2
                className="station-section-title"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}>
                {displaySectorId === "all" ? (
                  "All Beacons"
                ) : (
                  <>
                    <DynamicIcon
                      name={activeSector?.icon}
                      style={{
                        display: "inline-block",
                        verticalAlign: "middle",
                        width: "24px",
                        height: "24px",
                        flexShrink: 0,
                      }}
                    />{" "}
                    <span className="truncate">
                      {activeSector?.name ?? ""}
                    </span>{" "}
                    {activeSector && !activeSector.isPublic && (
                      <LockClosedIcon
                        width={20}
                        height={20}
                        style={{
                          display: "inline-block",
                          verticalAlign: "middle",
                          opacity: 0.5,
                          flexShrink: 0,
                        }}
                        data-tooltip="Private Sector"
                      />
                    )}
                  </>
                )}
              </h2>
              <p className="station-section-sub truncate">
                {visibleBeaconsCount} beacon
                {visibleBeaconsCount !== 1 ? "s" : ""}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>

            {/* Desktop right side buttons */}
            {allSectorsCount > 0 && (
              <div
                className="hidden md:flex shrink-0"
                style={{ gap: "0.5rem" }}>
                <button
                  className="btn-icon"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    width: "38px",
                    height: "38px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  data-tooltip="Refresh Sector Data">
                  <ArrowPathIcon
                    width={18}
                    height={18}
                    className={isRefreshing ? "animate-spin" : ""}
                  />
                </button>
                {isCurrentSectorAdminOrOwner && displaySectorId !== "all" && (
                  <button
                    className="btn-icon"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      width: "38px",
                      height: "38px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                    onClick={onManageTags}
                    data-tooltip="Manage Tags">
                    <TagIcon width={18} height={18} />
                  </button>
                )}
                {isCurrentSectorAdminOrOwner && (
                  <button
                    id="btn-add-beacon"
                    className="btn btn-primary"
                    style={{
                      background:
                        "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                      boxShadow: "0 0 15px rgba(139, 92, 246, 0.5)",
                      border: "1px solid rgba(139, 92, 246, 0.5)",
                      color: "#fff",
                      fontWeight: "600",
                      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                      whiteSpace: "nowrap",
                    }}
                    onClick={onAddBeacon}
                    data-tooltip="Add new beacon">
                    + Add Beacon
                  </button>
                )}
              </div>
            )}

            {/* Mobile 3-dot trigger */}
            {allSectorsCount > 0 && (
              <div className="flex md:hidden shrink-0">
                <button
                  className="btn-icon"
                  style={{
                    height: "38px",
                    width: "38px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onClick={() => setMobileMenuOpen(true)}>
                  <EllipsisVerticalIcon width={24} height={24} />
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="menu"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full flex justify-end items-center">
            {/* Invisible overlay to catch outside clicks */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setMobileMenuOpen(false);
              }}
            />

            <div className="relative z-50 flex gap-2 items-center justify-end w-full">
              <button
                className="flex shrink-0 items-center justify-center"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "8px",
                  height: "38px",
                  width: "38px",
                  color: "var(--color-comet)",
                  transition: "background 0.15s",
                }}
                onClick={() => {
                  handleRefresh();
                  setMobileMenuOpen(false);
                }}>
                <ArrowPathIcon
                  width={18}
                  height={18}
                  className={isRefreshing ? "animate-spin" : ""}
                />
              </button>
              {displaySectorId !== "all" && isCurrentSectorAdminOrOwner && (
                <button
                  className="flex shrink-0 items-center justify-center"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "8px",
                    height: "38px",
                    width: "38px",
                    color: "var(--color-comet)",
                    transition: "background 0.15s",
                  }}
                  onClick={() => {
                    onManageTags();
                    setMobileMenuOpen(false);
                  }}
                  data-tooltip="Manage Tags">
                  <TagIcon width={18} height={18} />
                </button>
              )}
              {displaySectorId !== "all" &&
                activeSector &&
                activeSector.stationId === station?.id && (
                  <button
                    className="flex shrink-0 items-center justify-center overflow-hidden whitespace-nowrap"
                    style={{
                      background: "rgba(139, 92, 246, 0.15)",
                      border: "1px solid rgba(139, 92, 246, 0.3)",
                      borderRadius: "8px",
                      height: "38px",
                      padding: "0 0.8rem",
                      width: "auto",
                      color: "#c4b5fd",
                      transition: "all 0.15s",
                    }}
                    onClick={() => {
                      onEditSector();
                      setMobileMenuOpen(false);
                    }}>
                    <PencilSquareIcon
                      width={18}
                      height={18}
                      style={{ flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontSize: "0.85rem",
                        marginLeft: "0.4rem",
                        display: "inline-block",
                        color: "inherit",
                      }}>
                      Edit Sector
                    </span>
                  </button>
                )}

              {isCurrentSectorAdminOrOwner && (
                <button
                  className="flex shrink-0 items-center justify-center overflow-hidden whitespace-nowrap"
                  style={{
                    color: "#fff",
                    height: "38px",
                    padding: "0 0.8rem",
                    width: "auto",
                    borderRadius: "8px",
                    background:
                      "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                    boxShadow: "0 0 15px rgba(139, 92, 246, 0.5)",
                    border: "1px solid rgba(139, 92, 246, 0.5)",
                    transition: "all 0.15s",
                  }}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onAddBeacon();
                  }}>
                  <span
                    style={{
                      fontSize: "0.85rem",
                      marginLeft: "0.4rem",
                      display: "inline-block",
                    }}>
                    Add Beacon
                  </span>
                </button>
              )}

              <button
                className="flex shrink-0 items-center justify-center"
                style={{
                  height: "38px",
                  width: "38px",
                  color: "var(--color-comet)",
                }}
                onClick={() => {
                  setMobileMenuOpen(false);
                }}>
                <XMarkIcon width={24} height={24} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

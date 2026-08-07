"use client";

import React from "react";
import type { SectorWithBeacons, Tag } from "@/types";
import {
  FunnelIcon,
  CheckIcon,
  TagIcon,
  MagnifyingGlassIcon,
  ArrowsUpDownIcon,
  BarsArrowUpIcon,
  BarsArrowDownIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";

type StationToolbarProps = {
  baseBeaconsCount: number;
  displaySectorId: string | "all";
  allSectors: SectorWithBeacons[];
  allCollabSectors: SectorWithBeacons[];
  sectorTagsOverride: Record<string, Tag[]>;
  user: { animationEnabled: boolean };
  isExiting: boolean;
  isEntering: boolean;
  openMenu: "filter" | "sort" | "tags" | null;
  setOpenMenu: (menu: "filter" | "sort" | "tags" | null) => void;
  filterVisibility: "all" | "public" | "private" | "multi_url";
  setFilterVisibility: (v: "all" | "public" | "private" | "multi_url") => void;
  selectedTags: string[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
  tagSearchQuery: string;
  setTagSearchQuery: (q: string) => void;
  tagFilterMode: "union" | "intersect";
  setTagFilterMode: (mode: "union" | "intersect") => void;
  sortBy: "date" | "name" | "sector" | "creator" | "visits" | "color";
  setSortBy: (
    s: "date" | "name" | "sector" | "creator" | "visits" | "color",
  ) => void;
  sortDir: "asc" | "desc";
  setSortDir: React.Dispatch<React.SetStateAction<"asc" | "desc">>;
  localSearchQuery: string;
  handleSearchChange: (q: string) => void;
  viewMode: "masonry" | "grid";
  setViewMode: (mode: "masonry" | "grid") => void;
  cols: number;
  applyFilterSort: (fn: () => void) => void;
};

export default function StationToolbar({
  baseBeaconsCount,
  displaySectorId,
  allSectors,
  allCollabSectors,
  sectorTagsOverride,
  user,
  isExiting,
  isEntering,
  openMenu,
  setOpenMenu,
  filterVisibility,
  setFilterVisibility,
  selectedTags,
  setSelectedTags,
  tagSearchQuery,
  setTagSearchQuery,
  tagFilterMode,
  setTagFilterMode,
  sortBy,
  setSortBy,
  sortDir,
  setSortDir,
  localSearchQuery,
  handleSearchChange,
  viewMode,
  setViewMode,
  cols,
  applyFilterSort,
}: StationToolbarProps) {
  if (baseBeaconsCount === 0) return null;

  return (
    <div
      key={`controls-${displaySectorId}`}
      className={`controls-anim-container ${isExiting && user.animationEnabled ? "exiting" : isEntering && user.animationEnabled ? "entering" : ""}`}
      style={{
        marginBottom: "0.5rem",
        position: "relative",
        zIndex: 80,
      }}>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          alignItems: "center",
          flexWrap: "nowrap",
        }}>
        <style
          dangerouslySetInnerHTML={{
            __html: `
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
        `,
          }}
        />

        {displaySectorId === "all" && (
          <div className="staggered-item">
            <div
              className={`custom-dropdown ${user.animationEnabled ? "floating-controls" : ""}`}
              style={{ position: "relative" }}>
              <button
                className="custom-dropdown-btn"
                style={{
                  background:
                    filterVisibility !== "all"
                      ? "rgba(139, 92, 246, 0.2)"
                      : "rgba(15, 15, 25, 0.6)",
                  border: `1px solid ${filterVisibility !== "all" ? "#a78bfa" : "rgba(255, 255, 255, 0.1)"}`,
                  color: filterVisibility !== "all" ? "#fff" : "#a1a1aa",
                }}
                onClick={() =>
                  setOpenMenu(openMenu === "filter" ? null : "filter")
                }
                data-tooltip="Filter">
                <FunnelIcon width={18} height={18} />
              </button>
              {openMenu === "filter" && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 0.5rem)",
                    left: 0,
                    background: "#1a1a2e",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    padding: "0.5rem",
                    zIndex: 50,
                    minWidth: "150px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                  }}>
                  {[
                    { id: "all", label: "All Visibility" },
                    { id: "public", label: "Public" },
                    { id: "private", label: "Private" },
                    { id: "multi_url", label: "Multi URL" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      className="dropdown-option-btn"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.5rem",
                        background:
                          filterVisibility === opt.id
                            ? "rgba(139, 92, 246, 0.2)"
                            : "transparent",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: "0.85rem",
                        transition: "all 0.2s",
                      }}
                      onClick={() => {
                        applyFilterSort(() =>
                          setFilterVisibility(opt.id as any),
                        );
                        setOpenMenu(null);
                      }}>
                      {opt.label}
                      {filterVisibility === opt.id && (
                        <CheckIcon
                          width={14}
                          height={14}
                          style={{ color: "#a78bfa" }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {displaySectorId !== "all" &&
          (
            sectorTagsOverride[displaySectorId] ??
            allSectors.find((s) => s.id === displaySectorId)?.tags ??
            []
          ).length > 0 && (
            <div className="staggered-item">
              <div
                className={`custom-dropdown ${user.animationEnabled ? "floating-controls" : ""}`}
                style={{ position: "relative" }}>
                <button
                  className="custom-dropdown-btn"
                  style={{
                    background:
                      selectedTags.length > 0
                        ? "rgba(139, 92, 246, 0.2)"
                        : "rgba(15, 15, 25, 0.6)",
                    border: `1px solid ${selectedTags.length > 0 ? "#a78bfa" : "rgba(255, 255, 255, 0.1)"}`,
                    color: selectedTags.length > 0 ? "#fff" : "#a1a1aa",
                  }}
                  onClick={() =>
                    setOpenMenu(openMenu === "tags" ? null : "tags")
                  }
                  data-tooltip="Filter by Tags">
                  <TagIcon width={18} height={18} />
                </button>
                {openMenu === "tags" && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 0.5rem)",
                      left: 0,
                      background: "#1a1a2e",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      padding: "0.75rem",
                      zIndex: 50,
                      minWidth: "250px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.25rem",
                      }}>
                      <div
                        style={{
                          color: "#a1a1aa",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontWeight: 600,
                        }}>
                        Filter by Tags
                      </div>
                      {selectedTags.length > 0 && (
                        <button
                          onClick={() => setSelectedTags([])}
                          style={{
                            color: "#ef4444",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            background: "rgba(239, 68, 68, 0.1)",
                            padding: "0.15rem 0.4rem",
                            borderRadius: "4px",
                          }}>
                          Clear All
                        </button>
                      )}
                    </div>

                    {/* Tag Filter Mode Toggle: Union vs Intersect */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "6px",
                        padding: "2px",
                        gap: "2px",
                      }}>
                      <button
                        type="button"
                        onClick={() =>
                          applyFilterSort(() => setTagFilterMode("union"))
                        }
                        style={{
                          flex: 1,
                          padding: "0.25rem 0.5rem",
                          fontSize: "0.72rem",
                          fontWeight: tagFilterMode === "union" ? 600 : 400,
                          borderRadius: "4px",
                          border: "none",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          background:
                            tagFilterMode === "union"
                              ? "rgba(139, 92, 246, 0.3)"
                              : "transparent",
                          color:
                            tagFilterMode === "union"
                              ? "#c4b5fd"
                              : "rgba(255, 255, 255, 0.5)",
                        }}>
                        Union (OR)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyFilterSort(() => setTagFilterMode("intersect"))
                        }
                        style={{
                          flex: 1,
                          padding: "0.25rem 0.5rem",
                          fontSize: "0.72rem",
                          fontWeight: tagFilterMode === "intersect" ? 600 : 400,
                          borderRadius: "4px",
                          border: "none",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          background:
                            tagFilterMode === "intersect"
                              ? "rgba(139, 92, 246, 0.3)"
                              : "transparent",
                          color:
                            tagFilterMode === "intersect"
                              ? "#c4b5fd"
                              : "rgba(255, 255, 255, 0.5)",
                        }}>
                        Intersect (AND)
                      </button>
                    </div>

                    {/* Live Search Input */}
                    <div style={{ position: "relative" }}>
                      <MagnifyingGlassIcon
                        width={14}
                        height={14}
                        style={{
                          position: "absolute",
                          left: "0.5rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#6b7280",
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Search tags..."
                        value={tagSearchQuery}
                        onChange={(e) => setTagSearchQuery(e.target.value)}
                        style={{
                          width: "100%",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "6px",
                          padding: "0.35rem 0.5rem 0.35rem 1.75rem",
                          color: "#fff",
                          fontSize: "0.75rem",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                        marginTop: "0.25rem",
                        maxHeight: "200px",
                        overflowY: "auto",
                      }}>
                      {(
                        sectorTagsOverride[displaySectorId] ??
                        allSectors.find((s) => s.id === displaySectorId)
                          ?.tags ??
                        []
                      )
                        .filter((opt) =>
                          opt.name
                            .toLowerCase()
                            .includes(tagSearchQuery.toLowerCase()),
                        )
                        .map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() =>
                              applyFilterSort(() =>
                                setSelectedTags((prev) =>
                                  prev.includes(opt.id)
                                    ? prev.filter((id) => id !== opt.id)
                                    : [...prev, opt.id],
                                ),
                              )
                            }
                            style={{
                              padding: "0.25rem 0.75rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              transition: "all 0.2s",
                              border: selectedTags.includes(opt.id)
                                ? "1px solid rgba(139, 92, 246, 0.5)"
                                : "1px solid transparent",
                              background: selectedTags.includes(opt.id)
                                ? "rgba(139, 92, 246, 0.2)"
                                : "rgba(255, 255, 255, 0.05)",
                              color: selectedTags.includes(opt.id)
                                ? "#c4b5fd"
                                : "#d1d5db",
                            }}>
                            {opt.name}
                          </button>
                        ))}
                      {(
                        sectorTagsOverride[displaySectorId] ??
                        allSectors.find((s) => s.id === displaySectorId)
                          ?.tags ??
                        []
                      ).filter((opt) =>
                        opt.name
                          .toLowerCase()
                          .includes(tagSearchQuery.toLowerCase()),
                      ).length === 0 && (
                        <p
                          style={{
                            color: "#6b7280",
                            fontSize: "0.875rem",
                            fontStyle: "italic",
                            width: "100%",
                            textAlign: "center",
                            padding: "1rem 0",
                          }}>
                          No matching tags.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        <div className="staggered-item">
          <div
            className={`custom-dropdown ${user.animationEnabled ? "floating-controls" : ""}`}
            style={{ position: "relative" }}>
            <button
              className="custom-dropdown-btn"
              style={{
                background:
                  sortBy !== "date"
                    ? "rgba(139, 92, 246, 0.2)"
                    : "rgba(15, 15, 25, 0.6)",
                border: `1px solid ${sortBy !== "date" ? "#a78bfa" : "rgba(255, 255, 255, 0.1)"}`,
                color: sortBy !== "date" ? "#fff" : "#a1a1aa",
              }}
              onClick={() => setOpenMenu(openMenu === "sort" ? null : "sort")}
              data-tooltip="Sort">
              <ArrowsUpDownIcon width={18} height={18} />
            </button>
            {openMenu === "sort" && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 0.5rem)",
                  left: 0,
                  background: "#1a1a2e",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  padding: "0.5rem",
                  zIndex: 50,
                  minWidth: "180px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}>
                {[
                  { id: "date", label: "Date Added" },
                  { id: "name", label: "Name" },
                  { id: "visits", label: "Total Visits" },
                  {
                    id: "sector",
                    label: "Sector Order",
                    hide: displaySectorId !== "all",
                  },
                  { id: "color", label: "Color" },
                  {
                    id: "creator",
                    label: "Added By",
                    hide: !(
                      displaySectorId !== "all" &&
                      allCollabSectors.some((s) => s.id === displaySectorId)
                    ),
                  },
                ]
                  .filter((opt) => !opt.hide)
                  .map((opt) => (
                    <div
                      key={opt.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background:
                          sortBy === opt.id
                            ? "rgba(139, 92, 246, 0.2)"
                            : "transparent",
                        color: "#fff",
                        borderRadius: "6px",
                        overflow: "hidden",
                        transition: "all 0.2s",
                      }}>
                      <button
                        className="dropdown-option-btn hover:bg-white/5"
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.5rem",
                          border: "none",
                          background: "transparent",
                          color: "inherit",
                          cursor: "pointer",
                          textAlign: "left",
                          fontSize: "0.85rem",
                        }}
                        onClick={() => {
                          applyFilterSort(() => setSortBy(opt.id as any));
                        }}>
                        {opt.label}
                        {sortBy === opt.id && (
                          <CheckIcon
                            width={14}
                            height={14}
                            style={{ color: "#a78bfa" }}
                          />
                        )}
                      </button>
                      {sortBy === opt.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            applyFilterSort(() =>
                              setSortDir((d) => (d === "asc" ? "desc" : "asc")),
                            );
                          }}
                          style={{
                            padding: "0.5rem",
                            background: "rgba(255,255,255,0.05)",
                            border: "none",
                            borderLeft: "1px solid rgba(255,255,255,0.1)",
                            color: "inherit",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          className="hover:bg-white/10"
                          data-tooltip={`Sort ${sortDir === "asc" ? "Descending" : "Ascending"}`}>
                          {sortDir === "asc" ? (
                            <BarsArrowUpIcon width={16} height={16} />
                          ) : (
                            <BarsArrowDownIcon width={16} height={16} />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {(displaySectorId === "all" ||
          (displaySectorId !== "all" &&
            allCollabSectors.some((s) => s.id === displaySectorId))) && (
          <div className="staggered-item station-toolbar-search">
            <div
              className={`${user.animationEnabled ? "floating-controls" : ""}`}
              style={{
                position: "relative",
                width: "100%",
                animationDelay: "0.4s",
              }}>
              <MagnifyingGlassIcon
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "16px",
                  color: "#a1a1aa",
                }}
              />
              <input
                id="beacon-search-input"
                type="text"
                placeholder="Search beacons... (Ctrl+K)"
                value={localSearchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                style={{
                  width: "100%",
                  height: "38px",
                  background: "rgba(15, 15, 25, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  padding: "0 1rem 0 36px",
                  color: "#fff",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#a78bfa")}
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255, 255, 255, 0.1)")
                }
              />
            </div>
          </div>
        )}

        <div className="staggered-item station-toolbar-view">
          <button
            style={{
              padding: "6px",
              borderRadius: "6px",
              transition: "colors 0.2s",
              background:
                viewMode === "masonry"
                  ? "rgba(168, 85, 247, 0.3)"
                  : "transparent",
              color:
                viewMode === "masonry" ? "#e9d5ff" : "rgba(255, 255, 255, 0.5)",
              cursor: "pointer",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => setViewMode("masonry")}
            data-tooltip={cols <= 2 ? "1 Column View" : "Masonry View"}>
            <ViewColumnsIcon width={18} height={18} />
          </button>
          <button
            style={{
              padding: "6px",
              borderRadius: "6px",
              transition: "colors 0.2s",
              background:
                viewMode === "grid"
                  ? "rgba(168, 85, 247, 0.3)"
                  : "transparent",
              color:
                viewMode === "grid" ? "#e9d5ff" : "rgba(255, 255, 255, 0.5)",
              cursor: "pointer",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => setViewMode("grid")}
            data-tooltip={cols <= 2 ? "2 Columns View" : "Grid View"}>
            <Squares2X2Icon width={18} height={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

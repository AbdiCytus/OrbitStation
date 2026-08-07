"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { Beacon, SectorWithBeacons, Tag } from "@/types";
import { useBeaconColors } from "@/hooks/use-beacon-colors";

type UseBeaconFiltersOptions = {
  allSectors: SectorWithBeacons[];
  personalSectors: SectorWithBeacons[];
  displaySectorId: string | "all";
  beaconColors?: Record<string, number>;
  user: {
    saveFilterSortEnabled?: boolean;
    animationEnabled: boolean;
  };
};

export type SortByOption = "date" | "name" | "sector" | "creator" | "visits" | "color";
export type SortDirOption = "asc" | "desc";
export type FilterVisibilityOption = "all" | "public" | "private" | "multi_url";
export type TagFilterModeOption = "union" | "intersect";

export function useBeaconFilters({
  allSectors,
  personalSectors,
  displaySectorId,
  beaconColors: externalBeaconColors,
  user,
}: UseBeaconFiltersOptions) {
  const [searchQuery, setSearchQuery] = useState("");
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [filterVisibility, setFilterVisibility] =
    useState<FilterVisibilityOption>("all");
  const [sortBy, setSortBy] = useState<SortByOption>("date");
  const [sortDir, setSortDir] = useState<SortDirOption>("desc");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [tagFilterMode, setTagFilterMode] =
    useState<TagFilterModeOption>("union");
  const [loadedSectorId, setLoadedSectorId] = useState<string | null>(null);

  const internalBeaconColors = useBeaconColors(allSectors, sortBy === "color");
  const beaconColors = externalBeaconColors || internalBeaconColors;

  // Local override for sector tags — updated optimistically from TagManagementModal
  const [sectorTagsOverride, setSectorTagsOverride] = useState<
    Record<string, Tag[]>
  >({});

  const [isFilterExiting, setIsFilterExiting] = useState(false);
  const [isFilterEntering, setIsFilterEntering] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(12);
  const [viewMode, setViewMode] = useState<"masonry" | "grid">("masonry");
  const [isViewModeMounted, setIsViewModeMounted] = useState(false);
  const [isPrefLoading, setIsPrefLoading] = useState(true);

  // Load view mode preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("stationViewMode");
      if (saved === "grid" || saved === "masonry") {
        setViewMode(saved);
      }
    } catch (e) {
      // Ignore
    }
    setIsViewModeMounted(true);
  }, []);

  // Persist view mode preference
  useEffect(() => {
    if (!isViewModeMounted) return;
    try {
      localStorage.setItem("stationViewMode", viewMode);
    } catch (e) {
      // Ignore
    }
  }, [viewMode, isViewModeMounted]);

  // Load filter & sort preferences for "all" sector
  useEffect(() => {
    if (!user.saveFilterSortEnabled || displaySectorId !== "all") {
      setSortBy("date");
      setSortDir("desc");
      setFilterVisibility("all");
      setSelectedTags([]);
      setTagFilterMode("union");
      setLoadedSectorId(displaySectorId);
      setIsPrefLoading(false);
      return;
    }

    try {
      const saved = localStorage.getItem("os_prefs_all");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sortBy) setSortBy(parsed.sortBy);
        if (parsed.sortDir) setSortDir(parsed.sortDir);
        if (parsed.filterVisibility)
          setFilterVisibility(parsed.filterVisibility);
        if (parsed.selectedTags) setSelectedTags(parsed.selectedTags);
        if (parsed.tagFilterMode) setTagFilterMode(parsed.tagFilterMode);
      } else {
        setSortBy("date");
        setSortDir("desc");
        setFilterVisibility("all");
        setSelectedTags([]);
        setTagFilterMode("union");
      }
    } catch (e) {
      // Ignore
    }
    setLoadedSectorId(displaySectorId);

    // Brief delay to ensure state and DOM settle smoothly
    const timer = setTimeout(() => {
      setIsPrefLoading(false);
    }, 120);

    return () => clearTimeout(timer);
  }, [displaySectorId, user.saveFilterSortEnabled]);

  // Persist filter & sort preferences for "all" sector
  useEffect(() => {
    if (
      !user.saveFilterSortEnabled ||
      loadedSectorId !== displaySectorId ||
      displaySectorId !== "all"
    )
      return;
    try {
      localStorage.setItem(
        "os_prefs_all",
        JSON.stringify({
          sortBy,
          sortDir,
          filterVisibility,
          selectedTags,
          tagFilterMode,
        }),
      );
    } catch (e) {
      // Ignore
    }
  }, [
    displaySectorId,
    sortBy,
    sortDir,
    filterVisibility,
    selectedTags,
    tagFilterMode,
    user.saveFilterSortEnabled,
    loadedSectorId,
  ]);

  // Reset pagination limit when filters change
  useEffect(() => {
    setVisibleLimit(12);
  }, [
    displaySectorId,
    searchQuery,
    filterVisibility,
    sortBy,
    sortDir,
    selectedTags,
    tagFilterMode,
  ]);

  const applyFilterSort = (updateFn: () => void) => {
    if (!user.animationEnabled) {
      updateFn();
      return;
    }
    setIsFilterExiting(true);
    setTimeout(() => {
      updateFn();
      setIsFilterExiting(false);
      setIsFilterEntering(true);
      setTimeout(() => setIsFilterEntering(false), 500);
    }, 300);
  };

  const handleSearchChange = (val: string) => {
    setLocalSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      applyFilterSort(() => setSearchQuery(val));
    }, 300);
  };

  const baseBeacons = useMemo(() => {
    if (displaySectorId === "all") {
      return personalSectors.flatMap((s) =>
        s.beacons.map((b: any) => ({
          ...b,
          _isPublic: s.isPublic,
          _sectorOrder: s.order,
          _sectorName: s.name,
          _creator: b.creator,
        })),
      );
    } else {
      const s = allSectors.find((s) => s.id === displaySectorId);
      return (
        s?.beacons.map((b: any) => ({
          ...b,
          _isPublic: s.isPublic,
          _sectorOrder: s.order,
          _sectorName: s.name,
          _creator: b.creator,
        })) ?? []
      );
    }
  }, [allSectors, displaySectorId, personalSectors]);

  const visibleBeacons = useMemo(() => {
    let beacons = [...baseBeacons];

    if (filterVisibility === "public") {
      beacons = beacons.filter((b) => b._isPublic);
    } else if (filterVisibility === "private") {
      beacons = beacons.filter((b) => !b._isPublic);
    } else if (filterVisibility === "multi_url") {
      beacons = beacons.filter((b) => b.branches && b.branches.length > 0);
    }

    if (selectedTags.length > 0) {
      if (tagFilterMode === "intersect") {
        beacons = beacons.filter((b) =>
          selectedTags.every((tagId) =>
            b.tags?.some((bt: any) => bt.tagId === tagId),
          ),
        );
      } else {
        beacons = beacons.filter((b) =>
          b.tags?.some((bt: any) => selectedTags.includes(bt.tagId)),
        );
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      beacons = beacons.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q),
      );
    }

    if (sortBy === "name") {
      beacons.sort((a, b) =>
        sortDir === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title),
      );
    } else if (sortBy === "sector") {
      beacons.sort((a, b) => {
        const orderDiff = (a._sectorOrder ?? 0) - (b._sectorOrder ?? 0);
        if (orderDiff !== 0) return sortDir === "asc" ? orderDiff : -orderDiff;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    } else if (sortBy === "creator") {
      beacons.sort((a, b) =>
        sortDir === "asc"
          ? (a._creator?.name || "").localeCompare(b._creator?.name || "")
          : (b._creator?.name || "").localeCompare(a._creator?.name || ""),
      );
    } else if (sortBy === "visits") {
      beacons.sort((a, b) =>
        sortDir === "asc"
          ? (a.visits || 0) - (b.visits || 0)
          : (b.visits || 0) - (a.visits || 0),
      );
    } else if (sortBy === "color") {
      beacons.sort((a, b) => {
        const groupA = a.imageUrl ? 1 : a.faviconUrl ? 2 : 3;
        const groupB = b.imageUrl ? 1 : b.faviconUrl ? 2 : 3;

        if (groupA !== groupB) {
          return groupA - groupB;
        }

        if (groupA === 1 || groupA === 2) {
          const hA = beaconColors[a.id];
          const hB = beaconColors[b.id];
          const hasA = hA !== undefined && hA !== -1;
          const hasB = hB !== undefined && hB !== -1;

          if (hasA && hasB) {
            return sortDir === "asc" ? hA - hB : hB - hA;
          }
          if (hasA) return -1;
          if (hasB) return 1;
          return a.title.localeCompare(b.title);
        }

        return a.title.localeCompare(b.title);
      });
    } else {
      // date
      beacons.sort((a, b) =>
        sortDir === "asc"
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    return beacons;
  }, [
    baseBeacons,
    searchQuery,
    filterVisibility,
    sortBy,
    sortDir,
    selectedTags,
    tagFilterMode,
    beaconColors,
  ]);

  // Responsive column calculation
  const [cols, setCols] = useState(6);
  useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth <= 640) setCols(1);
      else if (window.innerWidth <= 840) setCols(2);
      else if (window.innerWidth <= 1024) setCols(3);
      else if (window.innerWidth <= 1200) setCols(4);
      else setCols(6);
    };
    updateCols();
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, []);

  const paginatedBeacons = useMemo(() => {
    return visibleBeacons.slice(0, visibleLimit);
  }, [visibleBeacons, visibleLimit]);

  const columnWrapper = useMemo(() => {
    const wrapper = Array.from(
      { length: cols },
      () => [] as { beacon: Beacon; globalIndex: number }[],
    );
    paginatedBeacons.forEach((beacon, index) => {
      wrapper[index % cols].push({ beacon, globalIndex: index });
    });
    return wrapper;
  }, [paginatedBeacons, cols]);

  return {
    searchQuery,
    setSearchQuery,
    localSearchQuery,
    setLocalSearchQuery,
    filterVisibility,
    setFilterVisibility,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    selectedTags,
    setSelectedTags,
    tagSearchQuery,
    setTagSearchQuery,
    tagFilterMode,
    setTagFilterMode,
    sectorTagsOverride,
    setSectorTagsOverride,
    isFilterExiting,
    isFilterEntering,
    visibleLimit,
    setVisibleLimit,
    viewMode,
    setViewMode,
    isViewModeMounted,
    isPrefLoading,
    applyFilterSort,
    handleSearchChange,
    baseBeacons,
    visibleBeacons,
    paginatedBeacons,
    columnWrapper,
    cols,
  };
}

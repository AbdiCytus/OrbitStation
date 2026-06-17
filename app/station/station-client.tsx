"use client";

import { useState, useMemo, useTransition, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { StationWithSectors, SectorWithBeacons, Beacon } from "@/types";
import BeaconCard from "@/components/beacon-card";
import AddBeaconModal from "@/components/add-beacon-modal";
import AddSectorModal from "@/components/add-sector-modal";
import EditSectorModal from "@/components/edit-sector-modal";
import EditBeaconModal from "@/components/edit-beacon-modal";
import BeaconDetailModal from "@/components/beacon-detail-modal";
import SectorMembersModal from "@/components/sector-members-modal";
import FriendsModal from "@/components/friends-modal";
import StationNavbar from "@/components/station-navbar";
import SpaceBackground from "@/components/space-background";
import StaticStarfield from "@/components/static-starfield";
import { deleteSector, reorderSectors } from "@/lib/actions";
import { DynamicIcon } from "@/components/dynamic-icon";
import { 
  PlusIcon, LockClosedIcon, PencilSquareIcon, MagnifyingGlassIcon, SparklesIcon, RocketLaunchIcon, FunnelIcon, ArrowsUpDownIcon, CheckIcon, BarsArrowUpIcon, BarsArrowDownIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon, UserIcon, ArrowPathIcon, EllipsisVerticalIcon
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/hooks/use-notifications";
import { toast } from "sonner";

type Props = {
  initialStation: StationWithSectors | null;
  initialCollabSectors?: (SectorWithBeacons & { collaborators?: any[] })[];
  user: { id: string; name: string | null; username?: string | null; image: string | null; callsign: string | null; animationEnabled: boolean; hologramEnabled?: boolean; staticBackgroundEnabled?: boolean; station?: { isPublic: boolean } };
};

export default function StationClient({ initialStation, initialCollabSectors = [], user }: Props) {
  const [station, setStation] = useState(initialStation);
  const [collabSectors, setCollabSectors] = useState(initialCollabSectors);
  const [activeSectorId, setActiveSectorId] = useState<string | "all">("all");
  const [displaySectorId, setDisplaySectorId] = useState<string | "all">("all");
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [funFact, setFunFact] = useState("");

  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
  const [isIdle, setIsIdle] = useState(false);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const [shrinkingBeacons, setShrinkingBeacons] = useState<Set<string>>(new Set());
  const [growingBeacons, setGrowingBeacons] = useState<Set<string>>(new Set());
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuCaption, setMobileMenuCaption] = useState<"edit" | "add" | null>(null);

  const { stats, refetch: refetchNotifications } = useNotifications();

  const FUN_FACTS = [
    "Did you know? A day on Venus is longer than a year on Venus.",
    "Neutron stars can spin up to 600 times per second.",
    "There's a planet made almost entirely of diamond twice the size of Earth.",
    "The footprints on the Moon will likely be there for 100 million years.",
    "Space is completely silent. There is no atmosphere to carry sound waves.",
    "The Apollo 11 computer had less processing power than a modern smartphone.",
    "One million Earths could fit inside the Sun.",
    "There are more stars in the universe than grains of sand on Earth.",
    "Jupiter has 95 officially recognized moons.",
    "If two pieces of the same type of metal touch in space, they will bond permanently."
  ];


  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setStation(initialStation);
    setCollabSectors(initialCollabSectors);
  }, [initialStation, initialCollabSectors]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Sector data refreshed");
    }, 1000);
  }, [router]);

  // Clear entering class after animation
  useEffect(() => {
    if (isEntering) {
      const t = setTimeout(() => setIsEntering(false), 1000);
      return () => clearTimeout(t);
    }
  }, [isEntering, displaySectorId]);

  const resetIdleTimer = useCallback(() => {
    setIsIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIsIdle(true), 3000);
  }, []);

  useEffect(() => {
    resetIdleTimer();
    return () => { if (idleTimer.current) clearTimeout(idleTimer.current); };
  }, [resetIdleTimer]);

  const handleTouchStart = (e: React.TouchEvent) => {
    resetIdleTimer();
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStart.x;
    const diffY = touchEndY - touchStart.y;

    const isAnyModalOpen = showAddSector || showAddBeacon || !!editingSector || !!editingBeacon || !!selectedBeacon || showFriendsModal || !!viewingMembersSector;
    
    // Prevent swipe if touching a beacon card, so they don't accidentally open sidebar
    const target = e.target as Element;
    const isTouchingBeacon = target && target.closest && target.closest(".beacon-card-wrapper");

    if (Math.abs(diffX) > Math.abs(diffY) && !isAnyModalOpen && !isTouchingBeacon) {
      if (diffX > 50 && !isSidebarOpen) {
        setIsSidebarOpen(true);
      } else if (isSidebarOpen && diffX < -50) {
        setIsSidebarOpen(false);
      }
    }
    setTouchStart(null);
  };

  const handleTabClick = (sectorId: string | "all") => {
    setActiveSectorId(sectorId);
    if (sectorId !== "all") {
      setFilterVisibility("all");
      setSearchQuery("");
      setLocalSearchQuery("");
    }
    // Always auto-close sidebar (desktop ignores this via CSS)
    setIsSidebarOpen(false);
    
    if (sectorId === displaySectorId || isExiting) return;
    if (!user.animationEnabled) {
      setDisplaySectorId(sectorId);
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
      setDisplaySectorId(sectorId);
      setIsExiting(false);
      setIsEntering(true);
    }, delay);
  };
  
  const [searchQuery, setSearchQuery] = useState("");
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [filterVisibility, setFilterVisibility] = useState<"all" | "public" | "private">("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "sector" | "creator" | "visits">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [isFilterExiting, setIsFilterExiting] = useState(false);
  const [isFilterEntering, setIsFilterEntering] = useState(false);
  
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

  const [openMenu, setOpenMenu] = useState<"filter" | "sort" | null>(null);
  const [selectedBeacon, setSelectedBeacon] = useState<Beacon | null>(null);
  const [editingBeacon, setEditingBeacon] = useState<Beacon | null>(null);
  const [showAddBeacon, setShowAddBeacon] = useState(false);
  const [showAddSector, setShowAddSector] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<SectorWithBeacons | null>(null);
  const [viewingMembersSector, setViewingMembersSector] = useState<SectorWithBeacons | null>(null);
  const [, startTransition] = useTransition();

  const allOwnedSectors = [...(station?.sectors ?? [])].sort((a, b) => a.order - b.order);
  const personalSectors = allOwnedSectors.filter(s => !s.collaborators || s.collaborators.length === 0);
  const myCollabSectors = allOwnedSectors.filter(s => s.collaborators && s.collaborators.length > 0);
  const allCollabSectors = [...myCollabSectors, ...collabSectors];
  const allSectors = [...allOwnedSectors, ...collabSectors];

  const baseBeacons = useMemo(() => {
    if (displaySectorId === "all") {
      return personalSectors.flatMap((s) => s.beacons.map((b: any) => ({ ...b, _isPublic: s.isPublic, _sectorOrder: s.order, _sectorName: s.name, _creator: b.creator })));
    } else {
      const s = allSectors.find((s) => s.id === displaySectorId);
      return s?.beacons.map((b: any) => ({ ...b, _isPublic: s.isPublic, _sectorOrder: s.order, _sectorName: s.name, _creator: b.creator })) ?? [];
    }
  }, [allSectors, displaySectorId, personalSectors]);

  const visibleBeacons = useMemo(() => {
    let beacons = [...baseBeacons];

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

    if (sortBy === "name") {
      beacons.sort((a, b) => sortDir === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));
    } else if (sortBy === "sector") {
      beacons.sort((a, b) => {
        const orderDiff = (a._sectorOrder ?? 0) - (b._sectorOrder ?? 0);
        if (orderDiff !== 0) return sortDir === "asc" ? orderDiff : -orderDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else if (sortBy === "creator") {
      beacons.sort((a, b) => sortDir === "asc" ? (a._creator?.name || "").localeCompare(b._creator?.name || "") : (b._creator?.name || "").localeCompare(a._creator?.name || ""));
    } else if (sortBy === "visits") {
      beacons.sort((a, b) => sortDir === "asc" ? (a.visits || 0) - (b.visits || 0) : (b.visits || 0) - (a.visits || 0));
    } else { // date
      beacons.sort((a, b) => sortDir === "asc" ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return beacons;
  }, [baseBeacons, searchQuery, filterVisibility, sortBy, sortDir]);

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
      const target = e.target as Element;
      if (target && target.closest && !target.closest(".custom-dropdown")) {
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

  const activeSector = allSectors.find((s) => s.id === displaySectorId) ?? null;

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
    if (user.animationEnabled) {
      setGrowingBeacons(new Set([newBeacon.id]));
      setTimeout(() => {
        setGrowingBeacons(new Set());
      }, 500);
    }
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
    setCollabSectors((prev) => 
      prev.map(s => s.id === newBeacon.sectorId ? { ...s, beacons: [...s.beacons, newBeacon] } : s)
    );
    setShowAddBeacon(false);
  }, [user.animationEnabled]);

  const handleBeaconUpdated = useCallback((updated: Beacon) => {
    setStation((prev) => {
      if (!prev) return prev;
      const oldBeacon = prev.sectors.flatMap(s => s.beacons).find(b => b.id === updated.id);
      const sectorChanged = oldBeacon && oldBeacon.sectorId !== updated.sectorId;

      if (sectorChanged && user.animationEnabled) {
        setShrinkingBeacons(new Set([updated.id]));
        setTimeout(() => {
          setShrinkingBeacons(new Set());
          setStation(p => {
            if (!p) return p;
            let ns = p.sectors.map(s => ({ ...s, beacons: s.beacons.filter(b => b.id !== updated.id) }));
            ns = ns.map(s => s.id === updated.sectorId ? { ...s, beacons: [...s.beacons, updated].sort((a,b) => a.order - b.order) } : s);
            return { ...p, sectors: ns };
          });
        }, 300);
        return prev; // don't update state yet
      }

      let newSectors = prev.sectors.map(s => ({ ...s, beacons: s.beacons.filter(b => b.id !== updated.id) }));
      newSectors = newSectors.map(s => s.id === updated.sectorId ? { ...s, beacons: [...s.beacons, updated].sort((a,b) => a.order - b.order) } : s);
      return { ...prev, sectors: newSectors };
    });
    setCollabSectors((prev) => {
      let ns = prev.map(s => ({ ...s, beacons: s.beacons.filter(b => b.id !== updated.id) }));
      ns = ns.map(s => s.id === updated.sectorId ? { ...s, beacons: [...s.beacons, updated].sort((a,b) => a.order - b.order) } : s);
      return ns;
    });
    setEditingBeacon(null);
    setSelectedBeacon((prev) => prev?.id === updated.id ? updated : prev);
  }, [user.animationEnabled]);

  const handleBeaconDeleted = useCallback((beaconId: string) => {
    const doDelete = () => {
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
      setCollabSectors((prev) => 
        prev.map(s => ({ ...s, beacons: s.beacons.filter(b => b.id !== beaconId) }))
      );
      setSelectedBeacon(null);
      setEditingBeacon(null);
    };

    if (user.animationEnabled) {
      setShrinkingBeacons(new Set([beaconId]));
      setSelectedBeacon(null);
      setEditingBeacon(null);
      setTimeout(() => {
        setShrinkingBeacons(new Set());
        doDelete();
      }, 300);
    } else {
      doDelete();
    }
  }, [user.animationEnabled]);

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
        toast.success("Sector deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete sector");
      }
    });
  }, [startTransition]);

  const displayName = user.callsign ?? user.name ?? "Pilot";
  const animEnabled = user.animationEnabled;

  const [draggedSectorIndex, setDraggedSectorIndex] = useState<number | null>(null);
  const [dragOverSectorIndex, setDragOverSectorIndex] = useState<number | null>(null);

  const handleSectorDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSectorIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleSectorDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedSectorIndex !== null && draggedSectorIndex !== index) {
      setDragOverSectorIndex(index);
    } else {
      setDragOverSectorIndex(null);
    }
  };

  const handleSectorDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedSectorIndex === null || draggedSectorIndex === index) {
      setDraggedSectorIndex(null);
      setDragOverSectorIndex(null);
      return;
    }

    const reorderedSectors = Array.from(personalSectors);
    const [movedSector] = reorderedSectors.splice(draggedSectorIndex, 1);
    reorderedSectors.splice(index, 0, movedSector);

    setStation((prev) => {
      if (!prev) return prev;
      const updatedSectors = prev.sectors.map(s => {
        const pIndex = reorderedSectors.findIndex(rs => rs.id === s.id);
        if (pIndex !== -1) {
          return { ...s, order: pIndex };
        }
        return s;
      });
      return { ...prev, sectors: updatedSectors };
    });

    startTransition(async () => {
      await reorderSectors(reorderedSectors.map(s => s.id));
    });

    setDraggedSectorIndex(null);
    setDragOverSectorIndex(null);
  };

  const handleSectorDragEnd = () => {
    setDraggedSectorIndex(null);
    setDragOverSectorIndex(null);
  };

  return (
    <div 
      className={`station-root${animEnabled ? "" : " no-animation"} ${user.animationEnabled && isExiting ? "exiting" : ""} ${user.animationEnabled && isEntering ? "entering" : ""}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseMove={resetIdleTimer}
    >
      {/* Animated space canvas background or static fallback */}
      {(user as any).staticBackgroundEnabled ? (
        <div className="cosmic-bg fixed inset-0 z-[-1] pointer-events-none static-cosmic-bg" aria-hidden="true">
          <div className="cosmic-stars"></div>
          <div className="cosmic-aurora" style={{ opacity: 0.5, transform: "scale(1.2)" }}></div>
          <div className="cosmic-dust"></div>
        </div>
      ) : animEnabled ? (
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
        user={{ ...user, callsign: user.callsign, username: (user as any).username }}
        hideSearch={true}
        displayName={displayName}
        onOpenFriends={() => setShowFriendsModal(true)}
        stats={stats}
        isPublicProfile={station?.isPublic}
      />

      {/* Mobile Sidebar Toggle Button */}
      {!(showAddSector || showAddBeacon || !!editingSector || !!editingBeacon || !!selectedBeacon || showFriendsModal || !!viewingMembersSector) && (
        <div 
          className="mobile-only sidebar-toggle-btn"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        style={{
           position: 'fixed',
           left: isSidebarOpen ? '260px' : '0',
           top: '50%',
           transform: 'translateY(-50%)',
           zIndex: 101, // Above backdrop
           background: 'rgba(20, 20, 30, 0.95)',
           border: '1px solid var(--border-subtle)',
           borderLeft: 'none',
           borderRadius: '0 8px 8px 0',
           padding: '0.75rem 0.5rem',
           display: 'flex',
           flexDirection: 'row',
           alignItems: 'center',
           gap: '0.25rem',
           transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease',
           opacity: isIdle && !isSidebarOpen ? 0.3 : 1,
           cursor: 'pointer',
           boxShadow: '4px 0 12px rgba(0,0,0,0.5)'
        }}
      >
        {isSidebarOpen ? <ChevronLeftIcon width={16} height={16} /> : <ChevronRightIcon width={16} height={16} />}
      </div>
      )}

      <div className={`station-layout ${user.animationEnabled && isExiting ? "exiting" : ""} ${user.animationEnabled && isEntering ? "entering" : ""}`}>
        <div 
          className={`sidebar-backdrop mobile-only ${isSidebarOpen ? "open" : ""}`} 
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
        {/* Sidebar */}
        <aside className={`station-sidebar glass ${isSidebarOpen ? "open" : ""}`}>
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
                   transition: user.animationEnabled ? 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease' : 'none', 
                   opacity: draggedSectorIndex === idx ? 0.5 : 1,
                   transform: user.animationEnabled && dragOverSectorIndex === idx 
                     ? (draggedSectorIndex !== null && draggedSectorIndex > idx ? 'translateY(-4px)' : 'translateY(4px)') 
                     : 'none',
                   borderTop: dragOverSectorIndex === idx && draggedSectorIndex !== null && draggedSectorIndex > idx ? '2px solid rgba(139, 92, 246, 0.5)' : '2px solid transparent',
                   borderBottom: dragOverSectorIndex === idx && draggedSectorIndex !== null && draggedSectorIndex < idx ? '2px solid rgba(139, 92, 246, 0.5)' : '2px solid transparent',
                }}
              >
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
                    className="sector-tab-edit-btn hidden md:flex"
                    onClick={(e) => { e.stopPropagation(); setEditingSector(sector); }}
                    title="Edit sector"
                    aria-label={`Edit ${sector.name}`}
                  >
                    <PencilSquareIcon width={14} height={14} />
                  </div>
                </button>
              </div>
            ))}

            {allCollabSectors.length > 0 && (
              <>
                <div className="sidebar-label" style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-starlight)" }}>
                  <DynamicIcon name="UsersIcon" width={14} height={14} /> Collab Sectors
                </div>
                {allCollabSectors.map((sector) => {
                  const isOwner = sector.stationId === station?.id;
                  return (
                    <div key={sector.id} className="sector-tab-wrapper collab-sector-tab">
                      <button
                        id={`tab-sector-${sector.id}`}
                        className={`sector-tab group ${activeSectorId === sector.id ? "active" : ""}`}
                        onClick={() => handleTabClick(sector.id)}
                        style={activeSectorId === sector.id && sector.color
                          ? { borderLeftColor: sector.color, color: sector.color }
                          : undefined}
                      >
                        <span className="sector-tab-icon"><DynamicIcon name={sector.icon} /></span>
                        <span className="sector-tab-name">
                          {sector.name}
                        </span>
                        {isOwner && (
                          <div className="relative w-6 h-6 flex items-center justify-center shrink-0 ml-1">
                            {/* Crown Icon (visible when NOT hovered) */}
                            <div className="absolute inset-0 flex items-center justify-center text-yellow-500 opacity-100 group-hover:opacity-0 transition-opacity pointer-events-none" title="Sector Owner">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V18H19V19Z" />
                              </svg>
                            </div>
                            {/* Edit Button (visible when hovered on desktop, hidden on mobile) */}
                            <div
                              className="absolute inset-0 items-center justify-center text-gray-400 hover:text-white opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-white/10 rounded-md hidden md:flex"
                              onClick={(e) => { e.stopPropagation(); setEditingSector(sector); }}
                              title="Edit sector"
                              aria-label={`Edit ${sector.name}`}
                            >
                              <PencilSquareIcon width={14} height={14} />
                            </div>
                          </div>
                        )}
                        {!isOwner && (
                          <div className="relative w-6 h-6 flex items-center justify-center shrink-0 ml-1">
                            <div
                              className="absolute inset-0 flex items-center justify-center text-gray-400 hover:text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-white/10 rounded-md"
                              onClick={(e) => { e.stopPropagation(); setViewingMembersSector(sector); }}
                              title="View Members"
                              aria-label={`View Members of ${sector.name}`}
                            >
                              <DynamicIcon name="UsersIcon" width={14} height={14} />
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

        <main className="station-main">
          <div className="station-section-header relative" style={{ minHeight: "56px", display: "flex", alignItems: "center" }}>
            <AnimatePresence mode="wait">
              {!mobileMenuOpen ? (
                <motion.div 
                  key="title"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full flex justify-between items-center"
                >
                  <div className="min-w-0 pr-2" style={{ flex: 1 }}>
                    <h2 className="station-section-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {displaySectorId === "all"
                        ? "All Beacons"
                        : <><DynamicIcon name={activeSector?.icon} style={{ display: "inline-block", verticalAlign: "middle", width: "24px", height: "24px", flexShrink: 0 }} /> <span className="truncate">{activeSector?.name ?? ""}</span> {activeSector && !activeSector.isPublic && <LockClosedIcon width={20} height={20} style={{ display: "inline-block", verticalAlign: "middle", opacity: 0.5, flexShrink: 0 }} title="Private Sector" />}</>}
                    </h2>
                    <p className="station-section-sub truncate">
                      {visibleBeacons.length} beacon{visibleBeacons.length !== 1 ? "s" : ""}
                      {searchQuery && ` matching "${searchQuery}"`}
                    </p>
                  </div>

                  {/* Desktop right side buttons */}
                  {allSectors.length > 0 && (
                    <div className="hidden md:flex shrink-0" style={{ gap: "0.5rem" }}>
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
                          flexShrink: 0
                        }}
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        title="Refresh Sector Data"
                      >
                        <ArrowPathIcon width={18} height={18} className={isRefreshing ? "animate-spin" : ""} />
                      </button>
                      <button
                        id="btn-add-beacon"
                        className="btn btn-primary"
                        style={{
                          background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                          boxShadow: "0 0 15px rgba(139, 92, 246, 0.5)",
                          border: "1px solid rgba(139, 92, 246, 0.5)",
                          color: "#fff",
                          fontWeight: "600",
                          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                          whiteSpace: "nowrap"
                        }}
                        onClick={() => setShowAddBeacon(true)}
                        title="Add new beacon"
                      >
                        + Add Beacon
                      </button>
                    </div>
                  )}

                  {/* Mobile 3-dot trigger */}
                  {allSectors.length > 0 && (
                    <div className="flex md:hidden shrink-0">
                      <button className="btn-icon" style={{ height: "38px", width: "38px", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setMobileMenuOpen(true)}>
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
                  className="w-full flex justify-end items-center"
                >
                  {/* Invisible overlay to catch outside clicks */}
                  <div className="fixed inset-0 z-40" onClick={() => { setMobileMenuOpen(false); }} />
                  
                  <div className="relative z-50 flex gap-2 items-center justify-end w-full">
                    <button className="flex shrink-0 items-center justify-center" style={{ background: "rgba(255, 255, 255, 0.05)", borderRadius: "8px", height: "38px", width: "38px", color: "var(--color-comet)", transition: "background 0.15s" }} onClick={() => {
                      handleRefresh();
                      setMobileMenuOpen(false);
                    }}>
                      <ArrowPathIcon width={18} height={18} className={isRefreshing ? "animate-spin" : ""} />
                    </button>

                    {displaySectorId !== "all" && activeSector && activeSector.stationId === station?.id && (
                      <button 
                        className="flex shrink-0 items-center justify-center overflow-hidden whitespace-nowrap" 
                        style={{ background: "rgba(255, 255, 255, 0.05)", borderRadius: "8px", height: "38px", padding: "0 0.8rem", width: "auto", color: "var(--color-comet)", transition: "background 0.15s" }} 
                        onClick={() => {
                          setEditingSector(activeSector); 
                          setMobileMenuOpen(false);
                        }}
                      >
                        <PencilSquareIcon width={18} height={18} style={{ flexShrink: 0 }} />
                        <span style={{fontSize: "0.85rem", marginLeft:"0.4rem", display: "inline-block", color: "var(--color-comet)"}}>Edit Sector</span>
                      </button>
                    )}

                    <button 
                      className="flex shrink-0 items-center justify-center overflow-hidden whitespace-nowrap" 
                      style={{ color: "#fff", height: "38px", padding: "0 0.8rem", width: "auto", borderRadius: "8px", background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)", boxShadow: "0 0 15px rgba(139, 92, 246, 0.5)", border: "1px solid rgba(139, 92, 246, 0.5)", transition: "all 0.15s" }} 
                      onClick={() => {
                        setShowAddBeacon(true); 
                        setMobileMenuOpen(false);
                      }}
                    >
                      <PlusIcon width={18} height={18} style={{ flexShrink: 0 }} />
                      <span style={{fontSize: "0.85rem", marginLeft:"0.4rem", display: "inline-block"}}>Add Beacon</span>
                    </button>

                    <button className="flex shrink-0 items-center justify-center" style={{ height: "38px", width: "38px", color: "var(--color-comet)" }} onClick={() => { setMobileMenuOpen(false); }}>
                      <XMarkIcon width={24} height={24} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div key={`controls-${displaySectorId}`} className={`controls-anim-container ${isExiting && user.animationEnabled ? "exiting" : isEntering && user.animationEnabled ? "entering" : ""}`} style={{ marginBottom: "0.5rem", position: "relative", zIndex: 10 }}>
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
              
              {baseBeacons.length > 0 && (
                <>
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
                            onClick={() => { applyFilterSort(() => setFilterVisibility(opt.id as any)); setOpenMenu(null); }}
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
                    style={{ background: sortBy !== "date" ? "rgba(139, 92, 246, 0.2)" : "rgba(15, 15, 25, 0.6)", border: `1px solid ${sortBy !== "date" ? "#a78bfa" : "rgba(255, 255, 255, 0.1)"}`, color: sortBy !== "date" ? "#fff" : "#a1a1aa" }}
                    onClick={() => setOpenMenu(openMenu === "sort" ? null : "sort")}
                    title="Sort Beacons"
                  >
                    <ArrowsUpDownIcon width={18} height={18} />
                  </button>
                  {openMenu === "sort" && (
                    <div style={{ position: "absolute", top: "calc(100% + 0.5rem)", left: 0, background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.5rem", zIndex: 50, minWidth: "180px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {[
                        { id: "date", label: "Date Added" },
                        { id: "name", label: "Name" },
                        { id: "visits", label: "Total Visits" },
                        { id: "sector", label: "Sector Order", hide: displaySectorId !== "all" },
                        { id: "creator", label: "Added By", hide: !(displaySectorId !== "all" && allCollabSectors.some(s => s.id === displaySectorId)) }
                      ].filter(opt => !opt.hide).map(opt => (
                        <div key={opt.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: sortBy === opt.id ? "rgba(139, 92, 246, 0.2)" : "transparent", color: "#fff", borderRadius: "6px", overflow: "hidden", transition: "all 0.2s" }}>
                          <button
                            className="dropdown-option-btn hover:bg-white/5"
                            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem", border: "none", background: "transparent", color: "inherit", cursor: "pointer", textAlign: "left", fontSize: "0.85rem" }}
                            onClick={() => { applyFilterSort(() => setSortBy(opt.id as any)); }}
                          >
                            {opt.label}
                            {sortBy === opt.id && <CheckIcon width={14} height={14} style={{ color: "#a78bfa" }} />}
                          </button>
                          {sortBy === opt.id && (
                            <button
                              onClick={(e) => { e.stopPropagation(); applyFilterSort(() => setSortDir(d => d === "asc" ? "desc" : "asc")); }}
                              style={{ padding: "0.5rem", background: "rgba(255,255,255,0.05)", border: "none", borderLeft: "1px solid rgba(255,255,255,0.1)", color: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                              className="hover:bg-white/10"
                              title={`Sort ${sortDir === "asc" ? "Descending" : "Ascending"}`}
                            >
                              {sortDir === "asc" ? <BarsArrowUpIcon width={16} height={16} /> : <BarsArrowDownIcon width={16} height={16} />}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {(displaySectorId === "all" || (displaySectorId !== "all" && allCollabSectors.some(s => s.id === displaySectorId))) && (
                <div className="staggered-item" style={{ flex: 1, minWidth: "200px", maxWidth: "250px" }}>
                  <div className={`${user.animationEnabled ? "floating-controls" : ""}`} style={{ position: "relative", width: "100%", animationDelay: "0.4s" }}>
                    <MagnifyingGlassIcon style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", color: "#a1a1aa" }} />
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
                        transition: "all 0.2s"
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#a78bfa"}
                      onBlur={(e) => e.target.style.borderColor = "rgba(255, 255, 255, 0.1)"}
                    />
                  </div>
                </div>
              )}
              </>
            )}
          </div>
        </div>

          {/* Beacon masonry grid */}
          {visibleBeacons.length === 0 ? (
            <div className={`station-empty ${isExiting && user.animationEnabled ? "exiting" : isEntering && user.animationEnabled ? "entering" : ""}`} key={`empty-${displaySectorId}-${filterVisibility}-${searchQuery}`}>
              {allSectors.length === 0 ? (
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
            <div className={`beacon-masonry ${isExiting && user.animationEnabled ? "exiting" : isEntering && user.animationEnabled ? "entering" : ""}`} key={displaySectorId}>
              {columnWrapper.map((colItems, colIndex) => (
                <div className="beacon-masonry-col" key={`col-${colIndex}`}>
                  {colItems.map(({ beacon, globalIndex }) => (
                    <div
                      className={`
                        beacon-card-wrapper
                        ${isFilterExiting ? 'beacon-filter-exiting' : ''}
                        ${isFilterEntering ? 'beacon-filter-entering' : ''}
                        ${shrinkingBeacons.has(beacon.id) ? 'beacon-shrinking' : ''}
                        ${growingBeacons.has(beacon.id) ? 'beacon-growing' : ''}
                      `}
                      style={{ 
                        animationDelay: user.animationEnabled ? `${globalIndex * 0.03}s` : '0s',
                        transformOrigin: "center center"
                      }}
                      key={beacon.id}
                    >
                      <BeaconCard
                        beacon={beacon}
                        index={globalIndex}
                        onClick={() => setSelectedBeacon(beacon)}
                        onEdit={() => setEditingBeacon(beacon)}
                        isCollab={(activeSector?.collaborators?.length ?? 0) > 0}
                        sectorName={allSectors.find(s => s.id === beacon.sectorId)?.name}
                        isAllBeacons={displaySectorId === "all" && (user.hologramEnabled ?? true)}
                      />
                    </div>
                  ))}
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
        stats={stats}
        refetchStats={refetchNotifications}
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
          sectors={allSectors}
          initialSectorId={displaySectorId !== "all" ? displaySectorId : undefined}
          onClose={() => setShowAddBeacon(false)}
          onCreated={handleBeaconCreated}
        />
      )}

      {editingSector && (
        <EditSectorModal
          sector={editingSector}
          sectors={allOwnedSectors}
          currentUserId={user.id}
          onClose={() => setEditingSector(null)}
          onUpdated={handleSectorUpdated}
          onDeleted={handleSectorDelete}
        />
      )}

      {viewingMembersSector && (
        <SectorMembersModal
          sector={viewingMembersSector}
          currentUserId={user.id}
          ownerData={
            allOwnedSectors.find(s => s.id === viewingMembersSector.id) 
              ? user 
              : (viewingMembersSector as any).station?.user
          }
          onClose={() => setViewingMembersSector(null)}
        />
      )}

      {editingBeacon && (
        <EditBeaconModal
          beacon={editingBeacon}
          sectors={allSectors}
          onClose={() => setEditingBeacon(null)}
          onUpdated={handleBeaconUpdated}
          onDeleted={handleBeaconDeleted}
        />
      )}

      {selectedBeacon && !editingBeacon && (
        <BeaconDetailModal
          beacon={selectedBeacon}
          sector={allSectors.find(s => s.id === selectedBeacon.sectorId) ?? null}
          onClose={() => setSelectedBeacon(null)}
          onUpdated={handleBeaconUpdated}
          onDeleted={handleBeaconDeleted}
        />
      )}
    </div>
  );
}

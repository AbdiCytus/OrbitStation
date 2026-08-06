"use client";

import {
  useState,
  useMemo,
  useTransition,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import type { StationWithSectors, SectorWithBeacons, Beacon } from "@/types";
import BeaconCard from "@/components/beacon-card";
import AddBeaconModal from "@/components/add-beacon-modal";
import AddSectorModal from "@/components/add-sector-modal";
import EditSectorModal from "@/components/edit-sector-modal";
import EditBeaconModal from "@/components/edit-beacon-modal";
import BeaconDetailModal from "@/components/beacon-detail-modal";
import TagManagementModal from "@/components/tag-management-modal";
import SectorMembersModal from "@/components/sector-members-modal";
import FriendsModal from "@/components/friends-modal";
import StationNavbar from "@/components/station-navbar";
import SpaceBackground from "@/components/space-background";
import StaticStarfield from "@/components/static-starfield";
import { DynamicIcon } from "@/components/dynamic-icon";
import {
  PlusIcon,
  LockClosedIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  RocketLaunchIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  CheckIcon,
  BarsArrowUpIcon,
  BarsArrowDownIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  ArrowPathIcon,
  EllipsisVerticalIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  TagIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import GroupChatModal from "@/components/group-chat-modal";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/hooks/use-notifications";
import { useBeaconColors } from "@/hooks/use-beacon-colors";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { useSectorDrag } from "@/hooks/use-sector-drag";
import { useBeaconFilters } from "@/hooks/use-beacon-filters";
import { useStationCrud } from "@/hooks/use-station-crud";
import { toast } from "sonner";

type Props = {
  initialStation: StationWithSectors | null;
  initialCollabSectors?: (SectorWithBeacons & { collaborators?: any[] })[];
  visitingProfile?: any;
  user: {
    id: string;
    name: string | null;
    username?: string | null;
    image: string | null;
    callsign: string | null;
    animationEnabled: boolean;
    hologramEnabled?: boolean;
    staticBackgroundEnabled?: boolean;
    saveFilterSortEnabled?: boolean;
    shortcuts?: string | null;
    station?: { isPublic: boolean };
  };
};

export default function StationClient({
  initialStation,
  initialCollabSectors = [],
  user,
  visitingProfile,
}: Props) {
  const [station, setStation] = useState(initialStation);
  const [collabSectors, setCollabSectors] = useState(initialCollabSectors);
  const [activeSectorId, setActiveSectorId] = useState<string | "all">("all");
  const [displaySectorId, setDisplaySectorId] = useState<string | "all">("all");
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [funFact, setFunFact] = useState("");

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [isIdle, setIsIdle] = useState(false);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [, startTransition] = useTransition();

  const {
    growingBeacons,
    shrinkingBeacons,
    selectedBeacon,
    setSelectedBeacon,
    editingBeacon,
    setEditingBeacon,
    showAddBeacon,
    setShowAddBeacon,
    showAddSector,
    setShowAddSector,
    editingSector,
    setEditingSector,
    viewingMembersSector,
    setViewingMembersSector,
    handleSectorCreated,
    handleSectorUpdated,
    handleBeaconCreated,
    handleBeaconUpdated,
    handleBeaconDeleted,
    handleSectorDelete,
  } = useStationCrud({
    user,
    setStation,
    setCollabSectors,
    setActiveSectorId,
    setDisplaySectorId,
    startTransition,
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuCaption, setMobileMenuCaption] = useState<
    "edit" | "add" | null
  >(null);

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
    "If two pieces of the same type of metal touch in space, they will bond permanently.",
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
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
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

    const isAnyModalOpen =
      showAddSector ||
      showAddBeacon ||
      !!editingSector ||
      !!editingBeacon ||
      !!selectedBeacon ||
      showFriendsModal ||
      !!viewingMembersSector ||
      showGroupChat;
    if (Math.abs(diffX) > Math.abs(diffY) && !isAnyModalOpen) {
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
  const [openMenu, setOpenMenu] = useState<"filter" | "sort" | "tags" | null>(
    null,
  );
  const [showTagModal, setShowTagModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Track which private chat is open so useNotifications can suppress its toast
  const [activeFriendChatId, setActiveFriendChatId] = useState<string | null>(
    null,
  );
  const [targetFriendChatId, setTargetFriendChatId] = useState<string | null>(
    null,
  );

  const handleChatNotificationClick = useCallback(
    (type: "private" | "group", id: string) => {
      if (type === "private") {
        setTargetFriendChatId(id);
        setShowFriendsModal(true);
      } else if (type === "group") {
        setDisplaySectorId(id);
        setShowGroupChat(true);
      }
    },
    [],
  );

  const {
    stats,
    refetch: refetchNotifications,
    unreadGroupSectors,
    clearGroupUnread,
  } = useNotifications({
    userId: user?.id,
    activeSectorId: showGroupChat
      ? displaySectorId !== "all"
        ? displaySectorId
        : null
      : null,
    activeFriendId: activeFriendChatId,
    onChatNotificationClick: handleChatNotificationClick,
  });

  useEffect(() => {
    if (
      showGroupChat &&
      typeof displaySectorId === "string" &&
      displaySectorId !== "all"
    ) {
      clearGroupUnread(displaySectorId);
    }
  }, [showGroupChat, displaySectorId, clearGroupUnread]);

  // Sektor yang sedang dibuka punya pesan yang belum dibaca
  const currentUnread =
    typeof displaySectorId === "string"
      ? unreadGroupSectors[displaySectorId]
      : null;
  const hasUnreadInCurrentSector = currentUnread?.unread || false;
  const hasMentionInCurrentSector = currentUnread?.mention || false;

  const allOwnedSectors = [...(station?.sectors ?? [])].sort(
    (a, b) => a.order - b.order,
  );
  const personalSectors = allOwnedSectors.filter(
    (s) => !s.collaborators || s.collaborators.length === 0,
  );
  const myCollabSectors = allOwnedSectors.filter(
    (s) => s.collaborators && s.collaborators.length > 0,
  );
  const allCollabSectors = [...myCollabSectors, ...collabSectors];
  const allSectors = [...allOwnedSectors, ...collabSectors];

  // Beacon color computation (extracted to hook)
  const beaconColors = useBeaconColors(allSectors);

  const scrollThrottleRef = useRef<number>(0);

  // Beacon filtering, sorting, view mode, and responsive pagination (extracted to hook)
  const {
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
    applyFilterSort,
    handleSearchChange,
    baseBeacons,
    visibleBeacons,
    paginatedBeacons,
    columnWrapper,
    cols,
  } = useBeaconFilters({
    allSectors,
    personalSectors,
    displaySectorId,
    beaconColors,
    user,
  });

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

  const activeSector =
    allSectors.find((s) => s.id === displaySectorId) ?? null;

  const isCurrentSectorAdminOrOwner =
    !visitingProfile &&
    (displaySectorId === "all" ||
      station?.userId === user.id ||
      (activeSector as any)?.collaborators?.some(
        (c: any) => c.userId === user.id && c.role === "ADMIN",
      ));

  // Real-time beacon & role sync (extracted to hook)
  useRealtimeSync({
    userId: user.id,
    userName: user.name,
    userImage: user.image,
    allSectors,
    onBeaconCreated: handleBeaconCreated,
    onBeaconUpdated: handleBeaconUpdated,
    onBeaconDeleted: handleBeaconDeleted,
    setStation,
  });

  const displayName = user.callsign ?? user.name ?? "Pilot";
  const animEnabled = user.animationEnabled;

  // Sector drag & drop reorder (extracted to hook)
  const {
    draggedSectorIndex,
    dragOverSectorIndex,
    handleSectorDragStart,
    handleSectorDragOver,
    handleSectorDrop,
    handleSectorDragEnd,
  } = useSectorDrag(personalSectors, setStation);


  return (
    <div
      className={`station-root${animEnabled ? "" : " no-animation"} ${user.animationEnabled && isExiting ? "exiting" : ""} ${user.animationEnabled && isEntering ? "entering" : ""}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseMove={resetIdleTimer}>
      {/* Animated space canvas background or static fallback */}
      {(user as any).staticBackgroundEnabled ? (
        <div
          className="cosmic-bg fixed inset-0 z-[-1] pointer-events-none static-cosmic-bg"
          aria-hidden="true">
          <div className="cosmic-stars"></div>
          <div
            className="cosmic-aurora"
            style={{ opacity: 0.5, transform: "scale(1.2)" }}></div>
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
          seed={
            activeSectorId
              ? activeSectorId
                .split("")
                .reduce((a, c) => a + c.charCodeAt(0), 0)
              : 42
          }
          sectorColor={activeSector?.color}
        />
      )}

      {/* Fun fact overlay */}
      {isExiting && user.animationEnabled && (
        <div
          className="fun-fact-overlay"
          style={{
            animationDuration: (() => {
              if (
                typeof navigator !== "undefined" &&
                "connection" in navigator
              ) {
                const conn = (navigator as any).connection;
                if (conn.effectiveType === "slow-2g") return "3.5s";
                if (conn.effectiveType === "2g") return "2.5s";
                if (conn.effectiveType === "3g") return "1.5s";
              }
              return "0.8s";
            })(),
          }}>
          <p className="fun-fact-text">
            <SparklesIcon
              width={20}
              height={20}
              style={{
                display: "inline-block",
                marginRight: "0.5rem",
                verticalAlign: "middle",
              }}
            />
            {funFact}
          </p>
        </div>
      )}

      {/* Navbar */}
      <StationNavbar
        user={{
          ...user,
          callsign: user.callsign,
          username: (user as any).username,
        }}
        hideSearch={true}
        displayName={displayName}
        onOpenFriends={() => setShowFriendsModal(true)}
        stats={stats}
        isPublicProfile={station?.isPublic}
        visitingProfile={visitingProfile}
      />

      {/* Mobile Sidebar Toggle Button */}
      {!(
        showAddSector ||
        showAddBeacon ||
        !!editingSector ||
        !!editingBeacon ||
        !!selectedBeacon ||
        showFriendsModal ||
        !!viewingMembersSector
      ) && (
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

      <div
        className={`station-layout ${user.animationEnabled && isExiting ? "exiting" : ""} ${user.animationEnabled && isEntering ? "entering" : ""}`}>
        <div
          className={`sidebar-backdrop mobile-only ${isSidebarOpen ? "open" : ""}`}
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
        {/* Sidebar */}
        <aside
          className={`station-sidebar glass ${isSidebarOpen ? "open" : ""}`}>
          <div className="sidebar-header">
            <span className="sidebar-label">Sectors</span>
            {!visitingProfile && (
              <button
                id="btn-add-sector"
                className="btn-icon"
                data-tooltip="Add new sector"
                onClick={() => setShowAddSector(true)}>
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
                      setEditingSector(sector);
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
                                setEditingSector(sector);
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
                                setViewingMembersSector(sector);
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

        <main
          className="station-main"
          onScroll={(e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
            // Toleransi scroll yang pas (150px dari bawah)
            if (scrollHeight - scrollTop - clientHeight < 150) {
              const now = Date.now();
              if (now - scrollThrottleRef.current > 400) {
                scrollThrottleRef.current = now;
                setVisibleLimit((prev) =>
                  prev < visibleBeacons.length ? prev + 12 : prev,
                );
              }
            }
          }}>
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
                      {visibleBeacons.length} beacon
                      {visibleBeacons.length !== 1 ? "s" : ""}
                      {searchQuery && ` matching "${searchQuery}"`}
                    </p>
                  </div>

                  {/* Desktop right side buttons */}
                  {allSectors.length > 0 && (
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
                      {isCurrentSectorAdminOrOwner && (
                        <button
                          id="btn-add-beacon"
                          className="btn btn-primary"
                          style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)", boxShadow: "0 0 15px rgba(139, 92, 246, 0.5)", border: "1px solid rgba(139, 92, 246, 0.5)", color: "#fff", fontWeight: "600", textShadow: "0 1px 2px rgba(0,0,0,0.3)", whiteSpace: "nowrap" }}
                          onClick={() => isCurrentSectorAdminOrOwner ? setShowAddBeacon(true) : setShowAccessDenied(true)}
                          data-tooltip="Add new beacon"
                        >
                          + Add Beacon
                        </button>
                      )}
                    </div>
                  )}

                  {/* Mobile 3-dot trigger */}
                  {allSectors.length > 0 && (
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
                    {displaySectorId !== "all" && (
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
                            setShowTagModal(true);
                            setMobileMenuOpen(false);
                          }}>
                          <TagIcon width={18} height={18} />
                        </button>
                    )}
                    {/* Logika Akses: Hanya Owner atau Admin yang bisa edit/tambah */}
                    {displaySectorId !== "all" && activeSector && activeSector.stationId === station?.id && (
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
                          setEditingSector(activeSector);
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

                    {/* Logika Akses: Hanya Owner atau Admin yang bisa tambah beacon */}
                    {isCurrentSectorAdminOrOwner && (
                        <button
                          className="flex shrink-0 items-center justify-center overflow-hidden whitespace-nowrap"
                          style={{ color: "#fff", height: "38px", padding: "0 0.8rem", width: "auto", borderRadius: "8px", background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)", boxShadow: "0 0 15px rgba(139, 92, 246, 0.5)", border: "1px solid rgba(139, 92, 246, 0.5)", transition: "all 0.15s" }}
                          onClick={() => {
                            setMobileMenuOpen(false);
                            if (!isCurrentSectorAdminOrOwner) { setShowAccessDenied(true); return; }
                            setShowAddBeacon(true);
                          }}
                        >
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

              {baseBeacons.length > 0 && (
                <>
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
                            color:
                              filterVisibility !== "all" ? "#fff" : "#a1a1aa",
                          }}
                          onClick={() =>
                            setOpenMenu(openMenu === "filter" ? null : "filter")
                          }
                          data-tooltip="Filter by Visibility">
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

                  {displaySectorId !== "all" && ((sectorTagsOverride[displaySectorId] ?? allSectors.find(s => s.id === displaySectorId)?.tags ?? []).length) > 0 && (
                    <div className="staggered-item">
                      <div className={`custom-dropdown ${user.animationEnabled ? "floating-controls" : ""}`} style={{ position: "relative" }}>
                        <button
                          className="custom-dropdown-btn"
                          style={{
                            background: selectedTags.length > 0 ? "rgba(139, 92, 246, 0.2)" : "rgba(15, 15, 25, 0.6)",
                            border: `1px solid ${selectedTags.length > 0 ? "#a78bfa" : "rgba(255, 255, 255, 0.1)"}`,
                            color: selectedTags.length > 0 ? "#fff" : "#a1a1aa",
                          }}
                          onClick={() => setOpenMenu(openMenu === "tags" ? null : "tags")}
                          data-tooltip="Filter by Tags">
                          <TagIcon width={18} height={18} />
                        </button>
                        {/* Tags dropdown menu: renders inline when openMenu is "tags" */}
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
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                                <div style={{ color: "#a1a1aa", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Filter by Tags</div>
                                {selectedTags.length > 0 && (
                                    <button 
                                        onClick={() => setSelectedTags([])}
                                        style={{ color: "#ef4444", fontSize: "0.7rem", fontWeight: 600, background: "rgba(239, 68, 68, 0.1)", padding: "0.15rem 0.4rem", borderRadius: "4px" }}
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                            
                            {/* Live Search Input */}
                            <div style={{ position: "relative" }}>
                                <MagnifyingGlassIcon width={14} height={14} style={{ position: "absolute", left: "0.5rem", top: "50%", transform: "translateY(-50%)", color: "#6b7280" }} />
                                <input 
                                    type="text" 
                                    placeholder="Search tags..." 
                                    value={tagSearchQuery}
                                    onChange={(e) => setTagSearchQuery(e.target.value)}
                                    style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "0.35rem 0.5rem 0.35rem 1.75rem", color: "#fff", fontSize: "0.75rem", outline: "none" }}
                                />
                            </div>

                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem", maxHeight: "200px", overflowY: "auto" }}>
                                {(sectorTagsOverride[displaySectorId] ?? allSectors.find(s => s.id === displaySectorId)?.tags ?? [])
                                .filter(opt => opt.name.toLowerCase().includes(tagSearchQuery.toLowerCase()))
                                .map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => applyFilterSort(() => setSelectedTags(prev => prev.includes(opt.id) ? prev.filter(id => id !== opt.id) : [...prev, opt.id]))}
                                    style={{
                                    padding: "0.25rem 0.75rem",
                                    borderRadius: "9999px",
                                    fontSize: "0.75rem",
                                    fontWeight: 500,
                                    transition: "all 0.2s",
                                    border: selectedTags.includes(opt.id) ? "1px solid rgba(139, 92, 246, 0.5)" : "1px solid transparent",
                                    background: selectedTags.includes(opt.id) ? "rgba(139, 92, 246, 0.2)" : "rgba(255, 255, 255, 0.05)",
                                    color: selectedTags.includes(opt.id) ? "#c4b5fd" : "#d1d5db",
                                    }}
                                >
                                    {opt.name}
                                </button>
                                ))}
                                {(sectorTagsOverride[displaySectorId] ?? allSectors.find(s => s.id === displaySectorId)?.tags ?? []).filter(opt => opt.name.toLowerCase().includes(tagSearchQuery.toLowerCase())).length === 0 && (
                                <p style={{ color: "#6b7280", fontSize: "0.875rem", fontStyle: "italic", width: "100%", textAlign: "center", padding: "1rem 0" }}>No matching tags.</p>
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
                        onClick={() =>
                          setOpenMenu(openMenu === "sort" ? null : "sort")
                        }
                        data-tooltip="Sort Beacons">
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
                                allCollabSectors.some(
                                  (s) => s.id === displaySectorId,
                                )
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
                                    applyFilterSort(() =>
                                      setSortBy(opt.id as any),
                                    );
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
                                        setSortDir((d) =>
                                          d === "asc" ? "desc" : "asc",
                                        ),
                                      );
                                    }}
                                    style={{
                                      padding: "0.5rem",
                                      background: "rgba(255,255,255,0.05)",
                                      border: "none",
                                      borderLeft:
                                        "1px solid rgba(255,255,255,0.1)",
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
                                      <BarsArrowDownIcon
                                        width={16}
                                        height={16}
                                      />
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
                      allCollabSectors.some(
                        (s) => s.id === displaySectorId,
                      ))) && (
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
                            onFocus={(e) =>
                              (e.target.style.borderColor = "#a78bfa")
                            }
                            onBlur={(e) =>
                            (e.target.style.borderColor =
                              "rgba(255, 255, 255, 0.1)")
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
                        background: viewMode === "masonry" ? "rgba(168, 85, 247, 0.3)" : "transparent",
                        color: viewMode === "masonry" ? "#e9d5ff" : "rgba(255, 255, 255, 0.5)",
                        cursor: "pointer",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      onClick={() => setViewMode("masonry")}
                      data-tooltip={cols <= 2 ? "1 Column View" : "Masonry View"}
                    >
                      <ViewColumnsIcon width={18} height={18} />
                    </button>
                    <button
                      style={{ 
                        padding: "6px", 
                        borderRadius: "6px", 
                        transition: "colors 0.2s",
                        background: viewMode === "grid" ? "rgba(168, 85, 247, 0.3)" : "transparent",
                        color: viewMode === "grid" ? "#e9d5ff" : "rgba(255, 255, 255, 0.5)",
                        cursor: "pointer",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      onClick={() => setViewMode("grid")}
                      data-tooltip={cols <= 2 ? "2 Columns View" : "Grid View"}
                    >
                      <Squares2X2Icon width={18} height={18} />
                    </button>
                  </div>

                </>
              )}
            </div>
          </div>

          {/* Beacon masonry grid */}
          {visibleBeacons.length === 0 ? (
            <div
              className={`station-empty ${isExiting && user.animationEnabled ? "exiting" : isEntering && user.animationEnabled ? "entering" : ""}`}
              key={`empty-${displaySectorId}-${filterVisibility}-${searchQuery}`}>
              {allSectors.length === 0 ? (
                <>
                  <div className="station-empty-icon">
                    <RocketLaunchIcon width={48} height={48} />
                  </div>
                  <p className="station-empty-title">
                    {visitingProfile ? "This Station is empty" : "Your Station is empty"}
                  </p>
                  <p className="station-empty-sub">
                    {visitingProfile 
                      ? "This pilot hasn't created any sectors yet."
                      : "Create your first Sector to start organizing your web shortcuts."}
                  </p>
                  {isCurrentSectorAdminOrOwner && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowAddSector(true)}>
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
                  {!searchQuery && filterVisibility === "all" && isCurrentSectorAdminOrOwner && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowAddBeacon(true)}>
                      + Add Beacon
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
            {viewMode === "grid" && (
              <style dangerouslySetInnerHTML={{ __html: `
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
              `}} />
            )}
            <div
              className={`${viewMode === "masonry" ? "beacon-masonry" : "beacon-grid-view"} ${isExiting && user.animationEnabled ? "exiting" : isEntering && user.animationEnabled ? "entering" : ""}`}
              key={`${displaySectorId}-${viewMode}`}>
              {viewMode === "masonry" ? (
                columnWrapper.map((colItems, colIndex) => (
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
                          onClick={() => setSelectedBeacon(beacon)}
                          onEdit={
                            isCurrentSectorAdminOrOwner
                              ? () => setEditingBeacon(beacon)
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
              ) : (
                paginatedBeacons.map((beacon, globalIndex) => (
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
                      onClick={() => setSelectedBeacon(beacon)}
                      onEdit={
                        isCurrentSectorAdminOrOwner
                          ? () => setEditingBeacon(beacon)
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
                ))
              )}
            </div>
            </>
          )}

          {visibleLimit < visibleBeacons.length && (
            <div className="w-full text-center py-6 text-gray-500 text-sm italic">
              Scanning space for more signals...
            </div>
          )}

          {/* Group Chat FAB (only if collab sector) */}
          {displaySectorId !== "all" &&
            allCollabSectors.some((s) => s.id === displaySectorId) && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => {
                  setShowGroupChat(true);
                  if (
                    typeof displaySectorId === "string" &&
                    displaySectorId !== "all"
                  ) {
                    clearGroupUnread(displaySectorId);
                  }
                }}
                style={{ padding: "10px" }}
                className="fixed bottom-6 right-6 z-[9999] bg-violet-600 hover:bg-violet-500 text-white rounded-full shadow-[0_0_20px_rgba(139,92,246,0.6)] transition-transform hover:scale-110 flex items-center justify-center group">
                <ChatBubbleOvalLeftEllipsisIcon width={32} height={32} />

                <AnimatePresence>
                  {hasUnreadInCurrentSector && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-[rgba(20,20,30,1)] shadow-lg">
                      {hasMentionInCurrentSector ? "@" : "!"}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            )}
    

      </main>
      </div>

      <FriendsModal
        isOpen={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
        user={user}
        stats={stats}
        refetchStats={refetchNotifications}
        onActiveChatChange={setActiveFriendChatId}
        targetChatId={targetFriendChatId}
        onTargetChatHandled={() => setTargetFriendChatId(null)}
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
          sectors={allSectors.filter(s =>
            (s as any).stationId === station?.id ||
            (s as any).collaborators?.find((c: any) => c.userId === user.id)?.role === "ADMIN"
          )}
          initialSectorId={
            displaySectorId !== "all" ? displaySectorId : undefined
          }
          currentStationId={station?.id}
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
            allOwnedSectors.find((s) => s.id === viewingMembersSector.id)
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
          sector={allSectors.find((s) => s.id === selectedBeacon.sectorId) ?? null}
          onClose={() => setSelectedBeacon(null)}
          onUpdated={handleBeaconUpdated}
          onDeleted={handleBeaconDeleted}
          canEdit={isCurrentSectorAdminOrOwner}
        />
      )}

      {showTagModal && displaySectorId !== "all" && (
        <TagManagementModal
          isOpen={showTagModal}
          onClose={() => setShowTagModal(false)}
          sector={allSectors.find(s => s.id === displaySectorId)!}
          sectorTagsOverride={sectorTagsOverride[displaySectorId]}
          onTagsChanged={(tags) => {
            setSectorTagsOverride(prev => ({ ...prev, [displaySectorId]: tags }));
            // Remove any selected tag filters that no longer exist
            const tagIds = tags.map(t => t.id);
            setSelectedTags(prev => prev.filter(id => tagIds.includes(id)));
          }}
        />
      )}


      <AnimatePresence>
        {showAccessDenied && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center backdrop-blur-sm" onClick={() => setShowAccessDenied(false)} style={{ padding: "12px" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-[#0b0c10] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center text-center p-8 rounded-3xl w-[90%] max-w-sm" onClick={e => e.stopPropagation()} style={{ padding: "12px" }}>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 border border-red-500/30">
                <svg width="32" height="32" fill="none" stroke="#f87171" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Access Denied</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">You do not have permission to perform this action. Only Sector Admins or the Owner can modify beacons here.</p>
              <button onClick={() => window.location.reload()} className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-colors cursor-pointer border-none">
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {displaySectorId !== "all" && (
        <GroupChatModal
          isOpen={showGroupChat}
          onClose={() => setShowGroupChat(false)}
          sector={
            allCollabSectors.find((s) => s.id === displaySectorId) || null
          }
          user={user}
          isOwner={allOwnedSectors.some((s) => s.id === displaySectorId)}
        />
      )}
    </div>
  );
}

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
import StationNavbar from "@/components/station-navbar";
import SpaceBackground from "@/components/space-background";
import StaticStarfield from "@/components/static-starfield";
import StationSidebar from "@/components/station/station-sidebar";
import StationHeader from "@/components/station/station-header";
import StationToolbar from "@/components/station/station-toolbar";
import BeaconGridView from "@/components/station/beacon-grid-view";
import StationModals from "@/components/station/station-modals";
import {
  SparklesIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  ClockIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import BeaconCard from "@/components/beacon-card";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/hooks/use-notifications";
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
  const [showRecentVisits, setShowRecentVisits] = useState(true);

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

    setTimeout(() => {
      setDisplaySectorId(sectorId);
      setIsExiting(false);
      setIsEntering(true);
    }, 800);
  };
  const [openMenu, setOpenMenu] = useState<"filter" | "sort" | "tags" | null>(
    null,
  );
  const [showTagModal, setShowTagModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [destinationBeacon, setDestinationBeacon] = useState<Beacon | null>(
    null,
  );
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
    isPrefLoading,
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

  const activeSector = allSectors.find((s) => s.id === displaySectorId) ?? null;

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
      onMouseMove={resetIdleTimer}
    >
      {/* Animated space canvas background or static fallback */}
      {(user as any).staticBackgroundEnabled ? (
        <div
          className="cosmic-bg fixed inset-0 z-[-1] pointer-events-none static-cosmic-bg"
          aria-hidden="true"
        >
          <div className="cosmic-stars"></div>
          <div
            className="cosmic-aurora"
            style={{ opacity: 0.5, transform: "scale(1.2)" }}
          ></div>
          <div className="cosmic-dust"></div>
        </div>
      ) : animEnabled ? (
        <SpaceBackground
          key="on"
          sector={activeSectorId}
          sectorColor={activeSector?.color}
          animEnabled={true}
          transitionDuration={800}
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
        <div className="fun-fact-overlay" style={{ animationDuration: "0.8s" }}>
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

      <div
        className={`station-layout ${user.animationEnabled && isExiting ? "exiting" : ""} ${user.animationEnabled && isEntering ? "entering" : ""}`}
      >
        <StationSidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          activeSectorId={activeSectorId}
          handleTabClick={handleTabClick}
          visitingProfile={visitingProfile}
          personalSectors={personalSectors}
          allCollabSectors={allCollabSectors}
          station={station}
          user={user}
          isIdle={isIdle}
          isAnyModalOpen={
            showAddSector ||
            showAddBeacon ||
            !!editingSector ||
            !!editingBeacon ||
            !!selectedBeacon ||
            showFriendsModal ||
            !!viewingMembersSector
          }
          draggedSectorIndex={draggedSectorIndex}
          dragOverSectorIndex={dragOverSectorIndex}
          handleSectorDragStart={handleSectorDragStart}
          handleSectorDragOver={handleSectorDragOver}
          handleSectorDrop={handleSectorDrop}
          handleSectorDragEnd={handleSectorDragEnd}
          onAddSector={() => setShowAddSector(true)}
          onEditSector={(sector) => setEditingSector(sector)}
          onViewMembers={(sector) => setViewingMembersSector(sector)}
        />

        <main
          className="station-main"
          onScroll={(e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
            if (scrollHeight - scrollTop - clientHeight < 150) {
              const now = Date.now();
              if (now - scrollThrottleRef.current > 400) {
                scrollThrottleRef.current = now;
                setVisibleLimit((prev) =>
                  prev < visibleBeacons.length ? prev + 12 : prev,
                );
              }
            }
          }}
        >
          <StationHeader
            displaySectorId={displaySectorId}
            activeSector={activeSector}
            visibleBeaconsCount={visibleBeacons.length}
            searchQuery={searchQuery}
            allSectorsCount={allSectors.length}
            isRefreshing={isRefreshing}
            handleRefresh={handleRefresh}
            isCurrentSectorAdminOrOwner={isCurrentSectorAdminOrOwner}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
            onAddBeacon={() => {
              if (!isCurrentSectorAdminOrOwner) {
                setShowAccessDenied(true);
                return;
              }
              setShowAddBeacon(true);
            }}
            onEditSector={() => setEditingSector(activeSector)}
            onManageTags={() => setShowTagModal(true)}
            station={station}
          />

          <StationToolbar
            baseBeaconsCount={baseBeacons.length}
            displaySectorId={displaySectorId}
            allSectors={allSectors}
            allCollabSectors={allCollabSectors}
            sectorTagsOverride={sectorTagsOverride}
            user={user}
            isExiting={isExiting}
            isEntering={isEntering}
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            filterVisibility={filterVisibility}
            setFilterVisibility={setFilterVisibility}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
            tagSearchQuery={tagSearchQuery}
            setTagSearchQuery={setTagSearchQuery}
            tagFilterMode={tagFilterMode}
            setTagFilterMode={setTagFilterMode}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortDir={sortDir}
            setSortDir={setSortDir}
            localSearchQuery={localSearchQuery}
            handleSearchChange={handleSearchChange}
            viewMode={viewMode}
            setViewMode={setViewMode}
            cols={cols}
            applyFilterSort={applyFilterSort}
          />

          {displaySectorId === "all" &&
            baseBeacons.length > 0 &&
            !searchQuery && (
              <div
                className={`mb-2 ${user.animationEnabled && isExiting ? "exiting" : ""} ${user.animationEnabled && isEntering ? "entering" : ""}`}
                style={{ animationDelay: "0.1s" }}
              >
                <button
                  onClick={() => setShowRecentVisits(!showRecentVisits)}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    color: "var(--color-starlight)",
                    marginBottom: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    padding: 0,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  <ClockIcon
                    width={18}
                    height={18}
                    style={{ color: "var(--color-violet-glow)" }}
                  />
                  Recent Visits
                  <ChevronDownIcon
                    width={16}
                    height={16}
                    style={{
                      color: "var(--color-comet)",
                      transform: showRecentVisits
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </button>

                {/* COLLAPSIBLE CONTENT */}
                <AnimatePresence initial={false}>
                  {showRecentVisits && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <div
                        className={`
                        ${viewMode === "grid" ? "beacon-grid-view" : "beacon-masonry"} 
                        ${user.animationEnabled && (isEntering || isFilterEntering) ? "entering" : ""} 
                        ${user.animationEnabled && (isExiting || isFilterExiting) ? "exiting" : ""}
                      `}
                        style={{
                          paddingBottom: "0.5rem",
                          paddingTop: "0.5rem",
                        }}
                      >
                        {baseBeacons
                          .slice()
                          .sort(
                            (a, b) =>
                              new Date(b.updatedAt || b.createdAt).getTime() -
                              new Date(a.updatedAt || a.createdAt).getTime(),
                          )
                          .slice(0, cols <= 2 ? 2 : cols)
                          .map((beacon, idx) => {
                            const isCollab = allCollabSectors.some(
                              (s) => s.id === beacon.sectorId,
                            );
                            const card = (
                              <BeaconCard
                                key={`recent-${beacon.id}`}
                                beacon={beacon}
                                index={idx}
                                onClick={() => setSelectedBeacon(beacon)}
                                onEdit={
                                  !visitingProfile
                                    ? () => setEditingBeacon(beacon)
                                    : undefined
                                }
                                onLaunchDestination={(b) =>
                                  setDestinationBeacon(b)
                                }
                                isCollab={isCollab}
                                sectorName={beacon._sectorName}
                                isAllBeacons={true}
                                hologramEnabled={user.hologramEnabled}
                              />
                            );

                            return viewMode === "masonry" ? (
                              <div
                                key={`recent-wrap-${beacon.id}`}
                                className="beacon-masonry-col"
                              >
                                {card}
                              </div>
                            ) : (
                              card
                            );
                          })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    color: "var(--color-starlight)",
                    marginTop: showRecentVisits ? "1rem" : "1.5rem",
                    marginBottom: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    transition: "margin-top 0.3s ease",
                  }}
                >
                  <SparklesIcon
                    width={18}
                    height={18}
                    style={{ color: "var(--color-violet-glow)" }}
                  />
                  Beacons
                </h3>
              </div>
            )}

          <BeaconGridView
            visibleBeacons={visibleBeacons}
            paginatedBeacons={paginatedBeacons}
            columnWrapper={columnWrapper}
            viewMode={viewMode}
            displaySectorId={displaySectorId}
            allSectorsCount={allSectors.length}
            allCollabSectors={allCollabSectors}
            filterVisibility={filterVisibility}
            searchQuery={searchQuery}
            visitingProfile={visitingProfile}
            isCurrentSectorAdminOrOwner={isCurrentSectorAdminOrOwner}
            user={user}
            isExiting={isExiting}
            isEntering={isEntering}
            isFilterExiting={isFilterExiting}
            isFilterEntering={isFilterEntering}
            shrinkingBeacons={shrinkingBeacons}
            growingBeacons={growingBeacons}
            isPrefLoading={isPrefLoading}
            onSelectBeacon={(beacon) => setSelectedBeacon(beacon)}
            onEditBeacon={(beacon) => setEditingBeacon(beacon)}
            onLaunchDestination={(beacon) => setDestinationBeacon(beacon)}
            onAddSector={() => setShowAddSector(true)}
            onAddBeacon={() => setShowAddBeacon(true)}
          />

          {visibleLimit < visibleBeacons.length && (
            <div className="w-full text-center py-6 text-gray-500 text-sm italic">
              Scanning space for more signals...
            </div>
          )}

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
                className="fixed bottom-6 right-6 z-[9999] bg-violet-600 hover:bg-violet-500 text-white rounded-full shadow-[0_0_20px_rgba(139,92,246,0.6)] transition-transform hover:scale-110 flex items-center justify-center group"
              >
                <ChatBubbleOvalLeftEllipsisIcon width={32} height={32} />

                <AnimatePresence>
                  {hasUnreadInCurrentSector && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-[rgba(20,20,30,1)] shadow-lg"
                    >
                      {hasMentionInCurrentSector ? "@" : "!"}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            )}
        </main>
      </div>

      <StationModals
        user={user}
        station={station}
        stats={stats}
        refetchNotifications={refetchNotifications}
        showFriendsModal={showFriendsModal}
        setShowFriendsModal={setShowFriendsModal}
        activeFriendChatId={activeFriendChatId}
        setActiveFriendChatId={setActiveFriendChatId}
        targetFriendChatId={targetFriendChatId}
        setTargetFriendChatId={setTargetFriendChatId}
        showAddSector={showAddSector}
        setShowAddSector={setShowAddSector}
        handleSectorCreated={handleSectorCreated}
        showAddBeacon={showAddBeacon}
        setShowAddBeacon={setShowAddBeacon}
        handleBeaconCreated={handleBeaconCreated}
        editingSector={editingSector}
        setEditingSector={setEditingSector}
        handleSectorUpdated={handleSectorUpdated}
        handleSectorDelete={handleSectorDelete}
        viewingMembersSector={viewingMembersSector}
        setViewingMembersSector={setViewingMembersSector}
        editingBeacon={editingBeacon}
        setEditingBeacon={setEditingBeacon}
        handleBeaconUpdated={handleBeaconUpdated}
        handleBeaconDeleted={handleBeaconDeleted}
        selectedBeacon={selectedBeacon}
        setSelectedBeacon={setSelectedBeacon}
        destinationBeacon={destinationBeacon}
        setDestinationBeacon={setDestinationBeacon}
        showTagModal={showTagModal}
        setShowTagModal={setShowTagModal}
        sectorTagsOverride={sectorTagsOverride}
        setSectorTagsOverride={setSectorTagsOverride}
        setSelectedTags={setSelectedTags}
        showAccessDenied={showAccessDenied}
        setShowAccessDenied={setShowAccessDenied}
        showGroupChat={showGroupChat}
        setShowGroupChat={setShowGroupChat}
        allSectors={allSectors}
        allOwnedSectors={allOwnedSectors}
        allCollabSectors={allCollabSectors}
        displaySectorId={displaySectorId}
        isCurrentSectorAdminOrOwner={isCurrentSectorAdminOrOwner}
      />
    </div>
  );
}

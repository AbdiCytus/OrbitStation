"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MagnifyingGlassIcon, XMarkIcon, Cog8ToothIcon, ArrowRightOnRectangleIcon, UserIcon, UsersIcon, Bars3Icon, ChartBarIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { searchPilots } from "@/lib/actions";

type Props = {
  user?: {
    id: string;
    name: string | null;
    image: string | null;
    callsign?: string | null;
    username?: string | null;
    shortcuts?: string | null;
    station?: { isPublic: boolean } | null;
  } | null;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSearchSubmit?: () => void;
  searchPlaceholder?: string;
  displayName?: string;
  hideSearch?: boolean;
  hideProfile?: boolean;
  onOpenFriends?: () => void;
  stats?: { hasNotifications: boolean };
  isPublicProfile?: boolean;
};

export default function StationNavbar({ user, searchQuery, onSearchChange, onSearchSubmit, searchPlaceholder, displayName, hideSearch, hideProfile, onOpenFriends, stats, isPublicProfile }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const [suggestedPilots, setSuggestedPilots] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedSuggestIndex, setFocusedSuggestIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutsideSearch(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    if (showSuggestions) document.addEventListener("mousedown", handleClickOutsideSearch);
    return () => document.removeEventListener("mousedown", handleClickOutsideSearch);
  }, [showSuggestions]);

  useEffect(() => {
    if (isPublicProfile && searchQuery && searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        searchPilots(searchQuery).then(res => {
          setSuggestedPilots(res.slice(0, 5));
          setShowSuggestions(true);
        });
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestedPilots([]);
      setShowSuggestions(false);
      setFocusedSuggestIndex(-1);
    }
  }, [searchQuery, isPublicProfile]);

  const handleSuggestKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestedPilots.length === 0) {
      if (e.key === "Enter") {
        setShowSuggestions(false);
        onSearchSubmit?.();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedSuggestIndex(prev => (prev < suggestedPilots.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedSuggestIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedSuggestIndex >= 0 && focusedSuggestIndex < suggestedPilots.length) {
        setShowSuggestions(false);
        setFocusedSuggestIndex(-1);
        router.push(`/station/${suggestedPilots[focusedSuggestIndex].username}`);
      } else {
        setShowSuggestions(false);
        onSearchSubmit?.();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setFocusedSuggestIndex(-1);
    }
  };

  const defaultShortcuts = { publicStation: "F1", friends: "F2", analytics: "F3", settings: "F4" };
  const parsedShortcuts = user?.shortcuts ? { ...defaultShortcuts, ...JSON.parse(user.shortcuts) } : defaultShortcuts;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;

      if (e.key === parsedShortcuts.publicStation && user?.station?.isPublic && user?.username) {
        e.preventDefault();
        router.push(`/station/${user.username}`);
      } else if (e.key === parsedShortcuts.friends) {
        e.preventDefault();
        onOpenFriends?.();
      } else if (e.key === parsedShortcuts.analytics && user?.station?.isPublic) {
        e.preventDefault();
        router.push("/analytics");
      } else if (e.key === parsedShortcuts.settings) {
        e.preventDefault();
        router.push("/settings");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [parsedShortcuts, user, router, onOpenFriends]);

  return (
    <header className="station-navbar glass-nav">
      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
        {/* Logo */}
        <Link href={user ? "/station" : "/"} className="navbar-logo" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <img src="/logo.png" alt="Orbit Station" fetchPriority="high" style={{ height: "40px", width: "auto", objectFit: "contain", filter: "drop-shadow(0 0 10px rgba(139, 92, 246, 0.6))" }} />
          <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#f8fafc", letterSpacing: "0.5px", textShadow: "0 0 10px rgba(139, 92, 246, 0.6), 0 0 20px rgba(139, 92, 246, 0.4)" }} className="hidden sm:inline">Orbit Station</span>
        </Link>
        {user && pathname !== "/station" && pathname !== "/settings" && pathname !== "/analytics" && !isPublicProfile && (
          <Link href="/station" className="btn btn-outline btn-sm" style={{ marginLeft: "0.25rem", padding: "0.2rem 0.5rem", height: "auto", display: "flex", gap: "0.25rem", alignItems: "center", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "6px" }}>
            <span className="hidden sm:inline">My Station</span>
            <span className="sm:hidden">Home</span>
          </Link>
        )}
        {/* Search when isPublicProfile is true (Left position) */}
        {!hideSearch && isPublicProfile && (
          <div className="navbar-search" style={{ marginLeft: "1rem", position: "relative", flex: 1, maxWidth: "250px" }} ref={searchContainerRef}>
            <span className="navbar-search-icon" aria-hidden="true">
              <MagnifyingGlassIcon width={16} height={16} />
            </span>
            <input
              type="text"
              className="navbar-search-input mobile-resize-input"
              placeholder={searchPlaceholder || "Search beacons..."}
              value={searchQuery ?? ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onFocus={() => { if (suggestedPilots.length > 0) setShowSuggestions(true); }}
              onKeyDown={handleSuggestKeyDown}
            />
            {searchQuery && (
              <button
                className="navbar-search-clear"
                onClick={() => { onSearchChange?.(""); setShowSuggestions(false); }}
                aria-label="Clear search"
                type="button"
              >
                <XMarkIcon width={14} height={14} />
              </button>
            )}
            {showSuggestions && suggestedPilots.length > 0 && (
              <div className="pilot-suggest-dropdown">
                {suggestedPilots.map((pilot, idx) => (
                  <Link
                    key={pilot.id}
                    href={`/station/${pilot.username}`}
                    className={`pilot-suggest-item ${focusedSuggestIndex === idx ? "bg-white/10" : ""}`}
                    style={focusedSuggestIndex === idx ? { background: "rgba(255,255,255,0.1)" } : {}}
                    onClick={() => setShowSuggestions(false)}
                    onMouseEnter={() => setFocusedSuggestIndex(idx)}
                  >
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#374151", overflow: "hidden" }}>
                      {pilot.image ? <img src={pilot.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", width: "100%", height: "100%" }}>{(pilot.name || pilot.username)[0].toUpperCase()}</span>}
                    </div>
                    <span style={{ fontSize: "0.85rem" }}>{pilot.name || pilot.username}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flex: 1, justifyContent: "center", gap: "1rem", margin: "0 1rem" }}>
        {/* Search when isPublicProfile is false (Center position) */}
        {!hideSearch && !isPublicProfile && (
          <div className="navbar-search" style={{ flex: 1, maxWidth: "300px" }}>
            <span className="navbar-search-icon" aria-hidden="true">
              <MagnifyingGlassIcon width={16} height={16} />
            </span>
            <input
              type="text"
              className="navbar-search-input"
              placeholder={searchPlaceholder || "Search beacons..."}
              value={searchQuery ?? ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearchSubmit?.();
              }}
            />
            {searchQuery && (
              <button
                className="navbar-search-clear"
                onClick={() => onSearchChange?.("")}
                aria-label="Clear search"
                type="button"
              >
                <XMarkIcon width={14} height={14} />
              </button>
            )}
          </div>
        )}

      </div>

      <div className="navbar-user" style={{ display: "flex", alignItems: "center" }} ref={menuRef}>
        {!hideProfile ? (
          user ? (
            <>
              <div className="hidden md:flex items-center" style={{ gap: "0.5rem", marginRight: "2.5rem" }}>
                {user.station?.isPublic && user.username && (
                  <Link href={`/station/${user.username}`} className="navbar-icon-btn group relative" style={{ padding: "8px", borderRadius: "8px", color: "#a78bfa", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(139,92,246,0.2)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                    <GlobeAltIcon width={20} height={20} />
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#141423] border border-white/10 rounded-lg text-xs font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg" style={{ padding: "0.5rem 0.75rem" }}>
                      Public Station <span className="text-gray-400 ml-1">({parsedShortcuts.publicStation})</span>
                    </div>
                  </Link>
                )}
                <button onClick={onOpenFriends} className="navbar-icon-btn group relative" style={{ padding: "8px", borderRadius: "8px", color: "#a78bfa", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(139,92,246,0.2)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                  <UsersIcon width={20} height={20} />
                  {stats?.hasNotifications && (
                    <span style={{ position: "absolute", top: "2px", right: "2px", width: "8px", height: "8px", backgroundColor: "#ef4444", borderRadius: "50%", border: "2px solid #141423" }}></span>
                  )}
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#141423] border border-white/10 rounded-lg text-xs font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg" style={{ padding: "0.5rem 0.75rem" }}>
                    Friends <span className="text-gray-400 ml-1">({parsedShortcuts.friends})</span>
                  </div>
                </button>
                {user.station?.isPublic && (
                  <Link href="/analytics" className="navbar-icon-btn group relative" style={{ padding: "8px", borderRadius: "8px", color: "#a78bfa", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(139,92,246,0.2)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                    <ChartBarIcon width={20} height={20} />
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#141423] border border-white/10 rounded-lg text-xs font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg" style={{ padding: "0.5rem 0.75rem" }}>
                      Analytics <span className="text-gray-400 ml-1">({parsedShortcuts.analytics})</span>
                    </div>
                  </Link>
                )}
                <Link href="/settings" className="navbar-icon-btn group relative" style={{ padding: "8px", borderRadius: "8px", color: "#a78bfa", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(139,92,246,0.2)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                  <Cog8ToothIcon width={20} height={20} />
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#141423] border border-white/10 rounded-lg text-xs font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg" style={{ padding: "0.5rem 0.75rem" }}>
                    Settings <span className="text-gray-400 ml-1">({parsedShortcuts.settings})</span>
                  </div>
                </Link>
              </div>

              <div className="navbar-user-info" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginRight: "0.75rem", justifyContent: "center" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff", lineHeight: 1 }}>{user.name ?? "Pilot"}</span>
                {user.callsign && <span style={{ fontSize: "0.7rem", color: "#a78bfa", marginTop: "0.2rem" }}>{user.callsign}</span>}
              </div>
              <button
                id="btn-user-menu"
                className="navbar-avatar-btn"
                onClick={() => {
                  setMenuOpen((o) => !o);
                }}
                aria-expanded={menuOpen}
                aria-label="User menu"
                style={{ position: "relative", cursor: "pointer" }}
              >
                {stats?.hasNotifications && (
                  <span className="md:hidden" style={{ position: "absolute", top: 0, right: 0, width: "10px", height: "10px", backgroundColor: "#ef4444", borderRadius: "50%", border: "2px solid #141423", zIndex: 10 }}></span>
                )}
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name ?? "User"}
                    width={34}
                    height={34}
                    className="navbar-avatar"
                  />
                ) : (
                  <div className="navbar-avatar navbar-avatar-fallback">
                    {(user.name ?? "?").charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    className="navbar-menu"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    style={{ transformOrigin: "top right" }}
                  >
                    <div className="navbar-menu-user">
                      <span className="navbar-menu-name">{displayName ?? user.name ?? "Pilot"}</span>
                    </div>
                    <hr className="divider" />
                    {pathname !== "/station" && (
                      <Link
                        href="/station"
                        className="navbar-menu-item"
                        onClick={() => setMenuOpen(false)}
                      >
                        <UserIcon width={18} height={18} /> My Station
                      </Link>
                    )}
                    {user.username && user.station?.isPublic && (
                      <Link
                        href={`/station/${user.username}`}
                        className="navbar-menu-item md:hidden"
                        onClick={() => setMenuOpen(false)}
                      >
                        <GlobeAltIcon width={18} height={18} /> Public Station
                      </Link>
                    )}
                    {pathname !== '/settings' && pathname !== '/analytics' && (
                      <button
                        className="navbar-menu-item md:hidden"
                        onClick={() => {
                          setMenuOpen(false);
                          onOpenFriends?.();
                        }}
                      >
                        <UsersIcon width={18} height={18} />
                        <span style={{ flex: 1, textAlign: "left" }}>Friends</span>
                        {stats?.hasNotifications && (
                          <span style={{ width: "8px", height: "8px", backgroundColor: "#ef4444", borderRadius: "50%", display: "inline-block" }}></span>
                        )}
                      </button>
                    )}
                    {pathname !== '/analytics' && user.station?.isPublic && (
                      <Link
                        href="/analytics"
                        className="navbar-menu-item md:hidden"
                        onClick={() => setMenuOpen(false)}
                      >
                        <ChartBarIcon width={18} height={18} /> Analytics
                      </Link>
                    )}
                    <Link
                      href="/settings"
                      className="navbar-menu-item md:hidden"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Cog8ToothIcon width={18} height={18} /> Settings
                    </Link>
                    <button
                      id="btn-sign-out"
                      className="navbar-menu-item navbar-menu-item-danger"
                      onClick={() => signOut({ callbackUrl: "/login" })}
                    >
                      <ArrowRightOnRectangleIcon width={18} height={18} /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <Link href="/login" style={{
              padding: "0.4rem 1rem",
              background: "rgba(139, 92, 246, 0.2)",
              border: "1px solid #a78bfa",
              borderRadius: "8px",
              color: "#fff",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "0.85rem",
              transition: "all 0.2s"
            }}>
              Login
            </Link>
          )
        ) : (
          user && (
            <Link href="/station" style={{
              padding: "0.4rem 1rem",
              background: "rgba(139, 92, 246, 0.2)",
              border: "1px solid #a78bfa",
              borderRadius: "8px",
              color: "#fff",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "0.85rem",
              transition: "all 0.2s"
            }}>
              My Station
            </Link>
          )
        )}
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, XMarkIcon, Cog8ToothIcon, ArrowRightOnRectangleIcon, UserIcon, UsersIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  user?: { id: string; name: string | null; image: string | null; callsign?: string | null } | null;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  displayName?: string;
  hideSearch?: boolean;
  hideProfile?: boolean;
  onOpenFriends?: () => void;
  stats?: { hasNotifications: boolean };
};

export default function StationNavbar({ user, searchQuery, onSearchChange, displayName, hideSearch, hideProfile, onOpenFriends, stats }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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


  return (
    <header className="station-navbar glass-nav">
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {/* Logo */}
        <Link href="/station" className="navbar-logo">
          <span className="navbar-logo-icon">⊕</span>
          <span className="navbar-logo-text text-gradient">Orbit Station</span>
        </Link>
      </div>

      <div style={{ display: "flex", flex: 1, justifyContent: "center", gap: "1rem", margin: "0 1rem" }}>
        {/* Search */}
        {!hideSearch && (
          <div className="navbar-search" style={{ flex: 1, maxWidth: "300px" }}>
            <span className="navbar-search-icon" aria-hidden="true">
              <MagnifyingGlassIcon width={16} height={16} />
            </span>
            <input
              type="text"
              className="navbar-search-input"
              placeholder="Search beacons..."
              value={searchQuery ?? ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
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
              <div className="navbar-user-info" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginRight: "0.75rem", justifyContent: "center" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff", lineHeight: 1 }}>{user.name ?? "Pilot"}</span>
                {user.callsign && <span style={{ fontSize: "0.7rem", color: "#a78bfa", marginTop: "0.2rem" }}>{user.callsign}</span>}
              </div>
              <button
                id="btn-user-menu"
                className="navbar-avatar-btn"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-label="User menu"
                style={{ position: "relative" }}
              >
                {stats?.hasNotifications && (
                  <span style={{ position: "absolute", top: 0, right: 0, width: "10px", height: "10px", backgroundColor: "#ef4444", borderRadius: "50%", border: "2px solid #141423", zIndex: 10 }}></span>
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
                      <button
                        className="navbar-menu-item"
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
                      <Link
                        href="/settings"
                        className="navbar-menu-item"
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

"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { searchPilots } from "@/lib/actions";
import { MagnifyingGlassIcon, XMarkIcon, Cog8ToothIcon, ArrowRightOnRectangleIcon, UserIcon } from "@heroicons/react/24/outline";

type Props = {
  user?: { id: string; name: string | null; image: string | null; callsign?: string | null } | null;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  displayName?: string;
  hideSearch?: boolean;
};

export default function StationNavbar({ user, searchQuery, onSearchChange, displayName, hideSearch }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileSearch, setProfileSearch] = useState("");
  const [suggestions, setSuggestions] = useState<{ id: string; username: string | null; name: string | null; image: string | null }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (profileSearch.trim().length >= 2) {
        const results = await searchPilots(profileSearch);
        setSuggestions(results);
        setShowSuggestions(true);
        setFocusedSuggestionIndex(-1);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setFocusedSuggestionIndex(-1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [profileSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setFocusedSuggestionIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (profileSearch.trim()) {
      router.push(`/station/${profileSearch.trim()}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && focusedSuggestionIndex >= 0) {
      e.preventDefault();
      const s = suggestions[focusedSuggestionIndex];
      if (s.username) {
        setProfileSearch("");
        setShowSuggestions(false);
        setFocusedSuggestionIndex(-1);
        router.push(`/station/${s.username}`);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setFocusedSuggestionIndex(-1);
    }
  };

  return (
    <header className="station-navbar glass-nav">
      {/* Logo */}
      <Link href="/station" className="navbar-logo">
        <span className="navbar-logo-icon">⊕</span>
        <span className="navbar-logo-text text-gradient">Orbit Station</span>
      </Link>

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

        {/* Global Profile Search */}
        <div ref={suggestionRef} style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
          <form className="navbar-search" style={{ width: "100%" }} onSubmit={handleProfileSearch}>
            <span className="navbar-search-icon" aria-hidden="true">
              <UserIcon width={16} height={16} />
            </span>
            <input
              type="text"
              className="navbar-search-input"
              placeholder="Find pilot username"
              value={profileSearch}
              onChange={(e) => setProfileSearch(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              onKeyDown={handleKeyDown}
            />
          </form>

          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 0.5rem)",
              left: 0,
              right: 0,
              background: "rgba(15, 15, 25, 0.95)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              borderRadius: "12px",
              padding: "0.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              zIndex: 50
            }}>
              {suggestions.map((s, idx) => (
                <div 
                  key={s.id}
                  onClick={() => {
                    setProfileSearch("");
                    setShowSuggestions(false);
                    setFocusedSuggestionIndex(-1);
                    if (s.username) router.push(`/station/${s.username}`);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.5rem",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "background 0.2s",
                    background: focusedSuggestionIndex === idx ? "rgba(139, 92, 246, 0.2)" : "transparent"
                  }}
                  onMouseOver={() => setFocusedSuggestionIndex(idx)}
                  onMouseOut={() => setFocusedSuggestionIndex(-1)}
                >
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#1a1a2e", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {s.image ? (
                      <img src={s.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#fff" }}>{(s.name || s.username || "?")[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{s.name || "Pilot"}</span>
                    <span style={{ fontSize: "0.7rem", color: "#a78bfa" }}>@{s.username}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="navbar-user" style={{ display: "flex", alignItems: "center" }}>
        {user ? (
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
            >
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

            {menuOpen && (
              <>
                <div className="navbar-menu-backdrop" onClick={() => setMenuOpen(false)} />
                <div className="navbar-menu">
                  <div className="navbar-menu-user">
                    <span className="navbar-menu-name">{displayName ?? user.name ?? "Pilot"}</span>
                  </div>
                  <hr className="divider" />
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
                </div>
              </>
            )}
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
        )}
      </div>
    </header>
  );
}

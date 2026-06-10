"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { MagnifyingGlassIcon, XMarkIcon, Cog8ToothIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

type Props = {
  user: { id: string; name: string | null; image: string | null; callsign?: string | null };
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  displayName?: string;
  hideSearch?: boolean;
};

export default function StationNavbar({ user, searchQuery, onSearchChange, displayName, hideSearch }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="station-navbar glass-nav">
      {/* Logo */}
      <Link href="/station" className="navbar-logo">
        <span className="navbar-logo-icon">⊕</span>
        <span className="navbar-logo-text text-gradient">Orbit Station</span>
      </Link>

      {/* Search */}
      {!hideSearch && (
        <div className="navbar-search">
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
            >
              <XMarkIcon width={14} height={14} />
            </button>
          )}
        </div>
      )}

      {/* User Menu */}
      <div className="navbar-user">
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
      </div>
    </header>
  );
}

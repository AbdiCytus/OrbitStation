"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";

type Props = {
  user: { id: string; name: string | null; image: string | null };
  searchQuery: string;
  onSearchChange: (q: string) => void;
};

export default function StationNavbar({ user, searchQuery, onSearchChange }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="station-navbar glass-nav">
      {/* Logo */}
      <Link href="/station" className="navbar-logo">
        <span className="navbar-logo-icon">⊕</span>
        <span className="navbar-logo-text text-gradient">Orbit Station</span>
      </Link>

      {/* Search */}
      <div className="navbar-search">
        <span className="navbar-search-icon" aria-hidden="true">🔭</span>
        <input
          id="station-search"
          className="navbar-search-input"
          type="search"
          placeholder="Search beacons…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search beacons"
        />
        {searchQuery && (
          <button
            className="navbar-search-clear"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

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
            <div className="navbar-menu glass">
              <div className="navbar-menu-user">
                <span className="navbar-menu-name">{user.name ?? "Pilot"}</span>
              </div>
              <hr className="divider" />
              <Link
                href="/settings"
                className="navbar-menu-item"
                onClick={() => setMenuOpen(false)}
              >
                ⚙️ Settings
              </Link>
              <button
                id="btn-sign-out"
                className="navbar-menu-item navbar-menu-item-danger"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                🚀 Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

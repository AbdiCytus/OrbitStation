"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import type { Beacon, SectorWithBeacons } from "@/types";
import { deleteBeacon, toggleBeaconPin, updateBeacon, incrementBeaconVisit } from "@/lib/actions";

type Props = {
  beacon: Beacon;
  sector: SectorWithBeacons | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
};

export default function BeaconDetailModal({ beacon, sector, onClose, onDeleted }: Props) {
  const [isPinned, setIsPinned] = useState(beacon.isPinned);
  const [notes, setNotes] = useState(beacon.notes ?? "");
  const [editingNotes, setEditingNotes] = useState(false);
  const [, startTransition] = useTransition();
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // Close on Escape + lock body scroll
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
      cancelAnimationFrame(rafRef.current);
    };
  }, [onClose]);

  // ── 3D tilt effect (ala HSR card) ──────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;   // 0-1
      const y = (e.clientY - rect.top)  / rect.height;  // 0-1
      const rotY =  (x - 0.5) * 28;   // -14 to +14 deg
      const rotX = -(y - 0.5) * 20;   // -10 to +10 deg
      const shine = `radial-gradient(circle at ${x * 100}% ${y * 100}%,
        rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 50%, transparent 80%)`;
      el.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.04)`;
      (el.querySelector(".card-shine") as HTMLElement | null)!.style.background = shine;
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
    (el.querySelector(".card-shine") as HTMLElement | null)!.style.background = "none";
  }, []);

  // ── Actions ──────────────────────────────────────────────
  function handleVisit() {
    incrementBeaconVisit(beacon.id);
    window.open(beacon.url, "_blank", "noopener,noreferrer");
  }
  function handleTogglePin() {
    setIsPinned((p) => !p);
    startTransition(() => toggleBeaconPin(beacon.id));
  }
  function handleDelete() {
    startTransition(async () => {
      const result = await deleteBeacon(beacon.id);
      if (!result.error) onDeleted(beacon.id);
    });
  }
  function handleSaveNotes() {
    startTransition(() => updateBeacon(beacon.id, { notes }));
    setEditingNotes(false);
  }

  const domain = (() => {
    try { return new URL(beacon.url).hostname.replace("www.", ""); }
    catch { return beacon.url; }
  })();

  const addedDate = new Date(beacon.createdAt).toLocaleDateString("en", {
    month: "short", day: "numeric", year: "numeric",
  });

  // "rarity" stars based on visit count (cosmetic)
  const starCount = Math.min(5, Math.max(1, Math.ceil(beacon.visitCount / 5) || 1));

  return (
    <div className="hsr-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={beacon.title}>
      <div className="hsr-panel" onClick={(e) => e.stopPropagation()}>

        {/* ── STARFIELD BG ────────────────────────────────── */}
        <div className="hsr-bg" aria-hidden="true">
          <div className="hsr-bg-glow hsr-bg-glow-1" />
          <div className="hsr-bg-glow hsr-bg-glow-2" />
          {Array.from({ length: 40 }).map((_, i) => (
            <span
              key={i}
              className="hsr-star-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top:  `${Math.random() * 100}%`,
                width:  `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${Math.random() * 3 + 2}s`,
              }}
            />
          ))}
        </div>

        {/* ── TOP ACTION BAR ──────────────────────────────── */}
        <div className="hsr-topbar">
          <div className="hsr-topbar-left">
            <span className="hsr-topbar-icon">⊕</span>
            <span className="hsr-topbar-label">Beacon Details</span>
          </div>
          <div className="hsr-topbar-actions">
            <button
              className={`hsr-action-btn ${isPinned ? "hsr-action-btn--active" : ""}`}
              onClick={handleTogglePin}
              title={isPinned ? "Unpin" : "Pin beacon"}
              id={`btn-pin-${beacon.id}`}
            >
              <span>📍</span>
              <span className="hsr-action-label">{isPinned ? "Pinned" : "Pin"}</span>
            </button>
            <button
              className="hsr-action-btn hsr-action-btn--danger"
              onClick={handleDelete}
              title="Delete beacon"
              id={`btn-delete-${beacon.id}`}
            >
              <span>🗑</span>
              <span className="hsr-action-label">Delete</span>
            </button>
            <button className="hsr-close-btn" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        {/* ── CONTENT: LEFT (card) + RIGHT (info) ─────────── */}
        <div className="hsr-content">

          {/* LEFT — Hero image card with 3D tilt */}
          <div className="hsr-left">
            <div
              ref={cardRef}
              className="hsr-card"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ transition: "transform 0.08s linear" }}
            >
              {/* Card image */}
              <div className="hsr-card-art">
                {beacon.imageUrl ? (
                  <img
                    src={beacon.imageUrl}
                    alt={beacon.title}
                    className="hsr-card-img"
                    draggable={false}
                  />
                ) : (
                  <div className="hsr-card-placeholder">
                    {beacon.faviconUrl ? (
                      <img src={beacon.faviconUrl} alt="" width={64} height={64} className="hsr-card-favicon-lg" />
                    ) : (
                      <span className="hsr-card-initial">{domain.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                )}
                {/* Shine overlay */}
                <div className="card-shine" />
                {/* Bottom gradient */}
                <div className="hsr-card-bottom-gradient" />
              </div>

              {/* Card frame border */}
              <div className="hsr-card-frame" style={{ borderColor: sector?.color ?? "rgba(124,92,252,0.6)" }} />

              {/* Stars row at bottom of card */}
              <div className="hsr-card-stars">
                {Array.from({ length: starCount }).map((_, i) => (
                  <span key={i} className="hsr-star">★</span>
                ))}
              </div>
            </div>

            {/* Domain pill below card */}
            <div className="hsr-domain-pill">
              {beacon.faviconUrl && (
                <img src={beacon.faviconUrl} alt="" width={14} height={14} className="hsr-domain-favicon" />
              )}
              <span>{domain}</span>
            </div>
          </div>

          {/* RIGHT — Info panel */}
          <div className="hsr-right">
            {/* Breadcrumb */}
            <div className="hsr-breadcrumb">
              {sector && (
                <span
                  className="hsr-sector-tag"
                  style={{ borderColor: sector.color ?? undefined, color: sector.color ?? undefined }}
                >
                  {sector.icon ?? "📁"} {sector.name}
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="hsr-title">{beacon.title}</h2>

            {/* Stars line */}
            <div className="hsr-stars-line">
              {Array.from({ length: starCount }).map((_, i) => (
                <span key={i} className="hsr-star-lg">★</span>
              ))}
              <span className="hsr-stars-hint">
                {beacon.visitCount === 0 ? "Never visited" : `${beacon.visitCount} visit${beacon.visitCount > 1 ? "s" : ""}`}
              </span>
            </div>

            {/* Description */}
            {beacon.description && (
              <p className="hsr-desc">{beacon.description}</p>
            )}

            <div className="hsr-divider" />

            {/* Stats — ala Light Cone stat rows */}
            <div className="hsr-stats">
              <div className="hsr-stat-row">
                <span className="hsr-stat-icon">🔭</span>
                <span className="hsr-stat-key">Total Visits</span>
                <span className="hsr-stat-val">{beacon.visitCount}</span>
              </div>
              <div className="hsr-stat-row">
                <span className="hsr-stat-icon">📅</span>
                <span className="hsr-stat-key">Logged</span>
                <span className="hsr-stat-val">{addedDate}</span>
              </div>
              <div className="hsr-stat-row">
                <span className="hsr-stat-icon">📍</span>
                <span className="hsr-stat-key">Pinned</span>
                <span className="hsr-stat-val">{isPinned ? "Yes" : "No"}</span>
              </div>
              <div className="hsr-stat-row">
                <span className="hsr-stat-icon">🔗</span>
                <span className="hsr-stat-key">URL</span>
                <span className="hsr-stat-val hsr-stat-url" title={beacon.url}>{domain}</span>
              </div>
            </div>

            <div className="hsr-divider" />

            {/* Notes section — ala "Light Cone Ability" */}
            <div className="hsr-ability">
              <div className="hsr-ability-header">
                <span className="hsr-ability-icon">✦</span>
                <span className="hsr-ability-title">Pilot Notes</span>
                {!editingNotes && (
                  <button className="hsr-edit-btn" onClick={() => setEditingNotes(true)}>
                    {notes ? "Edit" : "Add"}
                  </button>
                )}
              </div>
              {editingNotes ? (
                <div className="hsr-notes-edit">
                  <textarea
                    className="hsr-notes-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Why did you save this? Any observations…"
                    rows={3}
                    autoFocus
                    maxLength={500}
                  />
                  <div className="hsr-notes-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingNotes(false)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={handleSaveNotes}>Save</button>
                  </div>
                </div>
              ) : (
                <p className="hsr-ability-text">
                  {notes || <span className="hsr-ability-empty">No notes yet. Click Add to write your observations.</span>}
                </p>
              )}
            </div>

            {/* CTA */}
            <button
              id={`btn-visit-hsr-${beacon.id}`}
              className="hsr-visit-btn"
              onClick={handleVisit}
            >
              <span>Launch Beacon</span>
              <span className="hsr-visit-arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

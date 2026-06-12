"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import type { Beacon, SectorWithBeacons } from "@/types";
import { deleteBeacon, toggleBeaconPin, updateBeacon, incrementBeaconVisit } from "@/lib/actions";
import { DynamicIcon } from "./dynamic-icon";
import {
  EyeIcon,
  CalendarIcon,
  MapPinIcon,
  LinkIcon,
  TrashIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  XMarkIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";
import { MapPinIcon as MapPinSolid } from "@heroicons/react/24/solid";

type Props = {
  beacon: Beacon & { _creator?: { name: string | null; image: string | null } | null };
  sector: SectorWithBeacons | null;
  onClose: () => void;
  onDeleted?: (id: string) => void;
  onUpdated?: (beacon: Beacon) => void;
  readOnly?: boolean;
};

export default function BeaconDetailModal({ beacon, sector, onClose, onDeleted, onUpdated, readOnly = false }: Props) {
  const [isPinned, setIsPinned] = useState(beacon.isPinned);
  const [notes, setNotes] = useState(beacon.notes ?? "");
  const [editingNotes, setEditingNotes] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => { setIsClosing(true); setTimeout(onClose, 200); };
  const [, startTransition] = useTransition();
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // Close on Escape + lock body scroll
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
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
    const newVal = !isPinned;
    setIsPinned(newVal);
    onUpdated({ ...beacon, isPinned: newVal });
    startTransition(async () => { await toggleBeaconPin(beacon.id); });
  }
  function handleDelete() {
    setConfirmDelete(true);
  }
  function confirmDeleteAction() {
    startTransition(async () => {
      const result = await deleteBeacon(beacon.id);
      if (!result.error) {
        onDeleted(beacon.id);
        handleClose();
      }
    });
  }
  function handleSaveNotes() {
    startTransition(async () => { await updateBeacon(beacon.id, { notes }); });
    setEditingNotes(false);
  }

  const domain = (() => {
    try { return new URL(beacon.url).hostname.replace("www.", ""); }
    catch { return beacon.url; }
  })();

  const subroute = (() => {
    try { 
      const url = new URL(beacon.url);
      return url.pathname && url.pathname !== "/" ? url.pathname : null;
    } catch { return null; }
  })();

  const addedDate = new Date(beacon.createdAt).toLocaleDateString("en", {
    month: "short", day: "numeric", year: "numeric",
  });

  // "rarity" stars based on visit count (cosmetic)
  const starCount = Math.min(5, Math.max(1, Math.ceil(beacon.visitCount / 5) || 1));

  return (
    <div className={"hsr-overlay" + (isClosing ? " closing" : "")} onClick={handleClose} role="dialog" aria-modal="true" aria-label={beacon.title}>
      <div className={"hsr-panel" + (isClosing ? " closing" : "")} onClick={(e) => e.stopPropagation()}>

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
            <span className="hsr-topbar-icon"><InformationCircleIcon width={18} height={18} /></span>
            <span className="hsr-topbar-label">Beacon Details</span>
          </div>
          <div className="hsr-topbar-actions">
            {!readOnly && (
              confirmDelete ? (
                <>
                  <span className="hsr-action-label" style={{ color: "#ef4444", fontWeight: 600 }}>Sure?</span>
                  <button className="hsr-action-btn" onClick={() => setConfirmDelete(false)}>
                    <span className="hsr-action-label">Cancel</span>
                  </button>
                  <button className="hsr-action-btn hsr-action-btn--danger" onClick={handleDelete} disabled={isPending}>
                    <span className="hsr-action-label">Delete!</span>
                  </button>
                </>
              ) : (
                <>
                  {subroute && (
                    <div style={{ 
                      background: "rgba(255, 255, 255, 0.1)", 
                      padding: "0.2rem 0.5rem", 
                      borderRadius: "6px", 
                      fontSize: "0.75rem", 
                      color: "#c4b5fd",
                      marginRight: "0.5rem",
                      display: "flex",
                      alignItems: "center"
                    }}>
                      {subroute}
                    </div>
                  )}
                  {(!sector || sector.isPublic) && (
                    <button
                      className={`hsr-action-btn ${isPinned ? "hsr-action-btn--active" : ""}`}
                      onClick={handleTogglePin}
                      title={isPinned ? "Unpin" : "Pin beacon"}
                      id={`btn-pin-${beacon.id}`}
                    >
                      <span>{isPinned ? <MapPinSolid width={16} height={16} /> : <MapPinIcon width={16} height={16} />}</span>
                      <span className="hsr-action-label">{isPinned ? "Pinned" : "Pin"}</span>
                    </button>
                  )}
                  <button
                    className="hsr-action-btn hsr-action-btn--danger"
                    onClick={() => setConfirmDelete(true)}
                    title="Delete beacon"
                    id={`btn-delete-${beacon.id}`}
                  >
                    <span><TrashIcon width={16} height={16} /></span>
                    <span className="hsr-action-label">Delete</span>
                  </button>
                </>
              )
            )}
            <button className="hsr-close-btn" onClick={handleClose} aria-label="Close">
              <XMarkIcon width={20} height={20} />
            </button>
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
              {/* Back glass plate */}
              {beacon.imageUrl && <div className="hsr-card-back-glass" />}

              {/* Card image */}
              <div className="hsr-card-art">
                {beacon.imageUrl ? (
                  <>
                    <img
                      src={beacon.imageUrl}
                      alt={beacon.title}
                      className="hsr-card-img"
                      draggable={false}
                    />
                    <div className="hsr-prism" />
                  </>
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

              {/* Front glass frame or standard frame */}
              {beacon.imageUrl ? (
                <div className="hsr-card-front-glass" style={{ borderColor: sector?.color ?? "rgba(124,92,252,0.6)" }} />
              ) : (
                <div className="hsr-card-frame" style={{ borderColor: sector?.color ?? "rgba(124,92,252,0.6)" }} />
              )}

              {/* Stars row at bottom of card */}
              <div className="hsr-card-stars">
                {Array.from({ length: starCount }).map((_, i) => (
                  <span key={i} className="hsr-star">★</span>
                ))}
              </div>
            </div>

            {/* Domain pill below card */}
            <div className="hsr-domain-pill" style={{ marginTop: "1.5rem" }}>
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
                  style={{ borderColor: sector.color ?? undefined, color: sector.color ?? undefined, display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
                >
                  <DynamicIcon name={sector.icon} width={14} height={14} /> {sector.name}
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="hsr-title">{beacon.title}</h2>

            {/* Description */}
            {beacon.description && (
              <p className="hsr-desc">{beacon.description}</p>
            )}

            <div className="hsr-divider" />

            {/* Stats — ala Light Cone stat rows */}
            <div className="hsr-stats" style={{ gap: "0.25rem" }}>
              <div className="hsr-stat-row">
                <span className="hsr-stat-icon"><EyeIcon width={16} height={16} /></span>
                <span className="hsr-stat-key">Total Visits</span>
                <span className="hsr-stat-val">{beacon.visits ?? 0}</span>
              </div>
              <div className="hsr-stat-row">
                <span className="hsr-stat-icon"><CalendarIcon width={16} height={16} /></span>
                <span className="hsr-stat-key">Logged</span>
                <span className="hsr-stat-val">{addedDate}</span>
              </div>
              {beacon._creator && (
                <div className="hsr-stat-row">
                  <span className="hsr-stat-icon" style={{ borderRadius: "50%", overflow: "hidden", width: 16, height: 16, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyItems: "center" }}>
                    {beacon._creator.image ? <img src={beacon._creator.image} alt="" style={{ width: 16, height: 16, objectFit: "cover" }} /> : <span style={{ fontSize: "10px", width: "100%", textAlign: "center" }}>{(beacon._creator.name || "?")[0].toUpperCase()}</span>}
                  </span>
                  <span className="hsr-stat-key">Added by</span>
                  <span className="hsr-stat-val">{beacon._creator.name}</span>
                </div>
              )}
            </div>

            <div className="hsr-divider" />

            {/* Notes section — ala "Light Cone Ability" */}
            <div className="hsr-ability">
              <div className="hsr-ability-header" style={{ marginBottom: "0.25rem" }}>
                <span className="hsr-ability-icon"><DocumentTextIcon width={16} height={16} /></span>
                <span className="hsr-ability-title">Pilot Notes</span>
              </div>
              <div className="hsr-notes-display">
                {notes ? notes : <span className="hsr-notes-empty">No notes recorded...</span>}
              </div>
            </div>

            {/* CTA */}
            <button
              id={`btn-visit-hsr-${beacon.id}`}
              className="hsr-visit-btn"
              onClick={handleVisit}
              style={{ padding: "0.6rem 1rem", fontSize: "0.9rem" }}
            >
              <span>Launch Beacon</span>
              <span className="hsr-visit-arrow"><ArrowRightIcon width={16} height={16} /></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import type { Beacon, SectorWithBeacons } from "@/types";
import { deleteBeacon, toggleBeaconPin, updateBeacon } from "@/lib/actions";
import { incrementBeaconVisit } from "@/lib/actions";

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
  const panelRef = useRef<HTMLDivElement>(null);

  // Trap focus & close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // 3D tilt effect on image
  const handleTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -20;
    e.currentTarget.style.transform = `perspective(600px) rotateX(${y}deg) rotateY(${x}deg) scale(1.03)`;
  };
  const resetTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)";
  };

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

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Beacon detail: ${beacon.title}`}
    >
      <div
        ref={panelRef}
        className="modal-panel modal-panel-detail glass"
        onClick={(e) => e.stopPropagation()}
      >
        {/* OG Image with 3D tilt */}
        <div
          className="detail-image-wrapper"
          onMouseMove={handleTilt}
          onMouseLeave={resetTilt}
          style={{ transition: "transform 0.1s ease" }}
        >
          {beacon.imageUrl ? (
            <img
              src={beacon.imageUrl}
              alt={beacon.title}
              className="detail-image"
            />
          ) : (
            <div className="detail-image-placeholder">
              {beacon.faviconUrl ? (
                <img src={beacon.faviconUrl} alt="" width={48} height={48} />
              ) : (
                <span style={{ fontSize: "3rem" }}>🔗</span>
              )}
            </div>
          )}
          <div className="detail-image-overlay" />
        </div>

        {/* Header actions */}
        <div className="detail-actions-top">
          <button
            className={`btn-icon ${isPinned ? "btn-icon-active" : ""}`}
            onClick={handleTogglePin}
            title={isPinned ? "Unpin" : "Pin to profile"}
            aria-label={isPinned ? "Unpin beacon" : "Pin beacon"}
          >
            📍
          </button>
          <button
            className="btn-icon btn-icon-danger"
            onClick={handleDelete}
            title="Delete beacon"
            aria-label="Delete beacon"
            id={`btn-delete-beacon-${beacon.id}`}
          >
            🗑️
          </button>
          <button className="btn-icon modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Content */}
        <div className="detail-content">
          {/* Meta */}
          <div className="detail-meta">
            {beacon.faviconUrl && (
              <img src={beacon.faviconUrl} alt="" width={18} height={18} className="detail-favicon" />
            )}
            <span className="detail-domain">{domain}</span>
            {sector && (
              <span className="badge badge-violet">
                {sector.icon ?? "📁"} {sector.name}
              </span>
            )}
          </div>

          <h2 className="detail-title">{beacon.title}</h2>

          {beacon.description && (
            <p className="detail-description">{beacon.description}</p>
          )}

          {/* Stats */}
          <div className="detail-stats">
            <div className="detail-stat">
              <span className="detail-stat-value">{beacon.visitCount}</span>
              <span className="detail-stat-label">Visits</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-value">
                {new Date(beacon.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
              </span>
              <span className="detail-stat-label">Added</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-value">{isPinned ? "Yes" : "No"}</span>
              <span className="detail-stat-label">Pinned</span>
            </div>
          </div>

          {/* Notes */}
          <div className="detail-notes">
            <div className="detail-notes-header">
              <span className="detail-notes-label">📝 Notes</span>
              {!editingNotes && (
                <button
                  className="btn-text"
                  onClick={() => setEditingNotes(true)}
                >
                  {notes ? "Edit" : "Add notes"}
                </button>
              )}
            </div>
            {editingNotes ? (
              <div className="detail-notes-edit">
                <textarea
                  className="input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Write a note about this bookmark…"
                  autoFocus
                  maxLength={500}
                />
                <div className="detail-notes-edit-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingNotes(false)}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveNotes}>Save</button>
                </div>
              </div>
            ) : (
              <p className="detail-notes-text">
                {notes || <span className="muted">No notes yet.</span>}
              </p>
            )}
          </div>

          {/* CTA */}
          <button
            id={`btn-visit-detail-${beacon.id}`}
            className="btn btn-primary btn-lg detail-visit-btn"
            onClick={handleVisit}
          >
            Visit Site →
          </button>
        </div>
      </div>
    </div>
  );
}

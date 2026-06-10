"use client";

import { useState, useEffect } from "react";
import { updateSector } from "@/lib/actions";
import type { SectorWithBeacons } from "@/types";

import { DynamicIcon, ICON_OPTIONS } from "@/components/dynamic-icon";

const COLORS = [
  "#ef4444", "#fb923c", "#facc15", "#4ade80",
  "#34d399", "#22d3ee", "#818cf8", "#7c5cfc",
  "#e879f9", "#f472b6"
];

type Props = {
  sector: SectorWithBeacons;
  onClose: () => void;
  onUpdated: (sector: SectorWithBeacons) => void;
  onDeleted: (sectorId: string) => void;
};

export default function EditSectorModal({ sector, onClose, onUpdated, onDeleted }: Props) {
  const [name, setName] = useState(sector.name);
  const [icon, setIcon] = useState(sector.icon ?? "FolderIcon");
  const [color, setColor] = useState(sector.color ?? "#7c5cfc");
  const [isPublic, setIsPublic] = useState((sector as SectorWithBeacons & { isPublic?: boolean }).isPublic !== false);
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => { setIsClosing(true); setTimeout(onClose, 200); };
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", fn);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", fn);
    };
  }, [onClose]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    const result = await updateSector(sector.id, { name, icon, color, isPublic });
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      onUpdated({ ...sector, name, icon, color, isPublic } as SectorWithBeacons & { isPublic: boolean });
    }
  }

  return (
    <div className={`modal-overlay ${isClosing ? "closing" : ""}`} onClick={handleClose} role="dialog" aria-modal="true" aria-label="Edit Sector">
      <div className={`modal-panel ${isClosing ? "closing" : ""} glass`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Sector</h2>
          <button className="btn-icon modal-close" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSave} className="modal-form">
          {/* Sector name */}
          <div className="form-group">
            <label className="form-label" htmlFor="edit-sector-name">Name</label>
            <input
              id="edit-sector-name"
              className="input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              required
              autoFocus
            />
          </div>

          {/* Icon picker */}
          <div className="form-group">
            <label className="form-label">Icon</label>
            <div className="icon-picker" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(36px, 1fr))", gap: "0.375rem" }}>
              {ICON_OPTIONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  className={"icon-option" + (icon === ic ? " selected" : "")}
                  onClick={() => setIcon(ic)}
                  title={ic}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", cursor: "pointer", transition: "all 0.15s" }}
                >
                  <DynamicIcon name={ic} style={{ color: icon === ic ? "var(--color-violet-glow)" : "var(--color-starlight)" }} />
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className="form-group">
            <label className="form-label">Accent Color</label>
            <div className="color-picker">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={"color-option" + (color === c ? " selected" : "")}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Visibility toggle */}
          <div className="form-group">
            <label className="form-label">Visibility</label>
            <div className="visibility-toggle">
              <button
                type="button"
                className={"visibility-btn" + (isPublic ? " active" : "")}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                onClick={() => setIsPublic(true)}
              >
                <DynamicIcon name="GlobeAltIcon" width={16} height={16} /> Public
              </button>
              <button
                type="button"
                className={"visibility-btn" + (!isPublic ? " active" : "")}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                onClick={() => setIsPublic(false)}
              >
                <DynamicIcon name="LockClosedIcon" width={16} height={16} /> Private
              </button>
            </div>
            <p className="form-hint">
              {isPublic
                ? "Visible on your public profile"
                : "Hidden from public profile — only visible to you"}
            </p>
          </div>

          {/* Preview */}
          <div
            className="sector-preview"
            style={{ borderColor: color, color }}
          >
            <DynamicIcon name={icon} style={{ color }} />
            <span>{name || "Sector Name"}</span>
            {!isPublic && (
              <span style={{ marginLeft: "auto", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}>
                <DynamicIcon name="LockClosedIcon" width={12} height={12} /> Private
              </span>
            )}
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            {confirmDelete ? (
              <>
                <span className="form-error" style={{ flex: 1 }}>Delete this sector and all its beacons?</span>
                <button type="button" className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={() => onDeleted(sector.id)}>Delete</button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-danger-outline" onClick={() => setConfirmDelete(true)}>
                  Delete Sector
                </button>
                <div style={{ flex: 1 }} />
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button
                  id="btn-save-sector"
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !name.trim()}
                >
                  {loading ? <span className="spinner" /> : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

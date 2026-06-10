"use client";

import { useState } from "react";
import { createSector } from "@/lib/actions";
import type { SectorWithBeacons } from "@/types";

type Props = {
  onClose: () => void;
  onCreated: (sector: SectorWithBeacons) => void;
};

import { DynamicIcon, ICON_OPTIONS } from "@/components/dynamic-icon";

const COLOR_OPTIONS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#7c6bff", "#a855f7", "#ec4899",
];

export default function AddSectorModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("FolderIcon");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => { setIsClosing(true); setTimeout(onClose, 200); };
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    const result = await createSector({ name, icon, color });
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      onCreated({ ...result.data, beacons: [] });
    }
  }

  return (
    <div className={`modal-overlay ${isClosing ? "closing" : ""}`} onClick={handleClose} role="dialog" aria-modal="true" aria-label="Add Sector">
      <div className={`modal-panel ${isClosing ? "closing" : ""} glass`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New Sector</h2>
          <button type="button" className="btn-icon modal-close" onClick={handleClose} aria-label="Close"><DynamicIcon name="XMarkIcon" fallback="✕" /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="sector-name">Sector Name</label>
            <input
              id="sector-name"
              className="input"
              type="text"
              placeholder="e.g. Design Tools"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              maxLength={40}
            />
          </div>

          {/* Icon picker */}
          <div className="form-group">
            <label className="form-label">Icon</label>
            <div className="icon-picker" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(36px, 1fr))", gap: "0.375rem" }}>
              {ICON_OPTIONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  className={"icon-option" + (icon === em ? " selected" : "")}
                  onClick={() => setIcon(em)}
                  aria-label={em}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", cursor: "pointer", transition: "all 0.15s" }}
                >
                  <DynamicIcon name={em} style={{ color: icon === em ? "var(--color-violet-glow)" : "var(--color-starlight)" }} />
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className="form-group">
            <label className="form-label">Accent Color</label>
            <div className="color-picker">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={"color-option" + (color === c ? " selected" : "")}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="sector-preview" style={{ borderColor: color }}>
            <DynamicIcon name={icon} style={{ color }} />
            <span style={{ color }}>{name || "Sector Name"}</span>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
            <button
              id="btn-create-sector"
              type="submit"
              className="btn btn-primary"
              disabled={loading || !name.trim()}
            >
              {loading ? <span className="spinner" /> : "Create Sector"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


"use client";

import { useState } from "react";
import { createSector } from "@/lib/actions";
import type { SectorWithBeacons } from "@/types";

type Props = {
  onClose: () => void;
  onCreated: (sector: SectorWithBeacons) => void;
};

const ICON_OPTIONS = ["📁", "🌐", "💼", "🎮", "🎵", "📚", "🛠️", "⚡", "🎨", "📰", "🔗", "🚀"];
const COLOR_OPTIONS = [
  "#7c6bff", "#06b6d4", "#f97316", "#ec4899",
  "#22c55e", "#eab308", "#a855f7", "#ef4444",
];

export default function AddSectorModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📁");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
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
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Add Sector">
      <div className="modal-panel glass" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New Sector</h2>
          <button className="btn-icon modal-close" onClick={onClose} aria-label="Close">✕</button>
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
            <div className="icon-picker">
              {ICON_OPTIONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  className={`icon-option ${icon === em ? "selected" : ""}`}
                  onClick={() => setIcon(em)}
                  aria-label={em}
                >
                  {em}
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
                  className={`color-option ${color === c ? "selected" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="sector-preview" style={{ borderColor: color }}>
            <span>{icon}</span>
            <span style={{ color }}>{name || "Sector Name"}</span>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
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

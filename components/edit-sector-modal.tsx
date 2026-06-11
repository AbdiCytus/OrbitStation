"use client";

import { useState, useEffect } from "react";
import { updateSector } from "@/lib/actions";
import type { SectorWithBeacons } from "@/types";

import { DynamicIcon, ICON_OPTIONS } from "@/components/dynamic-icon";

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
  "#f43f5e", "#94a3b8", "#fbbf24", "#34d399"
];

type Props = {
  sector: SectorWithBeacons;
  sectors: SectorWithBeacons[];
  onClose: () => void;
  onUpdated: (sector: SectorWithBeacons) => void;
  onDeleted: (sectorId: string, moveToSectorId?: string) => void;
};

export default function EditSectorModal({ sector, sectors, onClose, onUpdated, onDeleted }: Props) {
  const [name, setName] = useState(sector.name);
  const [icon, setIcon] = useState(sector.icon ?? "FolderIcon");
  const [color, setColor] = useState(sector.color ?? "#7c5cfc");
  const [isPublic, setIsPublic] = useState((sector as SectorWithBeacons & { isPublic?: boolean }).isPublic !== false);
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => { setIsClosing(true); setTimeout(onClose, 200); };
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteOption, setDeleteOption] = useState<"delete_all" | "move">("delete_all");
  const otherSectors = sectors.filter(s => s.id !== sector.id);
  const [moveToSectorId, setMoveToSectorId] = useState<string>(otherSectors[0]?.id ?? "");
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
      <div className={`modal-panel ${isClosing ? "closing" : ""} glass`} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "750px", width: "95%" }}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Sector</h2>
          <button className="btn-icon modal-close" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSave} className="modal-form" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {/* LEFT SECTION */}
            <div style={{ flex: 1, minWidth: "250px", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Sector name */}
              <div className="form-group" style={{ marginBottom: 0 }}>
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
              <div className="form-group" style={{ marginBottom: 0 }}>
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
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Accent Color</label>
                <div className="color-picker" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={"color-option" + (color === c ? " selected" : "")}
                      style={{ backgroundColor: c, flexShrink: 0 }}
                      onClick={() => setColor(c)}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT SECTION */}
            <div style={{ flex: 1, minWidth: "250px", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Visibility toggle */}
              <div className="form-group" style={{ marginBottom: 0 }}>
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
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Preview</label>
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
              </div>

              {/* Delete Sector Section */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: "#ef4444" }}>Danger Zone</label>
                {!confirmDelete ? (
                  <button type="button" className="btn btn-danger-outline" style={{ width: "100%", justifyContent: "center" }} onClick={() => setConfirmDelete(true)}>
                    Delete Sector
                  </button>
                ) : (
                  <div style={{ width: "100%", padding: "0.75rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px" }}>
                    <p className="form-error" style={{ marginBottom: "0.75rem", fontSize: "0.85rem" }}>Are you sure you want to delete this sector?</p>
                    {sector.beacons.length > 0 && otherSectors.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#fff", fontSize: "0.85rem", cursor: "pointer" }}>
                          <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: `2px solid ${deleteOption === "delete_all" ? color : "#6b7280"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {deleteOption === "delete_all" && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />}
                          </div>
                          <input type="radio" style={{ display: "none" }} checked={deleteOption === "delete_all"} onChange={() => setDeleteOption("delete_all")} />
                          Delete all {sector.beacons.length} beacon(s)
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#fff", fontSize: "0.85rem", cursor: "pointer" }}>
                          <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: `2px solid ${deleteOption === "move" ? color : "#6b7280"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {deleteOption === "move" && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />}
                          </div>
                          <input type="radio" style={{ display: "none" }} checked={deleteOption === "move"} onChange={() => setDeleteOption("move")} />
                          Move {sector.beacons.length} beacon(s)
                        </label>
                        {deleteOption === "move" && (
                          <select 
                            className="input" 
                            style={{ marginTop: "0.25rem", fontSize: "0.85rem", padding: "0.4rem" }}
                            value={moveToSectorId}
                            onChange={(e) => setMoveToSectorId(e.target.value)}
                          >
                            {otherSectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        )}
                      </div>
                    )}
                    {sector.beacons.length > 0 && otherSectors.length === 0 && (
                      <p style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "0.5rem" }}>This will also delete {sector.beacons.length} beacon(s) because there is no other sector to move them to.</p>
                    )}
                    <div style={{ display: "flex", width: "100%", gap: "0.5rem", marginTop: "1rem" }}>
                      <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: "0.4rem" }} onClick={() => setConfirmDelete(false)}>Cancel</button>
                      <button type="button" className="btn btn-danger" style={{ flex: 1, padding: "0.4rem" }} onClick={() => onDeleted(sector.id, deleteOption === "move" ? moveToSectorId : undefined)}>Confirm</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && <p className="form-error" style={{ marginTop: "1rem" }}>{error}</p>}

          <div className="modal-actions" style={{ flexWrap: "wrap", marginTop: "1.5rem", display: "flex", alignItems: "center" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <div style={{ flex: 1 }} />
            <button
              id="btn-save-sector"
              type="submit"
              className="btn btn-primary"
              disabled={loading || !name.trim()}
            >
              {loading ? <span className="spinner" /> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

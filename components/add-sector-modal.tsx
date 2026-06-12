"use client";

import { useState, useEffect } from "react";
import { createSector, getFriends } from "@/lib/actions";
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
  const [isPublic, setIsPublic] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => { setIsClosing(true); setTimeout(onClose, 200); };
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFriends().then(setFriends);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    const result = await createSector({ 
      name, icon, color, isPublic, 
      invitedFriendIds: !isPublic ? invitedFriends : undefined 
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      onCreated({ ...result.data, beacons: [] });
    }
  }

  return (
    <div className={`modal-overlay ${isClosing ? "closing" : ""}`} onClick={handleClose} role="dialog" aria-modal="true" aria-label="Add Sector" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", overflowY: "auto" }}>
      <div style={{ display: "flex", gap: "1rem", flexDirection: "row", alignItems: "stretch", justifyContent: "center", width: "100%", maxWidth: showInvite && !isPublic ? "1170px" : "750px", flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
      {/* MAIN PANEL */}
      <div className={`modal-panel ${isClosing ? "closing" : ""} glass`} style={{ flex: "1 1 500px", maxWidth: "750px", margin: 0, display: "flex", flexDirection: "column" }}>
        <div className="modal-header">
          <h2 className="modal-title">New Sector</h2>
          {!showInvite && (
            <button type="button" className="btn-icon modal-close" onClick={handleClose} aria-label="Close">✕</button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="modal-form" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: "2rem", flexDirection: "row" }}>
          {/* Left Section */}
          <div style={{ flex: 1, minWidth: "250px", display: "flex", flexDirection: "column", gap: "1rem" }}>
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

          </div>

          {/* Right Section */}
          <div style={{ flex: 1, minWidth: "250px", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Visibility toggle */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Visibility</label>
              <div className="visibility-toggle">
                <button
                  type="button"
                  className={"visibility-btn" + (isPublic ? " active" : "")}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                  onClick={() => { setIsPublic(true); setShowInvite(false); setInvitedFriends([]); }}
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
              {!isPublic && (
                <div style={{ marginTop: "1rem" }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ width: "100%", justifyContent: "center", borderStyle: "dashed" }}
                    onClick={() => setShowInvite(!showInvite)}
                  >
                    <DynamicIcon name="UserPlusIcon" width={18} height={18} /> {showInvite ? "Hide Invite Friends" : "Invite Friends to Collaborate"}
                  </button>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Preview</label>
              <div className="sector-preview" style={{ borderColor: color, color }}>
                <DynamicIcon name={icon} style={{ color }} />
                <span>{name || "Sector Name"}</span>
                {!isPublic && (
                  <span style={{ marginLeft: "auto", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}>
                    <DynamicIcon name="LockClosedIcon" width={12} height={12} /> Private
                  </span>
                )}
              </div>
            </div>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions" style={{ flexWrap: "wrap", marginTop: "1.5rem", display: "flex", alignItems: "center" }}>
            <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
            <div style={{ flex: 1 }} />
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

      {/* SECOND PANEL */}
      {showInvite && !isPublic && (
        <div className={`modal-panel ${isClosing ? "closing" : ""} glass`} style={{ flex: "1 1 300px", maxWidth: "400px", margin: 0, display: "flex", flexDirection: "column" }}>
          <div className="modal-header" style={{ paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: "1rem" }}>
            <h3 className="modal-title" style={{ fontSize: "1.1rem" }}>Invite Friends</h3>
            <button className="btn-icon modal-close" onClick={() => setShowInvite(false)} aria-label="Close">✕</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.5rem", padding: "0 1.5rem 1.5rem 1.5rem" }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, display: "flex", flexDirection: "column" }}>
              <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Select Friends</span>
                <span style={{ fontSize: "0.8rem", color: "var(--color-violet-glow)" }}>{invitedFriends.length} selected</span>
              </label>
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {friends.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center mt-4">You have no friends to invite yet.</p>
                ) : (
                  friends.map(f => (
                    <label key={f.id} className="flex items-center rounded-full border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-colors group" style={{ gap: "0.75rem", padding: "0.5rem 1.25rem 0.5rem 0.5rem", marginBottom: "0.5rem" }}>
                      <div className="rounded-full bg-gray-700 overflow-hidden relative flex-shrink-0" style={{ width: "40px", height: "40px" }}>
                        {f.image ? <img src={f.image} alt={f.name} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-300 font-bold w-full h-full flex items-center justify-center">{(f.name || f.username || "?")[0].toUpperCase()}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-300 truncate">{f.name || f.username}</p>
                      </div>
                      <div className="flex items-center justify-center rounded-full border transition-colors" style={{ width: "20px", height: "20px", borderColor: invitedFriends.includes(f.id) ? "#a78bfa" : "rgba(255,255,255,0.1)", background: invitedFriends.includes(f.id) ? "#a78bfa" : "transparent" }}>
                        {invitedFriends.includes(f.id) && <DynamicIcon name="CheckIcon" width={12} height={12} style={{ color: "white" }} />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={invitedFriends.includes(f.id)}
                        onChange={(e) => {
                          if (e.target.checked) setInvitedFriends(prev => [...prev, f.id]);
                          else setInvitedFriends(prev => prev.filter(id => id !== f.id));
                        }}
                      />
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { updateSector, getFriends, removeCollaborator, sendTransferOwnershipInvite, hasCollabInvites, getPendingCollabInvites, getSectorOwner } from "@/lib/actions";
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
  currentUserId?: string;
};

export default function EditSectorModal({ sector, sectors, onClose, onUpdated, onDeleted, currentUserId }: Props) {
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

  const [friends, setFriends] = useState<any[]>([]);
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);
  const [rightPanelMode, setRightPanelMode] = useState<"members" | "invite" | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [transferringTo, setTransferringTo] = useState<string | null>(null);
  const [hasPendingInvites, setHasPendingInvites] = useState(false);
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [sectorOwner, setSectorOwner] = useState<any>(null);
  const [localCollaborators, setLocalCollaborators] = useState(sector.collaborators || []);

  const isCollabSector = localCollaborators.length > 0;

  useEffect(() => {
    getFriends().then(setFriends);
    hasCollabInvites(sector.id).then(setHasPendingInvites);
    getPendingCollabInvites(sector.id).then(setPendingMembers);
    getSectorOwner(sector.id).then(setSectorOwner);
  }, [sector.id]);

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
    
    // Only send invitedFriends if we are in private mode (or locked private)
    const newInvites = !isPublic || isCollabSector || hasPendingInvites ? invitedFriends : undefined;
    
    const result = await updateSector(sector.id, { 
      name, icon, color, isPublic: (isCollabSector || hasPendingInvites) ? false : isPublic,
      invitedFriendIds: newInvites
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      onUpdated({ ...sector, name, icon, color, isPublic } as SectorWithBeacons & { isPublic: boolean });
    }
  }

  return (
    <div className={`modal-overlay ${isClosing ? "closing" : ""}`} onClick={handleClose} role="dialog" aria-modal="true" aria-label="Edit Sector" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", overflowY: "auto" }}>
      <div style={{ display: "flex", gap: "1rem", flexDirection: "row", alignItems: "stretch", justifyContent: "center", width: "100%", maxWidth: rightPanelMode ? "1170px" : "750px", flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
        {/* MAIN PANEL */}
        <div className={`modal-panel ${isClosing ? "closing" : ""} glass`} style={{ flex: "1 1 500px", maxWidth: "750px", margin: 0, display: "flex", flexDirection: "column" }}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Sector</h2>
          {!rightPanelMode && (
            <button className="btn-icon modal-close" onClick={handleClose} aria-label="Close">✕</button>
          )}
        </div>

        <form onSubmit={handleSave} className="modal-form" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: "2rem", flexDirection: "row" }}>
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
                {(isCollabSector || hasPendingInvites) ? (
                  <div style={{ padding: "0.75rem", background: "rgba(139, 92, 246, 0.1)", border: "1px solid rgba(139, 92, 246, 0.2)", borderRadius: "8px", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <DynamicIcon name="LockClosedIcon" width={20} height={20} style={{ color: "var(--color-violet-glow)" }} />
                    <span style={{ fontSize: "0.85rem", color: "#e2e8f0" }}>Collab sectors are permanently Private</span>
                  </div>
                ) : (
                  <>
                    <div className="visibility-toggle">
                      <button
                        type="button"
                        className={"visibility-btn" + (isPublic ? " active" : "")}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                        onClick={() => { setIsPublic(true); setRightPanelMode(null); setInvitedFriends([]); }}
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
                  </>
                )}
                
                {/* Invite friends toggle */}
                {(!isPublic || isCollabSector || hasPendingInvites) && (
                  <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {(isCollabSector || pendingMembers.length > 0) && (
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ width: "100%", justifyContent: "center", borderStyle: "dashed" }}
                        onClick={() => setRightPanelMode(rightPanelMode === "members" ? null : "members")}
                      >
                        <DynamicIcon name="UsersIcon" width={18} height={18} /> {rightPanelMode === "members" ? "Hide Members" : "View Members"}
                      </button>
                    )}
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ width: "100%", justifyContent: "center", borderStyle: "dashed" }}
                      onClick={() => setRightPanelMode(rightPanelMode === "invite" ? null : "invite")}
                    >
                      <DynamicIcon name="UserPlusIcon" width={18} height={18} /> {rightPanelMode === "invite" ? "Hide Invite Friends" : "Invite Friends to Collaborate"}
                    </button>
                  </div>
                )}
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
                  <button type="button" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center", borderStyle: "dashed", borderColor: "rgba(239, 68, 68, 0.4)", color: "#ef4444", backgroundColor: "transparent" }} onClick={() => setConfirmDelete(true)}>
                    Delete Sector
                  </button>
                ) : (
                  <div style={{ width: "100%", padding: "0.75rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px" }}>
                    <p className="form-error" style={{ marginBottom: "0.75rem", fontSize: "0.85rem" }}>Are you sure you want to delete this sector?</p>
                    {sector.beacons.length > 0 && otherSectors.length > 0 && !isCollabSector && (
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
                    {sector.beacons.length > 0 && (otherSectors.length === 0 || isCollabSector) && (
                      <p style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                        This will also delete {sector.beacons.length} beacon(s) {isCollabSector ? "because this is a Collab Sector" : "because there is no other sector to move them to"}.
                      </p>
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

      {/* SECOND PANEL (Collab Members & Invite) */}
      {rightPanelMode && (
        <div className={`modal-panel ${isClosing ? "closing" : ""} glass`} style={{ flex: "1 1 300px", maxWidth: "400px", margin: 0, display: "flex", flexDirection: "column" }}>
          <div className="modal-header" style={{ paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: "1rem" }}>
            <h3 className="modal-title" style={{ fontSize: "1.1rem" }}>{rightPanelMode === "members" ? "Members" : "Invite Friends"}</h3>
            <button className="btn-icon modal-close" onClick={() => setRightPanelMode(null)} aria-label="Close">✕</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.5rem", padding: "0 1.5rem 1.5rem 1.5rem" }}>
                
                {/* Active Collaborators */}
                {rightPanelMode === "members" && (
                  <div className="form-group" style={{ marginBottom: 0, flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", paddingRight: "0.5rem" }}>
                      
                      {/* Owner */}
                      {sectorOwner && (
                        <div className="flex items-center justify-between rounded-full border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group" style={{ padding: "0.5rem 1rem 0.5rem 0.5rem", marginBottom: "0.5rem" }}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="rounded-full bg-gray-700 overflow-hidden relative flex-shrink-0" style={{ width: "40px", height: "40px" }}>
                              {sectorOwner.image ? <img src={sectorOwner.image} alt={sectorOwner.name ?? ""} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-300 font-bold w-full h-full flex items-center justify-center">{(sectorOwner.name || sectorOwner.username || "?")[0].toUpperCase()}</span>}
                            </div>
                            <p className="text-sm font-medium text-gray-300 truncate">
                              {sectorOwner.name || sectorOwner.username}
                              {sectorOwner.id === currentUserId && <span className="opacity-50 ml-1"> (You)</span>}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-[#a78bfa] uppercase tracking-widest">Owner</span>
                        </div>
                      )}

                      {/* Active Members */}
                      {localCollaborators?.map((c: any) => (
                        <div key={c.user.id} className="flex items-center justify-between rounded-full border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group" style={{ padding: "0.5rem 0.75rem 0.5rem 0.5rem", marginBottom: "0.5rem" }}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="rounded-full bg-gray-700 overflow-hidden relative flex-shrink-0" style={{ width: "40px", height: "40px" }}>
                              {c.user.image ? <img src={c.user.image} alt={c.user.name ?? ""} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-300 font-bold w-full h-full flex items-center justify-center">{(c.user.name || c.user.username || "?")[0].toUpperCase()}</span>}
                            </div>
                            <p className="text-sm font-medium text-gray-300 truncate">
                              {c.user.name || c.user.username}
                              {c.user.id === currentUserId && <span className="opacity-50 ml-1"> (You)</span>}
                            </p>
                          </div>
                          <div className="flex items-center transition-opacity" style={{ gap: "0.5rem" }}>
                            <button type="button" onClick={() => setTransferringTo(c.user.id)} className="flex items-center justify-center text-gray-400 hover:text-violet-400 rounded-full hover:bg-violet-500/20 transition-colors" style={{ width: "36px", height: "36px" }} title="Transfer Ownership">
                              <DynamicIcon name="ArrowsRightLeftIcon" width={16} height={16} />
                            </button>
                            <button type="button" onClick={() => setRemovingMemberId(c.user.id)} className="flex items-center justify-center text-gray-400 hover:text-pink-400 rounded-full hover:bg-pink-500/20 transition-colors" style={{ width: "36px", height: "36px" }} title="Remove Member">
                              <DynamicIcon name="UserMinusIcon" width={16} height={16} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Pending Members */}
                      {pendingMembers.length > 0 && (
                        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2" style={{ marginBottom: "1rem" }}>Pending Invites</div>
                          {pendingMembers.map((u: any) => (
                            <div key={u.id} className="flex items-center justify-between rounded-full border border-white/5 bg-white/[0.02] transition-colors group opacity-60" style={{ padding: "0.5rem 0.75rem 0.5rem 0.5rem", marginBottom: "0.5rem" }}>
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="rounded-full bg-gray-700 overflow-hidden relative flex-shrink-0" style={{ width: "40px", height: "40px" }}>
                                  {u.image ? <img src={u.image} alt={u.name ?? ""} className="w-full h-full object-cover grayscale" /> : <span className="text-xs text-gray-300 font-bold w-full h-full flex items-center justify-center">{(u.name || u.username || "?")[0].toUpperCase()}</span>}
                                </div>
                                <p className="text-sm font-medium text-gray-300 truncate">{u.name || u.username}</p>
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 py-1 rounded-md">Pending</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Invite Friends */}
                {rightPanelMode === "invite" && (
                  <div className="form-group" style={{ marginBottom: 0, flex: 1, display: "flex", flexDirection: "column" }}>
                    <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>Select Friends</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-violet-glow)" }}>{invitedFriends.length} selected</span>
                    </label>
                    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {friends.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center mt-4">You have no friends to invite yet.</p>
                      ) : (
                        friends.filter(f => !localCollaborators?.find((c: any) => c.user.id === f.id) && !pendingMembers.find((p: any) => p.id === f.id)).map(f => (
                          <label key={f.id} className="flex items-center rounded-full border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-colors group" style={{ gap: "0.75rem", padding: "0.5rem 1.25rem 0.5rem 0.5rem", marginBottom: "0.5rem" }}>
                            <div className="rounded-full bg-gray-700 overflow-hidden relative flex-shrink-0" style={{ width: "40px", height: "40px" }}>
                              {f.image ? <img src={f.image} alt={f.name} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-300 font-bold w-full h-full flex items-center justify-center">{(f.name || f.username || "?")[0].toUpperCase()}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-300 truncate">{f.name || f.username}</p>
                            </div>
                            <div className="flex items-center justify-center w-5 h-5 rounded-full border transition-colors" style={{ borderColor: invitedFriends.includes(f.id) ? "#a78bfa" : "rgba(255,255,255,0.1)", background: invitedFriends.includes(f.id) ? "#a78bfa" : "transparent" }}>
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
                )}

              </div>
        </div>
      )}
      </div>

      {(removingMemberId || transferringTo) && (
        <div 
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center backdrop-blur-sm" 
          onClick={(e) => { e.stopPropagation(); setRemovingMemberId(null); setTransferringTo(null); }}
        >
          <div 
            className="bg-[#0b0c10] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col" 
            style={{ borderRadius: "2rem", maxWidth: "24rem", width: "100%", padding: "2.5rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient top line */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: removingMemberId ? "linear-gradient(90deg, transparent, #f43f5e, transparent)" : "linear-gradient(90deg, transparent, #8b5cf6, transparent)" }}></div>
            
            {/* Centered icon */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem", marginTop: "0.5rem" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: removingMemberId ? "radial-gradient(circle, rgba(244,63,94,0.15) 0%, transparent 70%)" : "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)", border: removingMemberId ? "1px solid rgba(244,63,94,0.2)" : "1px solid rgba(139,92,246,0.2)" }}>
                <DynamicIcon name={removingMemberId ? "UserMinusIcon" : "ArrowsRightLeftIcon"} width={32} height={32} style={{ color: removingMemberId ? "#f43f5e" : "#a78bfa", filter: removingMemberId ? "drop-shadow(0 0 12px rgba(244,63,94,0.6))" : "drop-shadow(0 0 12px rgba(139,92,246,0.6))" }} />
              </div>
            </div>

            {/* Content */}
            <div className="text-center text-white" style={{ marginBottom: "2rem" }}>
              <h4 className="text-2xl font-bold tracking-tight" style={{ marginBottom: "1rem" }}>{removingMemberId ? "Remove Member?" : "Transfer Ownership?"}</h4>
              <p className="text-sm text-gray-400 leading-relaxed px-2">
                {removingMemberId 
                  ? "Are you sure you want to remove this member from the collaboration?" 
                  : "You will lose ownership of this sector and become a regular collaborator. This action cannot be undone."}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex" style={{ gap: "1rem" }}>
              <button type="button" className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all font-medium text-sm border border-white/5" style={{ padding: "0.75rem 0" }} onClick={() => { setRemovingMemberId(null); setTransferringTo(null); }}>Cancel</button>
              <button type="button" className={`flex-1 text-white rounded-2xl transition-all font-medium text-sm shadow-xl ${removingMemberId ? "bg-[#e11d48] hover:bg-[#be123c] shadow-pink-500/20" : "bg-[#8b5cf6] hover:bg-[#7c3aed] shadow-violet-500/20"}`} style={{ padding: "0.75rem 0" }} onClick={async () => {
                if (removingMemberId) {
                  const id = removingMemberId; setRemovingMemberId(null);
                  await removeCollaborator(sector.id, id);
                  setLocalCollaborators(prev => prev.filter((c: any) => c.user.id !== id));
                } else {
                  const id = transferringTo; setTransferringTo(null);
                  await sendTransferOwnershipInvite(sector.id, id!);
                }
              }}>
                {removingMemberId ? "Remove" : "Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

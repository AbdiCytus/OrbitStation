"use client";

import { useState, useEffect } from "react";
import { updateSector, getFriends, removeCollaborator, sendTransferOwnershipInvite, hasCollabInvites, getPendingCollabInvites, getSectorOwner } from "@/lib/actions";
import type { SectorWithBeacons } from "@/types";
import { toast } from "sonner";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ShieldCheckIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { setCollabRole } from "@/lib/actions";

import { DynamicIcon, ICON_OPTIONS } from "@/components/dynamic-icon";

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#7c6bff", "#a855f7", "#ec4899",
];

function CustomColorPicker({ color, setColor, isSelected }: { color: string, setColor: (c: string) => void, isSelected: boolean }) {
  const [localColor, setLocalColor] = useState(color && !COLORS.includes(color) ? color : "#ffffff");

  useEffect(() => {
    if (color && !COLORS.includes(color)) setLocalColor(color);
  }, [color]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (isSelected && localColor !== color) {
        setColor(localColor);
      }
    }, 80);
    return () => clearTimeout(t);
  }, [localColor, setColor, isSelected, color]);

  return (
    <label className={"color-option" + (isSelected ? " selected" : "")} style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, background: "conic-gradient(from 180deg, red, yellow, lime, aqua, blue, magenta, red)", position: "relative", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
      <input
        type="color"
        value={localColor}
        onChange={(e) => {
          setLocalColor(e.target.value);
          if (!isSelected) setColor(e.target.value);
        }}
        style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", cursor: "pointer", zIndex: 2, colorScheme: "dark" }}
      />
      {isSelected && (
        <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: localColor, border: "2px solid white", boxShadow: "0 0 4px rgba(0,0,0,0.5)", zIndex: 1, pointerEvents: "none" }} />
      )}
    </label>
  );
}

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
  const [inviteEnabled, setInviteEnabled] = useState((sector as any).inviteEnabled ?? false);
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => { setIsClosing(true); setTimeout(onClose, 200); };
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteOption, setDeleteOption] = useState<"delete_all" | "move">("delete_all");
  const otherSectors = sectors.filter(s => s.id !== sector.id);
  const availableMoveSectors = otherSectors.filter(s => !(s.collaborators && s.collaborators.length > 0));
  const [moveToSectorId, setMoveToSectorId] = useState<string>(availableMoveSectors[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [mobilePage, setMobilePage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const [formErrors, setFormErrors] = useState<{ name?: string }>({});

  const [friends, setFriends] = useState<any[]>([]);
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);
  const [rightPanelMode, setRightPanelMode] = useState<"members" | "invite" | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [transferringTo, setTransferringTo] = useState<string | null>(null);
  const [roleAction, setRoleAction] = useState<{ id: string, type: "promote" | "demote" } | null>(null);
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
    if (!name.trim()) {
      setFormErrors({ name: "Sector Name is required." });
      return;
    }
    setLoading(true);
    setError(null);

    // Only send invitedFriends if we are in private mode (or locked private)
    const newInvites = !isPublic || isCollabSector || hasPendingInvites ? invitedFriends : undefined;

    const isCollabType = isCollabSector || hasPendingInvites || inviteEnabled;
    const result = await updateSector(sector.id, {
      name, icon, color, isPublic: isCollabType ? false : isPublic,
      invitedFriendIds: newInvites,
      inviteEnabled
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      toast.error(result.error || "Failed to update sector");
    } else if (result.data) {
      toast.success("Sector updated successfully");
      onUpdated({ ...sector, name, icon, color, isPublic: isCollabType ? false : isPublic, inviteEnabled } as any);
    }
  }

  return (
    <div
      className={`modal-overlay ${isClosing ? "closing" : ""}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Edit Sector"
      style={{
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? "0" : "2rem",
        overflowY: isMobile ? "hidden" : "auto",
      }}
    >
      <style>{`
        .icon-picker-scroll::-webkit-scrollbar { display: none; }
      `}</style>
      <div style={{ display: "flex", rowGap: "1rem", flexDirection: "row", alignItems: "stretch", justifyContent: "center", width: "100%", maxWidth: isMobile ? "100%" : "1170px", flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
        {/* MAIN PANEL */}
        <div
          className={`modal-panel ${isClosing ? "closing" : ""} glass`}
          style={{
            flex: isMobile ? "unset" : "1 1 750px",
            maxWidth: isMobile ? "100%" : "750px",
            width: isMobile ? "100%" : undefined,
            borderRadius: isMobile ? "20px 20px 0 0" : undefined,
            margin: isMobile ? "auto 0 0 0" : 0,
            display: "flex",
            flexDirection: "column",

            maxHeight: isMobile ? "90dvh" : "85vh",
            height: isMobile ? "auto" : "560px",
            overflowY: isMobile ? "auto" : "auto",
            transform: isMobile ? "none" : undefined,
          }}
        >
          <div className="modal-header">
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <h2 className="modal-title">Edit Sector</h2>
              <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", fontWeight: "normal", marginTop: "4px" }}>
                Created: {new Date(sector.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            {!rightPanelMode && (
              <button className="btn-icon modal-close" onClick={handleClose} aria-label="Close"><XMarkIcon width={18} height={18} /></button>
            )}
          </div>

          <form onSubmit={handleSave} className="modal-form" style={{ display: "flex", flexDirection: "column", overflowX: isMobile ? "hidden" : "visible", padding: isMobile ? "1.25rem 0 1.5rem" : undefined }}>
            <div style={{ display: "flex", gap: isMobile ? "0" : "2rem", flexDirection: "row", transform: isMobile ? `translateX(-${mobilePage * 100}%)` : "none", transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)", width: isMobile ? "100%" : "auto", paddingBottom: isMobile ? "0" : "60px" }}>
              {/* LEFT SECTION */}
              <div style={{ flex: isMobile ? "0 0 100%" : 1, width: isMobile ? "100%" : "auto", padding: isMobile ? "0 1.5rem" : 0, minWidth: isMobile ? "100%" : "250px", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Sector name */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="edit-sector-name">Name</label>
                  <input
                    id="edit-sector-name"
                    className="input"
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setFormErrors({}); }}
                    maxLength={40}
                    autoFocus
                  />
                  {formErrors.name && <span className="text-red-500 text-xs mt-1 block">{formErrors.name}</span>}
                </div>

                {/* Icon picker */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Icon</label>
                  <div className="icon-picker icon-picker-scroll" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(36px, 1fr))", gap: "0.375rem", maxHeight: "78px", overflowY: "auto", scrollbarWidth: "none", msOverflowStyle: "none", paddingBottom: "2px" }}>
                    {ICON_OPTIONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        className={"icon-option" + (icon === ic ? " selected" : "")}
                        onClick={() => setIcon(ic)}
                        title={ic}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "6px", cursor: "pointer", transition: "all 0.15s" }}
                      >
                        <DynamicIcon name={ic} style={{ color: "var(--color-starlight)" }} />
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
                    <CustomColorPicker color={color} setColor={setColor} isSelected={color !== "" && !COLORS.includes(color)} />
                  </div>
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

              </div>

              {/* RIGHT SECTION */}
              <div style={{ flex: isMobile ? "0 0 100%" : 1, width: isMobile ? "100%" : "auto", padding: isMobile ? "0 1.5rem" : 0, minWidth: isMobile ? "100%" : "250px", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Visibility toggle */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Visibility</label>
                  {(isCollabSector || hasPendingInvites || inviteEnabled) ? (
                    <div style={{ padding: "0.75rem", background: "rgba(139, 92, 246, 0.1)", border: "1px solid rgba(139, 92, 246, 0.2)", borderRadius: "8px", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <DynamicIcon name="LockClosedIcon" width={20} height={20} style={{ color: "var(--color-primary)" }} />
                      <span style={{ fontSize: "0.85rem", color: "var(--color-starlight)" }}>Collab sectors are permanently Private</span>
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
                  {(!isPublic || isCollabSector || hasPendingInvites || inviteEnabled) && (
                    <div style={{ marginTop: "1rem", display: "flex", flexDirection: isMobile ? "column" : "row", gap: "0.5rem", background: isMobile ? "transparent" : "var(--item-bg)", padding: isMobile ? "0" : "0.25rem", borderRadius: "10px" }}>
                      {(isCollabSector || pendingMembers.length > 0) && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ flex: 1, justifyContent: "center", borderStyle: isMobile ? "dashed" : "none", background: !isMobile && rightPanelMode === "members" ? "var(--sector-active-bg)" : "transparent", color: !isMobile && rightPanelMode === "members" ? "var(--sector-active-text)" : undefined }}
                          onClick={() => {
                            const newMode = rightPanelMode === "members" ? null : "members";
                            setRightPanelMode(newMode);
                            if (newMode && isMobile) setMobilePage(2);
                          }}
                        >
                          <DynamicIcon name="UsersIcon" width={18} height={18} /> {!isMobile ? "Members" : rightPanelMode === "members" ? "Hide Members" : "View Members"}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ flex: 1, justifyContent: "center", borderStyle: isMobile ? "dashed" : "none", background: !isMobile && rightPanelMode === "invite" ? "var(--sector-active-bg)" : "transparent", color: !isMobile && rightPanelMode === "invite" ? "var(--sector-active-text)" : undefined }}
                        onClick={() => {
                          const newMode = rightPanelMode === "invite" ? null : "invite";
                          setRightPanelMode(newMode);
                          if (newMode && isMobile) setMobilePage(2);
                        }}
                      >
                        <DynamicIcon name="UserPlusIcon" width={18} height={18} /> {!isMobile ? "Invite" : rightPanelMode === "invite" ? "Hide Invite Friends" : "Invite Friends to Collaborate"}
                      </button>
                    </div>
                  )}
                  {/* QR Link toggle */}
                  {currentUserId === sectorOwner?.id && (
                    <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "var(--item-bg)", borderRadius: "8px", border: "1px solid var(--item-border)" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <span style={{ fontSize: "0.9rem", color: "var(--color-starlight)", fontWeight: 500 }}>QR & Link Join</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-comet)" }}>Allow users to join via invite link or QR code</span>
                      </div>
                      <button type="button" onClick={() => setInviteEnabled(!inviteEnabled)} style={{ width: "40px", height: "24px", borderRadius: "12px", background: inviteEnabled ? "var(--color-primary)" : "var(--item-border)", position: "relative", cursor: "pointer", border: "none", transition: "background 0.2s" }}>
                        <div style={{ width: "20px", height: "20px", borderRadius: "10px", background: "white", position: "absolute", top: "2px", left: inviteEnabled ? "18px" : "2px", transition: "left 0.2s" }} />
                      </button>
                    </div>
                  )}
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
                      {sector.beacons.length > 0 && availableMoveSectors.length > 0 && !isCollabSector && (
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
                              {availableMoveSectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                          )}
                        </div>
                      )}
                      {sector.beacons.length > 0 && (availableMoveSectors.length === 0 || isCollabSector) && (
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

              {/* Mobile Expanded Members / Invite Panel (Rendered inline on mobile) */}
              {isMobile && rightPanelMode && (
                <div style={{ flex: "0 0 100%", width: "100%", padding: "0 1.5rem", minWidth: "100%" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", height: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-starlight)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {rightPanelMode === "members" ? (
                          <>Members <span className="text-xs rounded-full border flex items-center justify-center shrink-0" style={{ background: "var(--sector-active-bg)", borderColor: "var(--sector-active-border)", color: "var(--color-primary)", padding: "2px 8px", minWidth: "24px" }}>{(sectorOwner ? 1 : 0) + localCollaborators.length}</span></>
                        ) : "Invite Friends"}
                      </h3>
                    </div>

                    {/* Active Collaborators */}
                    {rightPanelMode === "members" && (
                      <div className="form-group" style={{ marginBottom: 0, flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", paddingRight: "0.5rem", maxHeight: "40vh" }}>

                          {/* Owner */}
                          {sectorOwner && (
                            <div
                              className="flex items-center justify-between rounded-full border bg-[var(--item-bg)] border-[var(--item-border)] hover:bg-[var(--glass-bg-hover)] transition-colors group"
                              style={{ padding: "0.5rem 1rem 0.5rem 0.5rem", marginBottom: "0.5rem" }}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="rounded-full bg-[var(--item-bg)] border border-[var(--item-border)] overflow-hidden relative flex-shrink-0" style={{ width: "40px", height: "40px" }}>
                                  {sectorOwner.image ? <img src={sectorOwner.image} alt={sectorOwner.name ?? ""} className="w-full h-full object-cover" /> : <span className="text-xs text-comet font-bold w-full h-full flex items-center justify-center">{(sectorOwner.name || sectorOwner.username || "?")[0].toUpperCase()}</span>}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <p className="text-sm font-medium text-comet truncate leading-tight">
                                    {sectorOwner.name || sectorOwner.username}
                                    {sectorOwner.id === currentUserId && <span className="opacity-50 ml-1"> (You)</span>}
                                  </p>
                                  <span className="text-[10px] font-bold text-[#FFD700] uppercase tracking-widest mt-1">Owner</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Active Members */}
                          {localCollaborators?.map((c: any) => (
                            <div
                              key={c.user.id}
                              className="flex items-center justify-between rounded-full border bg-[var(--item-bg)] border-[var(--item-border)] hover:bg-[var(--glass-bg-hover)] transition-colors group"
                              style={{ padding: "0.5rem 0.75rem 0.5rem 0.5rem", marginBottom: "0.5rem" }}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="rounded-full bg-[var(--item-bg)] border border-[var(--item-border)] overflow-hidden relative flex-shrink-0" style={{ width: "40px", height: "40px" }}>
                                  {c.user.image ? <img src={c.user.image} alt={c.user.name ?? ""} className="w-full h-full object-cover" /> : <span className="text-xs text-comet font-bold w-full h-full flex items-center justify-center">{(c.user.name || c.user.username || "?")[0].toUpperCase()}</span>}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <p className="text-sm font-medium text-comet truncate leading-tight">
                                    {c.user.name || c.user.username}
                                    {c.user.id === currentUserId && <span className="opacity-50 ml-1"> (You)</span>}
                                  </p>
                                  <span className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: c.role === 'ADMIN' ? '#10B981' : '#9CA3AF' }}>{c.role || 'MEMBER'}</span>
                                </div>
                              </div>
                              <div className="flex items-center transition-opacity" style={{ gap: "0.25rem" }}>
                                {currentUserId === sectorOwner?.id && (
                                  <button type="button" onClick={() => setRoleAction({ id: c.user.id, type: c.role === "ADMIN" ? "demote" : "promote" })} className="flex items-center justify-center text-comet rounded-full transition-colors" style={{ width: "36px", height: "36px" }} title={c.role === "ADMIN" ? "Demote to Member" : "Promote to Admin"} onMouseEnter={(e) => { e.currentTarget.style.color = c.role === "ADMIN" ? "#fb923c" : "#10b981"; e.currentTarget.style.background = c.role === "ADMIN" ? "rgba(251,146,60,0.2)" : "rgba(16,185,129,0.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.background = "transparent"; }}>
                                    {c.role === "ADMIN" ? <ShieldExclamationIcon width={16} height={16} /> : <ShieldCheckIcon width={16} height={16} />}
                                  </button>
                                )}
                                <button type="button" onClick={() => setTransferringTo(c.user.id)} className="flex items-center justify-center text-comet hover:text-violet-400 rounded-full hover:bg-violet-500/20 transition-colors" style={{ width: "36px", height: "36px" }} title="Transfer Ownership">
                                  <DynamicIcon name="ArrowsRightLeftIcon" width={16} height={16} />
                                </button>
                                <button type="button" onClick={() => setRemovingMemberId(c.user.id)} className="flex items-center justify-center text-comet hover:text-pink-400 rounded-full hover:bg-pink-500/20 transition-colors" style={{ width: "36px", height: "36px" }} title="Remove Member">
                                  <DynamicIcon name="UserMinusIcon" width={16} height={16} />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Pending Members */}
                          {pendingMembers.length > 0 && (
                            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                              <div className="text-[10px] font-bold text-comet uppercase tracking-widest pl-2" style={{ marginBottom: "1rem" }}>Pending Invites</div>
                              {pendingMembers.map((u: any) => (
                                <div
                                  key={u.id}
                                  className="flex items-center justify-between rounded-full border bg-[var(--item-bg)] border-[var(--item-border)] transition-colors group opacity-60"
                                  style={{ padding: "0.5rem 0.75rem 0.5rem 0.5rem", marginBottom: "0.5rem" }}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="rounded-full bg-[var(--item-bg)] border border-[var(--item-border)] overflow-hidden relative flex-shrink-0" style={{ width: "40px", height: "40px" }}>
                                      {u.image ? <img src={u.image} alt={u.name ?? ""} className="w-full h-full object-cover grayscale" /> : <span className="text-xs text-comet font-bold w-full h-full flex items-center justify-center">{(u.name || u.username || "?")[0].toUpperCase()}</span>}
                                    </div>
                                    <p className="text-sm font-medium text-comet truncate">{u.name || u.username}</p>
                                  </div>
                                  <span className="text-[10px] font-bold text-comet uppercase tracking-widest px-2 py-1 rounded-md">Pending</span>
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
                          <span style={{ fontSize: "0.8rem", color: "var(--color-primary)" }}>{invitedFriends.length} selected</span>
                        </label>
                        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "40vh" }}>
                          {friends.length === 0 ? (
                            <p className="text-comet text-sm m-auto text-center" style={{ padding: "2rem 0" }}>You have no friends to invite yet.</p>
                          ) : (
                            friends.filter(f => !localCollaborators?.find((c: any) => c.user.id === f.id) && !pendingMembers.find((p: any) => p.id === f.id)).map(f => (
                              <label
                                key={f.id}
                                className="flex items-center rounded-full border bg-[var(--item-bg)] border-[var(--item-border)] hover:bg-[var(--glass-bg-hover)] cursor-pointer transition-colors group"
                                style={{ gap: "0.75rem", padding: "0.5rem 1.25rem 0.5rem 0.5rem", marginBottom: "0.5rem" }}
                              >
                                <div className="rounded-full bg-[var(--item-bg)] border border-[var(--item-border)] overflow-hidden relative flex-shrink-0" style={{ width: "40px", height: "40px" }}>
                                  {f.image ? <img src={f.image} alt={f.name} className="w-full h-full object-cover" /> : <span className="text-xs text-comet font-bold w-full h-full flex items-center justify-center">{(f.name || f.username || "?")[0].toUpperCase()}</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-comet truncate">{f.name || f.username}</p>
                                </div>
                                <div className="flex items-center justify-center w-5 h-5 rounded-full border transition-colors" style={{ borderColor: invitedFriends.includes(f.id) ? "var(--color-primary)" : "var(--item-border)", background: invitedFriends.includes(f.id) ? "var(--color-primary)" : "transparent" }}>
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

            {error && <p className="form-error" style={{ marginTop: "1rem" }}>{error}</p>}

            <div className="modal-actions" style={{
              padding: isMobile ? "1.5rem" : "0",
              position: isMobile ? "relative" : "absolute",
              bottom: isMobile ? "auto" : "1.5rem",
              left: isMobile ? "auto" : "1.5rem",
              right: isMobile ? "auto" : "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem"
            }}>
              {isMobile && (
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "0 0.5rem" }}>
                  <button type="button" className="btn btn-secondary btn-icon flex items-center justify-center" onClick={() => setMobilePage(p => Math.max(0, p - 1))} disabled={mobilePage === 0} style={{ width: "44px", height: "44px", background: "var(--color-primary)", opacity: mobilePage === 0 ? 0.5 : 1, border: "none", color: "white", fontSize: "16px", lineHeight: 1 }}>
                    <span style={{ marginTop: "1px", marginLeft: "-2px" }}>{"◀"}</span>
                  </button>
                  <button type="button" className="btn btn-secondary btn-icon flex items-center justify-center" onClick={() => setMobilePage(p => Math.min(rightPanelMode ? 2 : 1, p + 1))} disabled={mobilePage === (rightPanelMode ? 2 : 1)} style={{ width: "44px", height: "44px", background: "var(--color-primary)", opacity: mobilePage === (rightPanelMode ? 2 : 1) ? 0.5 : 1, border: "none", color: "white", fontSize: "16px", lineHeight: 1 }}>
                    <span style={{ marginTop: "1px", marginLeft: "2px" }}>{"▶"}</span>
                  </button>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                <button type="button" className="btn btn-secondary" onClick={handleClose} style={{ minWidth: "100px" }}>Cancel</button>
                <button
                  id="btn-save-sector"
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ minWidth: "120px" }}
                >
                  {loading ? <span className="spinner" /> : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* SECOND PANEL (Collab Members & Invite) */}
        <AnimatePresence>
          {!isMobile && rightPanelMode && (
            <motion.div
              className={`modal-panel ${isClosing ? "closing" : ""} glass`}
              style={{ maxWidth: "400px", margin: 0, display: "flex", flexDirection: "column", overflow: "hidden", height: "560px", maxHeight: "85vh" }}
              initial={{ opacity: 0, scale: 0.95, flex: "0 0 0px", marginLeft: 0 }}
              animate={{ opacity: 1, scale: 1, flex: "1 1 300px", marginLeft: "1rem" }}
              exit={{ opacity: 0, scale: 0.95, flex: "0 0 0px", marginLeft: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div style={{ minWidth: "300px", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                <div className="modal-header" style={{ paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: "1rem" }}>
                  <h3 className="modal-title flex items-center gap-2" style={{ fontSize: "1.1rem" }}>
                    {rightPanelMode === "members" ? (
                      <>Members <span className="text-xs rounded-full border flex items-center justify-center shrink-0" style={{ background: "var(--sector-active-bg)", borderColor: "var(--sector-active-border)", color: "var(--color-primary)", padding: "2px 8px", minWidth: "24px" }}>{(sectorOwner ? 1 : 0) + localCollaborators.length}</span></>
                    ) : "Invite Friends"}
                  </h3>
                  <button className="btn-icon modal-close" style={{ display: isMobile ? "flex" : "none" }} onClick={() => setRightPanelMode(null)} aria-label="Close">✕</button>
                </div>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.5rem", padding: "0 1.5rem 1.5rem 1.5rem" }}>

                  {/* Active Collaborators */}
                  {rightPanelMode === "members" && (
                    <div className="form-group" style={{ marginBottom: 0, flex: 1, display: "flex", flexDirection: "column" }}>
                      <motion.div
                        style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", paddingRight: "0.5rem" }}
                        initial="hidden" animate="visible"
                        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                      >

                        {/* Owner */}
                        {sectorOwner && (
                          <motion.div
                            className="flex items-center justify-between rounded-full border bg-[var(--item-bg)] border-[var(--item-border)] hover:bg-[var(--glass-bg-hover)] transition-colors group"
                            style={{ padding: "0.5rem 1rem 0.5rem 0.5rem", marginBottom: "0.5rem" }}
                            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="rounded-full bg-[var(--item-bg)] border border-[var(--item-border)] overflow-hidden relative flex-shrink-0" style={{ width: "40px", height: "40px" }}>
                                {sectorOwner.image ? <img src={sectorOwner.image} alt={sectorOwner.name ?? ""} className="w-full h-full object-cover" /> : <span className="text-xs text-comet font-bold w-full h-full flex items-center justify-center">{(sectorOwner.name || sectorOwner.username || "?")[0].toUpperCase()}</span>}
                              </div>
                              <p className="text-sm font-medium text-comet truncate">
                                {sectorOwner.name || sectorOwner.username}
                                {sectorOwner.id === currentUserId && <span className="opacity-50 ml-1"> (You)</span>}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest">Owner</span>
                          </motion.div>
                        )}

                        {/* Active Members */}
                        {localCollaborators?.map((c: any) => (
                          <motion.div
                            key={c.user.id}
                            className="flex items-center justify-between rounded-full border bg-[var(--item-bg)] border-[var(--item-border)] hover:bg-[var(--glass-bg-hover)] transition-colors group"
                            style={{ padding: "0.5rem 0.75rem 0.5rem 0.5rem", marginBottom: "0.5rem" }}
                            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="rounded-full bg-[var(--item-bg)] border border-[var(--item-border)] overflow-hidden relative flex-shrink-0" style={{ width: "40px", height: "40px" }}>
                                {c.user.image ? <img src={c.user.image} alt={c.user.name ?? ""} className="w-full h-full object-cover" /> : <span className="text-xs text-comet font-bold w-full h-full flex items-center justify-center">{(c.user.name || c.user.username || "?")[0].toUpperCase()}</span>}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <p className="text-sm font-medium text-comet truncate leading-tight">
                                  {c.user.name || c.user.username}
                                  {c.user.id === currentUserId && <span className="opacity-50 ml-1"> (You)</span>}
                                </p>
                                <span className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: c.role === 'ADMIN' ? '#10B981' : '#9CA3AF' }}>{c.role || 'MEMBER'}</span>
                              </div>
                            </div>
                            <div className="flex items-center transition-opacity" style={{ gap: "0.25rem" }}>
                              {currentUserId === sectorOwner?.id && (
                                <button type="button" onClick={() => setRoleAction({ id: c.user.id, type: c.role === "ADMIN" ? "demote" : "promote" })} className="flex items-center justify-center text-comet rounded-full transition-colors" style={{ width: "36px", height: "36px" }} title={c.role === "ADMIN" ? "Demote to Member" : "Promote to Admin"} onMouseEnter={(e) => { e.currentTarget.style.color = c.role === "ADMIN" ? "#fb923c" : "#10b981"; e.currentTarget.style.background = c.role === "ADMIN" ? "rgba(251,146,60,0.2)" : "rgba(16,185,129,0.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.background = "transparent"; }}>
                                  {c.role === "ADMIN" ? <ShieldExclamationIcon width={16} height={16} /> : <ShieldCheckIcon width={16} height={16} />}
                                </button>
                              )}
                              <button type="button" onClick={() => setTransferringTo(c.user.id)} className="flex items-center justify-center text-comet hover:text-violet-400 rounded-full hover:bg-violet-500/20 transition-colors" style={{ width: "36px", height: "36px" }} title="Transfer Ownership">
                                <DynamicIcon name="ArrowsRightLeftIcon" width={16} height={16} />
                              </button>
                              <button type="button" onClick={() => setRemovingMemberId(c.user.id)} className="flex items-center justify-center text-comet hover:text-pink-400 rounded-full hover:bg-pink-500/20 transition-colors" style={{ width: "36px", height: "36px" }} title="Remove Member">
                                <DynamicIcon name="UserMinusIcon" width={16} height={16} />
                              </button>
                            </div>
                          </motion.div>
                        ))}

                        {/* Pending Members */}
                        {pendingMembers.length > 0 && (
                          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                            <div className="text-[10px] font-bold text-comet uppercase tracking-widest pl-2" style={{ marginBottom: "1rem" }}>Pending Invites</div>
                            {pendingMembers.map((u: any) => (
                              <motion.div
                                key={u.id}
                                className="flex items-center justify-between rounded-full border bg-[var(--item-bg)] border-[var(--item-border)] transition-colors group opacity-60"
                                style={{ padding: "0.5rem 0.75rem 0.5rem 0.5rem", marginBottom: "0.5rem" }}
                                variants={{ hidden: { opacity: 0, y: -10 }, visible: { opacity: 0.6, y: 0 } }}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="rounded-full overflow-hidden relative flex-shrink-0" style={{ width: "40px", height: "40px", backgroundColor: "var(--color-border)" }}>
                                    {u.image ? <img src={u.image} alt={u.name ?? ""} className="w-full h-full object-cover grayscale" /> : <span className="text-xs text-comet font-bold w-full h-full flex items-center justify-center">{(u.name || u.username || "?")[0].toUpperCase()}</span>}
                                  </div>
                                  <p className="text-sm font-medium text-comet truncate">{u.name || u.username}</p>
                                </div>
                                <span className="text-[10px] font-bold text-comet uppercase tracking-widest px-2 py-1 rounded-md">Pending</span>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    </div>
                  )}

                  {/* Invite Friends */}
                  {rightPanelMode === "invite" && (
                    <div className="form-group" style={{ marginBottom: 0, flex: 1, display: "flex", flexDirection: "column" }}>
                      <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Select Friends</span>
                        <span style={{ fontSize: "0.8rem", color: "var(--color-primary)" }}>{invitedFriends.length} selected</span>
                      </label>
                      <motion.div
                        style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}
                        initial="hidden" animate="visible"
                        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                      >
                        {friends.length === 0 ? (
                          <p className="text-comet text-sm m-auto text-center" style={{ padding: "2rem 0" }}>You have no friends to invite yet.</p>
                        ) : (
                          friends.filter(f => !localCollaborators?.find((c: any) => c.user.id === f.id) && !pendingMembers.find((p: any) => p.id === f.id)).map(f => (
                            <motion.label
                              key={f.id}
                              className="flex items-center rounded-full border bg-[var(--item-bg)] border-[var(--item-border)] hover:bg-[var(--glass-bg-hover)] cursor-pointer transition-colors group"
                              style={{ gap: "0.75rem", padding: "0.5rem 1.25rem 0.5rem 0.5rem", marginBottom: "0.5rem" }}
                              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                            >
                              <div className="rounded-full overflow-hidden relative flex-shrink-0" style={{ width: "40px", height: "40px", backgroundColor: "var(--color-border)" }}>
                                {f.image ? <img src={f.image} alt={f.name} className="w-full h-full object-cover" /> : <span className="text-xs text-comet font-bold w-full h-full flex items-center justify-center">{(f.name || f.username || "?")[0].toUpperCase()}</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-comet truncate">{f.name || f.username}</p>
                              </div>
                              <div className="flex items-center justify-center w-5 h-5 rounded-full border transition-colors" style={{ borderColor: invitedFriends.includes(f.id) ? "var(--color-violet-mid)" : "var(--color-border)", background: invitedFriends.includes(f.id) ? "var(--color-violet-mid)" : "transparent" }}>
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
                            </motion.label>
                          ))
                        )}
                      </motion.div>
                    </div>
                  )}

                </div>

                {/* Right panel save button */}
                <div style={{ padding: "1rem 1.5rem 1.5rem", borderTop: "1px solid var(--glass-border)", background: "var(--glass-bg)", backdropFilter: "blur(10px)" }}>
                  <button type="button" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setRightPanelMode(null)}>
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {(removingMemberId || transferringTo) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center backdrop-blur-sm"
            onClick={(e) => { e.stopPropagation(); setRemovingMemberId(null); setTransferringTo(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-cosmos border border-border shadow-2xl relative overflow-hidden flex flex-col"
              style={{ borderRadius: isMobile ? "1.5rem" : "2rem", maxWidth: "24rem", width: isMobile ? "90%" : "100%", padding: isMobile ? "1.5rem" : "2.5rem" }}
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
              <div className="text-center text-starlight" style={{ marginBottom: "2rem" }}>
                <h4 className="text-2xl font-bold tracking-tight" style={{ marginBottom: "1rem" }}>{removingMemberId ? "Remove Member?" : "Transfer Ownership?"}</h4>
                <p className="text-sm text-comet leading-relaxed px-2">
                  {removingMemberId
                    ? "Are you sure you want to remove this member from the collaboration?"
                    : "You will lose ownership of this sector and become a regular collaborator. This action cannot be undone."}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex" style={{ gap: "1rem" }}>
                <button type="button" className="flex-1 bg-starlight/5 hover:bg-starlight/10 text-starlight rounded-2xl transition-all font-medium text-sm border border-border" style={{ padding: "0.75rem 0" }} onClick={() => { setRemovingMemberId(null); setTransferringTo(null); }}>Cancel</button>
                <button type="button" className={`flex-1 text-white rounded-2xl transition-all font-medium text-sm shadow-xl ${removingMemberId ? "bg-rose-600 hover:bg-rose-700 shadow-pink-500/20" : "bg-violet-500 hover:bg-violet-600 shadow-violet-500/20"}`} style={{ padding: "0.75rem 0" }} onClick={async () => {
                  if (removingMemberId) {
                    const id = removingMemberId; setRemovingMemberId(null);
                    const result = await removeCollaborator(sector.id, id);
                    if (result?.error) {
                      toast.error(result.error);
                    } else {
                      toast.success("Member removed from sector");
                      setLocalCollaborators(prev => prev.filter((c: any) => c.user.id !== id));
                    }
                  } else {
                    const id = transferringTo; setTransferringTo(null);
                    const result = await sendTransferOwnershipInvite(sector.id, id!);
                    if (result?.error) {
                      toast.error(result.error);
                    } else {
                      toast.success("Ownership transfer request sent");
                    }
                  }
                }}>
                  {removingMemberId ? "Remove" : "Transfer"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {roleAction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); setRoleAction(null); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="bg-cosmos border border-border shadow-2xl relative overflow-hidden flex flex-col" style={{ borderRadius: isMobile ? "1.5rem" : "2rem", maxWidth: "24rem", width: isMobile ? "90%" : "100%", padding: isMobile ? "1.5rem" : "2.5rem" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: roleAction.type === "promote" ? "linear-gradient(90deg, transparent, #10b981, transparent)" : "linear-gradient(90deg, transparent, #fb923c, transparent)" }}></div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem", marginTop: "0.5rem" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: roleAction.type === "promote" ? "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)" : "radial-gradient(circle, rgba(251,146,60,0.15) 0%, transparent 70%)", border: roleAction.type === "promote" ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(251,146,60,0.2)" }}>
                  {roleAction.type === "promote" ? <ShieldCheckIcon width={32} height={32} style={{ color: "#10b981", filter: "drop-shadow(0 0 12px rgba(16,185,129,0.6))" }} /> : <ShieldExclamationIcon width={32} height={32} style={{ color: "#fb923c", filter: "drop-shadow(0 0 12px rgba(251,146,60,0.6))" }} />}
                </div>
              </div>
              <div className="text-center text-starlight" style={{ marginBottom: "2rem" }}>
                <h4 className="text-2xl font-bold tracking-tight" style={{ marginBottom: "1rem" }}>{roleAction.type === "promote" ? "Promote to Admin?" : "Demote to Member?"}</h4>
                <p className="text-sm text-comet leading-relaxed px-2">{roleAction.type === "promote" ? "This member will be able to add, edit, and delete beacons in this sector." : "This member will lose their admin privileges and become a regular member."}</p>
              </div>
              <div className="flex" style={{ gap: "1rem" }}>
                <button type="button" className="flex-1 bg-starlight/5 hover:bg-starlight/10 text-starlight rounded-2xl transition-all font-medium text-sm border border-border" style={{ padding: "0.75rem 0" }} onClick={() => setRoleAction(null)}>Cancel</button>
                <button type="button" className={`flex-1 text-white rounded-2xl transition-all font-medium text-sm shadow-xl ${roleAction.type === "promote" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"}`} style={{ padding: "0.75rem 0" }} onClick={async () => {
                  const id = roleAction.id;
                  const newRole = roleAction.type === "promote" ? "ADMIN" : "MEMBER";
                  setRoleAction(null);

                  const result = await setCollabRole(sector.id, id, newRole);
                  if (result?.error) toast.error(result.error);
                  else {
                    toast.success(roleAction.type === "promote" ? "Promoted to Admin" : "Demoted to Member");
                    setLocalCollaborators(prev => prev.map((c: any) => c.user.id === id ? { ...c, role: newRole } : c));
                    window.dispatchEvent(new CustomEvent('role-updated-global', { detail: { sectorId: sector.id, userId: id, role: newRole } }));
                  }
                }}>
                  {roleAction.type === "promote" ? "Promote" : "Demote"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}






"use client";

import { useState, useEffect } from "react";
import { createSector, getFriends } from "@/lib/actions";
import type { SectorWithBeacons, Beacon } from "@/types";
import { toast } from "sonner";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";

type Props = {
  onClose: () => void;
  onCreated: (sector: SectorWithBeacons) => void;
};

import { DynamicIcon, ICON_OPTIONS } from "@/components/dynamic-icon";

const COLOR_OPTIONS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#7c6bff", "#a855f7", "#ec4899",
];

function CustomColorPicker({ color, setColor, isSelected }: { color: string, setColor: (c: string) => void, isSelected: boolean }) {
  const [localColor, setLocalColor] = useState(color && !COLOR_OPTIONS.includes(color) ? color : "#ffffff");
  
  useEffect(() => {
    if (color && !COLOR_OPTIONS.includes(color)) setLocalColor(color);
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

export default function AddSectorModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("FolderIcon");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [isPublic, setIsPublic] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<{name?: string}>({});
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => { setIsClosing(true); setTimeout(onClose, 200); };
  const [error, setError] = useState<string | null>(null);
  const [mobilePage, setMobilePage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    getFriends().then(setFriends);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setFormErrors({ name: "Sector Name is required." });
      return;
    }
    setLoading(true);
    setError(null);
    const result = await createSector({ 
      name, icon, color, isPublic, 
      invitedFriendIds: !isPublic ? invitedFriends : undefined 
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      toast.error(result.error || "Failed to create sector");
    } else if (result.data) {
      toast.success(`Sector "${result.data.name}" created successfully`);
      onCreated({ ...result.data, beacons: [] });
    }
  }

  return (
    <div
      className={`modal-overlay ${isClosing ? "closing" : ""}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Add Sector"
      style={{
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? "0" : "2rem",
        overflowY: isMobile ? "hidden" : "auto",
      }}
    >
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
          overflowY: "auto",
          transform: isMobile ? "none" : undefined,
        }}
      >
        <div className="modal-header">
          <h2 className="modal-title">New Sector</h2>
          {!showInvite && (
            <button type="button" className="btn-icon modal-close" onClick={handleClose} aria-label="Close"><XMarkIcon width={18} height={18} /></button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="modal-form" style={{ display: "flex", flexDirection: "column", overflowX: isMobile ? "hidden" : "visible", padding: isMobile ? "1.25rem 0 1.5rem" : undefined }}>
          <div style={{ 
            display: "flex", 
            gap: isMobile ? "0" : "2rem", 
            flexDirection: "row",
            transform: isMobile ? `translateX(-${mobilePage * 100}%)` : "none",
            transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            width: isMobile ? "100%" : "auto",
            paddingBottom: isMobile ? "0" : "60px"
          }}>
          {/* Left Section */}
          <div style={{ flex: isMobile ? "0 0 100%" : 1, width: isMobile ? "100%" : "auto", padding: isMobile ? "0 1.5rem" : 0, minWidth: isMobile ? "100%" : "250px", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="sector-name">Sector Name</label>
            <input
              id="sector-name"
              className="input"
              type="text"
              placeholder="e.g. Design Tools"
              value={name}
              onChange={(e) => { setName(e.target.value); setFormErrors({}); }}
              autoFocus
              maxLength={40}
            />
            {formErrors.name && <span className="text-red-500 text-xs mt-1 block">{formErrors.name}</span>}
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
                  style={{ backgroundColor: c, flexShrink: 0 }}
                  onClick={() => setColor(c)}
                  aria-label={c}
                />
              ))}
              <CustomColorPicker color={color} setColor={setColor} isSelected={color !== "" && !COLOR_OPTIONS.includes(color)} />
            </div>
          </div>

          </div>

          {/* Right Section */}
          <div style={{ flex: isMobile ? "0 0 100%" : 1, width: isMobile ? "100%" : "auto", padding: isMobile ? "0 1.5rem" : 0, minWidth: isMobile ? "100%" : "250px", display: "flex", flexDirection: "column", gap: "1rem" }}>
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
                    onClick={() => {
                      setShowInvite(!showInvite);
                      if (!showInvite && isMobile) setMobilePage(2);
                    }}
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

          {/* Mobile Expanded Invite Panel (Rendered inline on mobile) */}
          {isMobile && showInvite && !isPublic && (
            <div style={{ flex: "0 0 100%", width: "100%", padding: "0 1.5rem", minWidth: "100%" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", height: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-starlight)" }}>Invite Friends</h3>
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: 1, display: "flex", flexDirection: "column" }}>
                  <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Select Friends</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-violet-glow)" }}>{invitedFriends.length} selected</span>
                  </label>
                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "40vh" }}>
                  {friends.length === 0 ? (
                    <p className="text-gray-400 text-sm m-auto text-center" style={{ padding: "2rem 0" }}>You have no friends to invite yet.</p>
                  ) : (
                    friends.map(f => (
                      <label 
                        key={f.id} 
                        className="flex items-center rounded-full border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-colors group" 
                        style={{ gap: "0.75rem", padding: "0.5rem 1.25rem 0.5rem 0.5rem", marginBottom: "0.5rem" }}
                      >
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
                            if (e.target.checked) setInvitedFriends(p => [...p, f.id]);
                            else setInvitedFriends(p => p.filter(id => id !== f.id));
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

          {error && <p className="form-error" style={{ margin: "1rem 1.5rem 0" }}>{error}</p>}
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
                <button type="button" className="btn btn-secondary btn-icon flex items-center justify-center" onClick={() => setMobilePage(p => Math.max(0, p - 1))} disabled={mobilePage === 0} style={{ width: "44px", height: "44px", background: "var(--color-violet-glow)", opacity: mobilePage === 0 ? 0.5 : 1, border: "none", color: "white", fontSize: "16px", lineHeight: 1 }}>
                  <span style={{ marginTop: "1px", marginLeft: "-2px" }}>{"◀"}</span>
                </button>
                <button type="button" className="btn btn-secondary btn-icon flex items-center justify-center" onClick={() => setMobilePage(p => Math.min((showInvite && !isPublic) ? 2 : 1, p + 1))} disabled={mobilePage === ((showInvite && !isPublic) ? 2 : 1)} style={{ width: "44px", height: "44px", background: "var(--color-violet-glow)", opacity: mobilePage === ((showInvite && !isPublic) ? 2 : 1) ? 0.5 : 1, border: "none", color: "white", fontSize: "16px", lineHeight: 1 }}>
                  <span style={{ marginTop: "1px", marginLeft: "2px" }}>{"▶"}</span>
                </button>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
              <button type="button" className="btn btn-secondary" onClick={handleClose} style={{ minWidth: "100px" }}>Cancel</button>
              <button id="btn-create-sector" type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: "120px" }}>
                {loading ? <span className="spinner" /> : "Create Sector"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* SECOND PANEL */}
      <AnimatePresence>
        {!isMobile && showInvite && !isPublic && (
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
              <h3 className="modal-title" style={{ fontSize: "1.1rem" }}>Invite Friends</h3>
              <button className="btn-icon modal-close" style={{ display: isMobile ? "flex" : "none" }} onClick={() => setShowInvite(false)} aria-label="Close"><XMarkIcon width={18} height={18} /></button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.5rem", padding: "0 1.5rem 1.5rem 1.5rem" }}>
              <div className="form-group" style={{ marginBottom: 0, flex: 1, display: "flex", flexDirection: "column" }}>
                <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Select Friends</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-violet-glow)" }}>{invitedFriends.length} selected</span>
                </label>
                <motion.div 
                  style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}
                  initial="hidden" animate="visible"
                  variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                >
                {friends.length === 0 ? (
                  <p className="text-gray-400 text-sm m-auto text-center" style={{ padding: "2rem 0" }}>You have no friends to invite yet.</p>
                ) : (
                  friends.map(f => (
                    <motion.label 
                      key={f.id} 
                      className="flex items-center rounded-full border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-colors group" 
                      style={{ gap: "0.75rem", padding: "0.5rem 1.25rem 0.5rem 0.5rem", marginBottom: "0.5rem" }}
                      variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                    >
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
                    </motion.label>
                  ))
                )}
                </motion.div>
              </div>
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}


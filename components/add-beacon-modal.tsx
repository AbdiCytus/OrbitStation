"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { createBeacon } from "@/lib/actions";
import { useMetaFetcher } from "@/hooks/use-meta-fetcher";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import type { Beacon, SectorWithBeacons } from "@/types";
import { toast } from "sonner";

type Props = {
  sectors: SectorWithBeacons[];
  initialSectorId?: string;
  onClose: () => void;
  onCreated: (beacon: Beacon) => void;
  currentStationId?: string;
};

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  // Already has a protocol
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Has // but no protocol
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

export default function AddBeaconModal({ sectors, initialSectorId, onClose, onCreated, currentStationId }: Props) {
  const [sectorId, setSectorId] = useState(initialSectorId ?? sectors[0]?.id ?? "");
  const [urlRaw, setUrlRaw] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [customFaviconUrl, setCustomFaviconUrl] = useState("");

  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => { setIsClosing(true); setTimeout(onClose, 200); };
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ url?: string, title?: string, sector?: string }>({});
  const [showImageEdit, setShowImageEdit] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: meta, loading: metaLoading, fetchMeta } = useMetaFetcher();

  // Auto-fill from scraped meta
  useEffect(() => {
    if (meta) {
      if (!title) setTitle(meta.title ?? "");
      if (!description) setDescription(meta.description ?? "");
      if (meta.imageUrl) setCustomImageUrl(meta.imageUrl);
      if (meta.faviconUrl) setCustomFaviconUrl(meta.faviconUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta]);

  // Lock body scroll + focus on mount
  useEffect(() => {
    document.body.style.overflow = "hidden";
    setTimeout(() => inputRef.current?.focus(), 50);
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast.error("Icon size must be less than 500KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setCustomFaviconUrl(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { // 2MB for banner
      toast.error("Banner image size must be less than 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setCustomImageUrl(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  async function handleUrlBlur() {
    let normalized = urlRaw;
    const autoHttps = localStorage.getItem("os_auto_https") !== "false";
    
    if (autoHttps) {
      normalized = normalizeUrl(urlRaw);
      if (normalized !== urlRaw) setUrlRaw(normalized);
    }
    
    const autoFetchMeta = localStorage.getItem("os_auto_fetch_meta") !== "false";
    if (autoFetchMeta && normalized.length > 8 && normalized.includes(".")) {
      await fetchMeta(normalized);
    }
  }

  function handleUrlChange(value: string) {
    const autoHttps = localStorage.getItem("os_auto_https") !== "false";
    if (autoHttps) {
      const cleaned = value.replace(/^(https?:\/\/)+/, "");
      setUrlRaw(cleaned);
    } else {
      setUrlRaw(value);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const autoHttps = localStorage.getItem("os_auto_https") !== "false";
    const finalUrl = autoHttps ? normalizeUrl(urlRaw) : (urlRaw.trim() || urlRaw);
    
    const errors: { url?: string, title?: string, sector?: string } = {};
    if (!finalUrl || (autoHttps && finalUrl === "https://")) errors.url = "URL is required.";
    if (!title.trim()) errors.title = "Title is required.";
    if (!sectorId) errors.sector = "Sector is required.";

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setError(null);

    const result = await createBeacon(sectorId, {
      url: finalUrl,
      title,
      description: description || undefined,
      imageUrl: customImageUrl || undefined,
      faviconUrl: customFaviconUrl || undefined,
      notes: notes || undefined,
    });

    setLoading(false);
    if (result.error) {
      setError(result.error);
      toast.error(result.error || "Failed to create beacon");
    } else if (result.data) {
      toast.success("Beacon added successfully");
      onCreated(result.data);
    }
  }

  const displayImageUrl = customImageUrl;
  const displayFaviconUrl = customFaviconUrl;
  const hasMetadata = !!(meta || title);

  return (
    <div className={`modal-overlay ${isClosing ? "closing" : ""}`} onClick={handleClose} role="dialog" aria-modal="true" aria-label="Add Beacon">
      <div className={`modal-panel ${isClosing ? "closing" : ""}  modal-panel-wide glass`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Launch New Beacon</h2>
          <button className="btn-icon modal-close" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-grid">
          <div className="modal-col">
            <div className="form-group">
              <label className="form-label" htmlFor="beacon-sector">Sector</label>
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  id="beacon-sector"
                  className="input"
                  style={{ textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", ...(initialSectorId ? { backgroundColor: "rgba(15, 15, 25, 0.4)", color: "#a1a1aa", cursor: "not-allowed", opacity: 0.8 } : {}) }}
                  onClick={() => !initialSectorId && setIsSectorDropdownOpen(!isSectorDropdownOpen)}
                >
                  {sectors.find(s => s.id === sectorId)?.name || "Select a sector"}
                  <ChevronDownIcon width={16} height={16} style={{ color: "var(--color-comet)", transition: "transform 0.2s", transform: isSectorDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                </button>
                {isSectorDropdownOpen && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setIsSectorDropdownOpen(false)} />
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "0.25rem", background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", zIndex: 100, overflow: "hidden", overflowY: "auto", maxHeight: "200px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                      {sectors.map((s, index) => {
                        const isOwned = currentStationId ? (s as any).stationId === currentStationId : true;
                        const prevIsOwned = index > 0 && currentStationId ? (sectors[index - 1] as any).stationId === currentStationId : true;

                        const showMySectorsHeader = index === 0 && isOwned;
                        const showCollabSectorsHeader = (!isOwned && prevIsOwned) || (index === 0 && !isOwned);

                        return (
                          <div key={s.id}>
                            {showMySectorsHeader && (
                              <div style={{ padding: "0.4rem 1rem", fontSize: "0.7rem", color: "#a1a1aa", background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(255,255,255,0.05)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "bold" }}>
                                My Sectors
                              </div>
                            )}
                            {showCollabSectorsHeader && (
                              <div style={{ padding: "0.4rem 1rem", fontSize: "0.7rem", color: "#a1a1aa", background: "rgba(0,0,0,0.3)", borderTop: index > 0 ? "1px solid rgba(255,255,255,0.05)" : "none", borderBottom: "1px solid rgba(255,255,255,0.05)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "bold" }}>
                                Collab Sectors
                              </div>
                            )}
                            <div
                              className="dropdown-option-btn hover:bg-white/5"
                              style={{ padding: "0.6rem 1rem", paddingLeft: "1.5rem", cursor: "pointer", color: s.id === sectorId ? "#a78bfa" : "#fff", background: s.id === sectorId ? "rgba(139, 92, 246, 0.2)" : "transparent", transition: "all 0.2s" }}
                              onClick={() => { setSectorId(s.id); setIsSectorDropdownOpen(false); }}
                            >
                              {s.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              {formErrors.sector && <span className="text-red-500 text-xs mt-1 block">{formErrors.sector}</span>}
            </div>

            {/* URL with auto-prefix */}
            <div className="form-group">
              <label className="form-label" htmlFor="beacon-url">
                URL
                {metaLoading && <span className="form-label-hint">⟳ Fetching metadata…</span>}
                {meta && !metaLoading && <span className="form-label-hint form-label-ok">✓ Metadata loaded</span>}
              </label>
              <div className="url-input-wrap" style={{ display: "flex", alignItems: "center", background: "rgba(17, 24, 39, 0.8)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", overflow: "hidden", transition: "all var(--transition-fast)" }}>
                {(() => {
                  const autoHttps = typeof window !== "undefined" && localStorage.getItem("os_auto_https") !== "false";
                  return autoHttps ? <span style={{ padding: "0 0.5rem 0 1rem", color: "var(--color-comet)", fontSize: "0.9rem", userSelect: "none" }}>https://</span> : null;
                })()}
                <input
                  ref={inputRef}
                  id="beacon-url"
                  type="text"
                  placeholder="example.com"
                  value={urlRaw}
                  onChange={(e) => { handleUrlChange(e.target.value); setFormErrors(p => ({ ...p, url: undefined })); }}
                  onBlur={handleUrlBlur}
                  style={{ border: "none", borderRadius: 0, flex: 1, outline: "none", boxShadow: "none", background: "transparent", color: "var(--color-starlight)", fontFamily: "var(--font-sans)", fontSize: "0.9rem", padding: "0.625rem 1rem 0.625rem 0" }}
                />
              </div>
              {formErrors.url && <span className="text-red-500 text-xs mt-1 block">{formErrors.url}</span>}
            </div>

            {/* Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="beacon-title">Title</label>
              <input
                id="beacon-title"
                className="input"
                type="text"
                placeholder="Beacon title"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setFormErrors(p => ({ ...p, title: undefined })); }}
                maxLength={100}
              />
              {formErrors.title && <span className="text-red-500 text-xs mt-1 block">{formErrors.title}</span>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="beacon-desc">
                Description <span className="optional">(optional)</span>
              </label>
              <input
                id="beacon-desc"
                className="input"
                type="text"
                placeholder="Short description of this site"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
              />
            </div>
          </div>

          <div className="modal-col">
            {/* Metadata preview */}
            {hasMetadata && (
              <div className="beacon-meta-preview">
                <div className="favicon-preview-wrap">
                  <div className="favicon-preview-label">Icon</div>
                  <div className="favicon-preview-box">
                    {displayFaviconUrl ? (
                      <img
                        src={displayFaviconUrl}
                        alt="Favicon"
                        width={32}
                        height={32}
                        className="favicon-preview-img"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }}
                      />
                    ) : (
                      <div className="favicon-preview-empty">🌐</div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.25rem" }}>
                    <input
                      className="input input-sm"
                      type="url"
                      placeholder="Favicon URL"
                      value={customFaviconUrl}
                      onChange={(e) => setCustomFaviconUrl(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <label className="btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", borderRadius: "4px" }}>
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleFaviconUpload}
                      />
                    </label>
                  </div>
                </div>

                <div className="og-preview-wrap">
                  <div className="og-preview-label-row">
                    <span className="favicon-preview-label">Banner Image</span>
                    <button
                      type="button"
                      className="btn-text"
                      onClick={() => setShowImageEdit((v) => !v)}
                    >
                      {showImageEdit ? "Hide" : "Edit URL"}
                    </button>
                  </div>
                  {displayImageUrl ? (
                    <div className="beacon-preview-image">
                      <img
                        src={displayImageUrl}
                        alt="OG Preview"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  ) : (
                    <div className="beacon-preview-empty">No banner image found</div>
                  )}
                  {showImageEdit && (
                    <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.25rem" }}>
                      <input
                        className="input input-sm"
                        type="url"
                        placeholder="https://example.com/og.png"
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <label className="btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", borderRadius: "4px" }}>
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleBannerUpload}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="form-group">
              <label className="form-label" htmlFor="beacon-notes">
                Pilot Notes <span className="optional">(optional)</span>
              </label>
              <textarea
                id="beacon-notes"
                className="input"
                placeholder="Why did you save this? Any personal notes…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                maxLength={500}
              />
            </div>
          </div>
        </form>

        <div className="modal-actions" style={{ padding: "0 1.5rem 1.5rem" }}>
          {error && <p className="form-error" style={{ marginRight: "auto" }}>{error}</p>}
          <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Launching..." : "Launch Beacon"}
          </button>
        </div>
      </div>
    </div>
  );
}


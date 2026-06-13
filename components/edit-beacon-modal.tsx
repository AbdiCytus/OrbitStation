"use client";

import { useState, useRef, useEffect } from "react";
import { updateBeacon, deleteBeacon } from "@/lib/actions";
import { useMetaFetcher } from "@/hooks/use-meta-fetcher";
import type { Beacon, SectorWithBeacons } from "@/types";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { toast } from "sonner";
import { DynamicIcon } from "@/components/dynamic-icon";

type Props = {
  beacon: Beacon;
  sectors: SectorWithBeacons[];
  onClose: () => void;
  onUpdated: (beacon: Beacon) => void;
  onDeleted: (id: string) => void;
};

export default function EditBeaconModal({ beacon, sectors, onClose, onUpdated, onDeleted }: Props) {
  const [sectorId, setSectorId] = useState(beacon.sectorId);
  const [url, setUrl] = useState(beacon.url.replace(/^https?:\/\//, ""));
  const [title, setTitle] = useState(beacon.title);
  const [description, setDescription] = useState(beacon.description ?? "");
  const [imageUrl, setImageUrl] = useState(beacon.imageUrl ?? "");
  const [faviconUrl, setFaviconUrl] = useState(beacon.faviconUrl || "");
  const [notes, setNotes] = useState(beacon.notes || "");
  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => { setIsClosing(true); setTimeout(onClose, 200); };
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{url?: string, title?: string}>({});

  const { data: meta, loading: metaLoading, fetchMeta } = useMetaFetcher();

  useEffect(() => {
    if (meta) {
      setTitle(meta.title ?? title);
      setDescription(meta.description ?? description);
      if (meta.imageUrl) setImageUrl(meta.imageUrl);
      if (meta.faviconUrl) setFaviconUrl(meta.faviconUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta]);

  function normalizeUrl(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith("//")) return `https:${trimmed}`;
    return `https://${trimmed}`;
  }

  async function handleUrlBlur() {
    const normalized = normalizeUrl(url);
    const cleaned = normalized.replace(/^https?:\/\//, "");
    if (cleaned !== url) setUrl(cleaned);
    if (normalized.length > 8 && normalized.includes(".")) {
      await fetchMeta(normalized);
    }
  }

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", fn);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", fn);
    };
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
        setFaviconUrl(ev.target.result as string);
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
        setImageUrl(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const finalUrl = (url.trim().startsWith("http://") || url.trim().startsWith("https://")) ? url.trim() : "https://" + url.trim();
    const errors: {url?: string, title?: string} = {};
    if (!url.trim()) errors.url = "URL is required.";
    if (!title.trim()) errors.title = "Title is required.";
    
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setError(null);
    const result = await updateBeacon(beacon.id, {
      sectorId,
      url: finalUrl,
      title,
      description,
      imageUrl,
      faviconUrl,
      notes,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      toast.error(result.error || "Failed to update beacon");
    } else if (result.data) {
      toast.success("Beacon updated successfully");
      onUpdated(result.data);
    }
  }

  async function handleDelete() {
    const result = await deleteBeacon(beacon.id);
    if (result.error) {
      toast.error(result.error || "Failed to delete beacon");
    } else {
      toast.success("Beacon deleted successfully");
      onDeleted(beacon.id);
    }
  }

  const domain = (() => {
    try { return new URL(beacon.url).hostname.replace("www.", ""); }
    catch { return beacon.url; }
  })();

  return (
    <div className={`modal-overlay ${isClosing ? "closing" : ""}`} onClick={handleClose} role="dialog" aria-modal="true" aria-label="Edit Beacon">
      <div className={`modal-panel ${isClosing ? "closing" : ""}  modal-panel-wide glass`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Beacon</h2>
          <button className="btn-icon modal-close" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSave} className="modal-form-grid">
          <div className="modal-col">
            {/* Sector selector */}
            <div className="form-group">
              <label className="form-label" htmlFor="edit-beacon-sector">Sector</label>
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  id="edit-beacon-sector"
                  className="input"
                  style={{ textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onClick={() => setIsSectorDropdownOpen(!isSectorDropdownOpen)}
                >
                  {sectors.find(s => s.id === sectorId)?.name || "Select a sector"}
                  <ChevronDownIcon width={16} height={16} style={{ color: "var(--color-comet)", transition: "transform 0.2s", transform: isSectorDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                </button>
                {isSectorDropdownOpen && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setIsSectorDropdownOpen(false)} />
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "0.25rem", background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", zIndex: 100, overflow: "hidden", overflowY: "auto", maxHeight: "200px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                      {sectors.map((s) => (
                        <div
                          key={s.id}
                          className="dropdown-option-btn hover:bg-white/5"
                          style={{ padding: "0.6rem 1rem", cursor: "pointer", color: s.id === sectorId ? "#a78bfa" : "#fff", background: s.id === sectorId ? "rgba(139, 92, 246, 0.2)" : "transparent", transition: "all 0.2s" }}
                          onClick={() => { setSectorId(s.id); setIsSectorDropdownOpen(false); }}
                        >
                          {s.name}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-beacon-url">
              URL
              {metaLoading && <span className="form-label-hint">⟳ Fetching metadata…</span>}
              {meta && !metaLoading && <span className="form-label-hint form-label-ok">✓ Metadata loaded</span>}
            </label>
            <div className="url-input-wrap" style={{ display: "flex", alignItems: "center", background: "rgba(17, 24, 39, 0.8)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", overflow: "hidden", transition: "all var(--transition-fast)" }}>
              <span style={{ padding: "0 0.5rem 0 1rem", color: "var(--color-comet)", fontSize: "0.9rem", userSelect: "none" }}>https://</span>
              <input
                id="edit-beacon-url"
                className="input input-url"
                type="text"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setFormErrors(p => ({...p, url: undefined})); }}
                onBlur={handleUrlBlur}
                placeholder="example.com"
                style={{ border: "none", background: "transparent", paddingLeft: "0", flex: 1 }}
              />
            </div>
            {formErrors.url && <span className="text-red-500 text-xs mt-1 block">{formErrors.url}</span>}
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="edit-beacon-title">Title</label>
            <input
              id="edit-beacon-title"
              className="input"
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setFormErrors(p => ({...p, title: undefined})); }}
              maxLength={100}
              autoFocus
            />
            {formErrors.title && <span className="text-red-500 text-xs mt-1 block">{formErrors.title}</span>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description <span className="optional">(optional)</span></label>
            <input
              className="input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              placeholder="Short description"
            />
          </div>
        </div>

        <div className="modal-col">
          {/* Banner preview + edit */}
          <div className="form-group">
            <label className="form-label">Banner Image</label>
            {imageUrl && (
              <div className="beacon-preview-image" style={{ marginBottom: "0.5rem" }}>
                <img src={imageUrl} alt="OG Preview"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            )}
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                className="input input-sm"
                type="url"
                placeholder="https://example.com/og.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
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
          </div>

          {/* Favicon */}
          <div className="form-group">
            <label className="form-label">Favicon URL</label>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              {faviconUrl && (
                <img src={faviconUrl} alt="" width={24} height={24}
                  style={{ borderRadius: 4, flexShrink: 0 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
              <input
                className="input input-sm"
                type="url"
                placeholder="https://example.com/favicon.ico"
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
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

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Pilot Notes <span className="optional">(optional)</span></label>
            <textarea
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Your personal notes about this site"
            />
          </div>
        </div>
      </form>

      <div className="modal-actions" style={{ padding: "0 1.5rem 1.5rem" }}>
        {error && <p className="form-error" style={{ marginRight: "auto" }}>{error}</p>}
        <div style={{ display: "flex", gap: "0.75rem", marginLeft: "auto" }}>
          <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
          <button
            id="btn-save-beacon"
            type="button"
            onClick={handleSave}
            className="btn btn-primary"
            disabled={loading}
          >
              {loading ? <span className="spinner" /> : "Save Changes"}
            </button>
        </div>
      </div>
      </div>
    </div>
  );
}

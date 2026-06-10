"use client";

import { useState, useEffect, useRef } from "react";
import { createBeacon } from "@/lib/actions";
import { useMetaFetcher } from "@/hooks/use-meta-fetcher";
import type { Beacon, SectorWithBeacons } from "@/types";

type Props = {
  sectors: SectorWithBeacons[];
  defaultSectorId?: string;
  onClose: () => void;
  onCreated: (beacon: Beacon) => void;
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

export default function AddBeaconModal({ sectors, defaultSectorId, onClose, onCreated }: Props) {
  const [sectorId, setSectorId] = useState(defaultSectorId ?? sectors[0]?.id ?? "");
  const [urlRaw, setUrlRaw] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [customFaviconUrl, setCustomFaviconUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => { setIsClosing(true); setTimeout(onClose, 200); };
  const [error, setError] = useState<string | null>(null);
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
      alert("Icon size must be less than 500KB.");
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
      alert("Banner image size must be less than 2MB.");
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
    const normalized = normalizeUrl(urlRaw);
    if (normalized !== urlRaw) setUrlRaw(normalized);
    if (normalized.length > 8 && normalized.includes(".")) {
      await fetchMeta(normalized);
    }
  }

  function handleUrlChange(value: string) {
    const cleaned = value.replace(/^(https?:\/\/)+/, "");
    setUrlRaw(cleaned);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalUrl = normalizeUrl(urlRaw);
    if (!finalUrl || finalUrl === "https://" || !title.trim() || !sectorId) return;
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
    } else if (result.data) {
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
            {/* Sector selector */}
            <div className="form-group">
              <label className="form-label" htmlFor="beacon-sector">Sector</label>
              <select
                id="beacon-sector"
                className="input"
                value={sectorId}
                onChange={(e) => setSectorId(e.target.value)}
                required
              >
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* URL with auto-prefix */}
            <div className="form-group">
              <label className="form-label" htmlFor="beacon-url">
                URL
                {metaLoading && <span className="form-label-hint">⟳ Fetching metadata…</span>}
                {meta && !metaLoading && <span className="form-label-hint form-label-ok">✓ Metadata loaded</span>}
              </label>
              <div className="url-input-wrap" style={{ display: "flex", alignItems: "center", background: "rgba(17, 24, 39, 0.8)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", overflow: "hidden", transition: "all var(--transition-fast)" }}>
                <span style={{ padding: "0 0.5rem 0 1rem", color: "var(--color-comet)", fontSize: "0.9rem", userSelect: "none" }}>https://</span>
                <input
                  ref={inputRef}
                  id="beacon-url"
                  type="text"
                  placeholder="example.com"
                  value={urlRaw}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  onBlur={handleUrlBlur}
                  required
                  style={{ border: "none", borderRadius: 0, flex: 1, outline: "none", boxShadow: "none", background: "transparent", color: "var(--color-starlight)", fontFamily: "var(--font-sans)", fontSize: "0.9rem", padding: "0.625rem 1rem 0.625rem 0" }}
                />
              </div>
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
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={100}
              />
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
            disabled={loading || !title.trim() || !sectorId || !urlRaw.trim()}
          >
            {loading ? "Launching..." : "Launch Beacon"}
          </button>
        </div>
      </div>
    </div>
  );
}


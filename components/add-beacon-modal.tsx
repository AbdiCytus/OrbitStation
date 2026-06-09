"use client";

import { useState, useEffect } from "react";
import { createBeacon } from "@/lib/actions";
import { useMetaFetcher } from "@/hooks/use-meta-fetcher";
import type { Beacon, SectorWithBeacons } from "@/types";

type Props = {
  sectors: SectorWithBeacons[];
  defaultSectorId?: string;
  onClose: () => void;
  onCreated: (beacon: Beacon) => void;
};

export default function AddBeaconModal({ sectors, defaultSectorId, onClose, onCreated }: Props) {
  const [sectorId, setSectorId] = useState(defaultSectorId ?? sectors[0]?.id ?? "");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: meta, loading: metaLoading, fetchMeta } = useMetaFetcher();

  // Auto-fill from scraped meta
  useEffect(() => {
    if (meta) {
      if (!title) setTitle(meta.title ?? "");
      if (!description) setDescription(meta.description ?? "");
    }
  }, [meta]);

  async function handleUrlBlur() {
    if (url.trim() && url.includes(".")) {
      await fetchMeta(url);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || !title.trim() || !sectorId) return;
    setLoading(true);
    setError(null);

    const result = await createBeacon(sectorId, {
      url,
      title,
      description: description || undefined,
      imageUrl: meta?.imageUrl ?? undefined,
      faviconUrl: meta?.faviconUrl ?? undefined,
      notes: notes || undefined,
    });

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      onCreated(result.data);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Add Beacon">
      <div className="modal-panel glass" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Beacon</h2>
          <button className="btn-icon modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
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
                  {s.icon ?? "📁"} {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* URL */}
          <div className="form-group">
            <label className="form-label" htmlFor="beacon-url">
              URL
              {metaLoading && <span className="form-label-hint">⟳ Fetching metadata…</span>}
              {meta && !metaLoading && <span className="form-label-hint form-label-ok">✓ Metadata loaded</span>}
            </label>
            <input
              id="beacon-url"
              className="input"
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={handleUrlBlur}
              autoFocus
              required
            />
          </div>

          {/* OG Image preview */}
          {meta?.imageUrl && (
            <div className="beacon-preview-image">
              <img src={meta.imageUrl} alt="OG Preview" />
            </div>
          )}

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
            <label className="form-label" htmlFor="beacon-desc">Description <span className="optional">(optional)</span></label>
            <input
              id="beacon-desc"
              className="input"
              type="text"
              placeholder="Short description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label" htmlFor="beacon-notes">Personal Notes <span className="optional">(optional)</span></label>
            <textarea
              id="beacon-notes"
              className="input"
              placeholder="Why did you save this?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button
              id="btn-create-beacon"
              type="submit"
              className="btn btn-primary"
              disabled={loading || !url.trim() || !title.trim()}
            >
              {loading ? <span className="spinner" /> : "Add Beacon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

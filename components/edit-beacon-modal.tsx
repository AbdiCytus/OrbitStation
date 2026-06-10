"use client";

import { useState, useEffect } from "react";
import { updateBeacon, deleteBeacon } from "@/lib/actions";
import type { Beacon, SectorWithBeacons } from "@/types";

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
  const [faviconUrl, setFaviconUrl] = useState(beacon.faviconUrl ?? "");
  const [notes, setNotes] = useState(beacon.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => { setIsClosing(true); setTimeout(onClose, 200); };
  const [confirmDelete, setConfirmDelete] = useState(false);
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
        setFaviconUrl(ev.target.result as string);
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
        setImageUrl(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    const finalUrl = (url.trim().startsWith("http://") || url.trim().startsWith("https://")) ? url.trim() : "https://" + url.trim();
    const result = await updateBeacon(beacon.id, {
      sectorId,
      url: finalUrl,
      title,
      description: description || undefined,
      imageUrl: imageUrl || undefined,
      faviconUrl: faviconUrl || undefined,
      notes: notes || undefined,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      onUpdated(result.data);
    }
  }

  async function handleDelete() {
    const result = await deleteBeacon(beacon.id);
    if (!result.error) onDeleted(beacon.id);
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
            <select
              id="edit-beacon-sector"
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

          {/* URL */}
          <div className="form-group">
            <label className="form-label" htmlFor="edit-beacon-url">URL</label>
            <div className="input-with-prefix">
              <span className="input-prefix">https://</span>
              <input
                id="edit-beacon-url"
                className="input input-url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="example.com"
                required
              />
            </div>
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="edit-beacon-title">Title</label>
            <input
              id="edit-beacon-title"
              className="input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
              autoFocus
            />
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
        {confirmDelete ? (
          <>
            <span className="form-error" style={{ flex: 1, textAlign: "right" }}>Delete this beacon permanently?</span>
            <button type="button" className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
              Delete Beacon
            </button>
            <div style={{ flex: 1 }} />
            <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
            <button
              id="btn-save-beacon"
              type="button"
              onClick={handleSave}
              className="btn btn-primary"
              disabled={loading || !title.trim() || !url.trim()}
            >
              {loading ? <span className="spinner" /> : "Save Changes"}
            </button>
          </>
        )}
      </div>
    </div>
    </div>
  );
}

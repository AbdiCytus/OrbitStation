"use client";

import type { Beacon } from "@/types";
import { incrementBeaconVisit } from "@/lib/actions";
import { PencilSquareIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import { MapPinIcon as MapPinSolid } from "@heroicons/react/24/solid";

type Props = {
  beacon: Beacon;
  onClick: () => void;
  onEdit?: () => void;
  index?: number; // For stagger animation
};

export default function BeaconCard({ beacon, onClick, onEdit, index = 0 }: Props) {
  function handleVisit(e: React.MouseEvent) {
    e.stopPropagation();
    incrementBeaconVisit(beacon.id);
    window.open(beacon.url, "_blank", "noopener,noreferrer");
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    onEdit?.();
  }

  const domain = (() => {
    try { return new URL(beacon.url).hostname.replace("www.", ""); }
    catch { return beacon.url; }
  })();

  return (
    <article
      className="beacon-card glass"
      style={{ "--enter-delay": `${Math.min(index * 60, 600)}ms` } as React.CSSProperties}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Beacon: ${beacon.title}`}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      id={`beacon-${beacon.id}`}
    >
      {/* OG Image */}
      <div className="beacon-card-image">
        {beacon.imageUrl ? (
          <img
            src={beacon.imageUrl}
            alt={beacon.title}
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="beacon-card-image-placeholder">
            {beacon.faviconUrl ? (
              <img src={beacon.faviconUrl} alt="" width={36} height={36} style={{ borderRadius: 6 }} />
            ) : (
              <span className="beacon-card-domain-initial">
                {domain.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        )}
        {beacon.isPinned && (
          <span className="beacon-card-pin" title="Pinned"><MapPinSolid width={14} height={14} /></span>
        )}
      </div>

      {/* Content */}
      <div className="beacon-card-body">
        <div className="beacon-card-meta" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            {beacon.faviconUrl && (
              <img
                src={beacon.faviconUrl}
                alt=""
                width={14}
                height={14}
                className="beacon-card-favicon"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <span className="beacon-card-domain">{domain}</span>
          </div>
        </div>
        <h3 className="beacon-card-title">{beacon.title}</h3>
        {beacon.description && (
          <p className="beacon-card-desc">{beacon.description}</p>
        )}
      </div>

      {/* Footer */}
      <div className="beacon-card-footer" style={{ display: "flex", gap: "0.5rem", padding: "0.625rem" }}>
        {onEdit && (
          <button
            className="btn-icon beacon-card-edit-btn"
            onClick={handleEdit}
            aria-label={`Edit ${beacon.title}`}
            id={`btn-edit-${beacon.id}`}
            title="Edit beacon details"
            style={{ width: "2rem", height: "2rem", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-md)" }}
          >
            <PencilSquareIcon width={14} height={14} />
          </button>
        )}
        <button
          className="btn btn-primary btn-sm"
          onClick={handleVisit}
          aria-label={`Visit ${beacon.title}`}
          id={`btn-visit-${beacon.id}`}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}
        >
          Visit <ArrowTopRightOnSquareIcon width={14} height={14} />
        </button>
      </div>
    </article>
  );
}

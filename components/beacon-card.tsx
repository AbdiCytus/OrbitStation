"use client";

import { useState } from "react";
import type { Beacon } from "@/types";
import { incrementBeaconVisit } from "@/lib/actions";
import { PencilSquareIcon, ArrowTopRightOnSquareIcon, InformationCircleIcon } from "@heroicons/react/20/solid";
import { MapPinIcon as MapPinSolid } from "@heroicons/react/24/solid";

type Props = {
  beacon: Beacon & { _creator?: { name: string | null; image: string | null } | null, tags?: { tag: { id: string, name: string } }[] };
  onClick: () => void;
  onEdit?: () => void;
  index?: number; // For stagger animation
  isCollab?: boolean;
  sectorName?: string;
  isAllBeacons?: boolean;
};

export default function BeaconCard({ beacon, onClick, onEdit, index = 0, isCollab = false, sectorName, isAllBeacons }: Props) {
  const [imgError, setImgError] = useState(false);
  const [favError, setFavError] = useState(false);

  function handleVisit(e: React.MouseEvent) {
    e.stopPropagation();
    incrementBeaconVisit(beacon.id);
    window.open(beacon.url, "_blank", "noopener,noreferrer");
  }

  function handleDetail(e: React.MouseEvent) {
    e.stopPropagation();
    onClick();
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
      onClick={handleVisit}
      role="button"
      tabIndex={0}
      aria-label={`Beacon: ${beacon.title}`}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      id={`beacon-${beacon.id}`}
    >
      {/* OG Image */}
      <div className="beacon-card-image">
        {beacon.imageUrl && !imgError ? (
          <img
            src={beacon.imageUrl}
            alt={beacon.title}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="beacon-card-image-placeholder">
            {beacon.faviconUrl && !favError ? (
              <img
                src={beacon.faviconUrl}
                alt=""
                width={36}
                height={36}
                style={{ borderRadius: 6 }}
                onError={() => setFavError(true)}
              />
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

      {/* Hologram Effect (Desktop Only, All Beacons Only) */}
      {isAllBeacons && sectorName && (
        <div className="beacon-hologram" aria-hidden="true">
          <span className="beacon-hologram-text">{sectorName.toUpperCase()}</span>
        </div>
      )}

      {/* Content */}
      <div className="beacon-card-body">
        <div className="beacon-card-meta">
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
        {beacon._creator && isCollab && (
          <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
            {beacon._creator.image ? (
              <img src={beacon._creator.image} alt={beacon._creator.name || "?"} style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "0.65rem", background: "rgba(255,255,255,0.1)", width: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
                {(beacon._creator.name || "?")[0].toUpperCase()}
              </span>
            )}
            <span style={{ fontSize: "0.7rem", color: "var(--color-starlight)" }} title={`Added by ${beacon._creator.name}`}>Added by <span style={{ color: "#fff" }}>{beacon._creator.name?.split(" ")[0]}</span></span>
          </div>
        )}
        {!isAllBeacons && beacon.tags && beacon.tags.length > 0 && (
          <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
            {beacon.tags.slice(0, 3).map((bt) => (
              <span
                key={bt.tag.id}
                style={{
                  fontSize: "0.65rem",
                  padding: "0.15rem 0.4rem",
                  borderRadius: "9999px",
                  background: "rgba(139, 92, 246, 0.15)",
                  color: "#c4b5fd",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  whiteSpace: "nowrap",
                }}
              >
                {bt.tag.name}
              </span>
            ))}
            {beacon.tags.length > 3 && (
              <span style={{ fontSize: "0.65rem", color: "var(--color-starlight)", alignSelf: "center", marginLeft: "2px" }}>
                +{beacon.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="beacon-card-footer">
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
          onClick={handleDetail}
          aria-label={`Details for ${beacon.title}`}
          id={`btn-detail-${beacon.id}`}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "0.375rem" }}
        >
          <InformationCircleIcon width={16} height={16} /> Details
        </button>
      </div>
    </article>
  );
}

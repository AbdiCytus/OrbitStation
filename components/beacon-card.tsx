"use client";

import type { Beacon } from "@/types";
import { incrementBeaconVisit } from "@/lib/actions";

type Props = {
  beacon: Beacon;
  onClick: () => void;
};

export default function BeaconCard({ beacon, onClick }: Props) {
  function handleClick() {
    onClick();
  }

  function handleVisit(e: React.MouseEvent) {
    e.stopPropagation();
    incrementBeaconVisit(beacon.id);
    window.open(beacon.url, "_blank", "noopener,noreferrer");
  }

  const domain = (() => {
    try { return new URL(beacon.url).hostname.replace("www.", ""); }
    catch { return beacon.url; }
  })();

  return (
    <article
      className="beacon-card glass"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Beacon: ${beacon.title}`}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
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
              <img src={beacon.faviconUrl} alt="" width={32} height={32} />
            ) : (
              <span className="beacon-card-domain-initial">
                {domain.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        )}
        {beacon.isPinned && (
          <span className="beacon-card-pin" title="Pinned">📍</span>
        )}
      </div>

      {/* Content */}
      <div className="beacon-card-body">
        <div className="beacon-card-meta">
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
        <h3 className="beacon-card-title">{beacon.title}</h3>
        {beacon.description && (
          <p className="beacon-card-desc">{beacon.description}</p>
        )}
      </div>

      {/* Footer */}
      <div className="beacon-card-footer">
        <span className="beacon-card-visits">
          {beacon.visitCount > 0 && `${beacon.visitCount} visits`}
        </span>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleVisit}
          aria-label={`Visit ${beacon.title}`}
          id={`btn-visit-${beacon.id}`}
        >
          Visit →
        </button>
      </div>
    </article>
  );
}

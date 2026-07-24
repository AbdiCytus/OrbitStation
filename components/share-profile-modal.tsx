"use client";

import { useState, useEffect } from "react";
import { getBadgeById } from "@/lib/badges/registry";
import { XMarkIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { DynamicIcon } from "@/components/dynamic-icon";
import { toast } from "sonner";
import "../app/station/[username]/public-profile.css";

type Props = {
  user: any;
  url: string;
  onClose: () => void;
};

export default function ShareProfileModal({ user, url, onClose }: Props) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, []);

  const badge = user.titleBadge ? getBadgeById(user.titleBadge) : null;
  const isSpecial = badge?.rarity === "ekslusif";
  const isExclusive = badge?.rarity === "super-ekslusif" || badge?.rarity === "developer";
  const avatarBadgeClass = badge 
    ? isExclusive 
      ? `avatar-badge avatar-exclusive-${badge.id}`
      : isSpecial 
        ? `avatar-badge avatar-badge-special-${badge.color}`
        : `avatar-badge avatar-badge-common-${badge.color}`
    : '';

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  return (
    <div className={"share-modal-overlay" + (isClosing ? " closing" : "")} onClick={handleClose}>
      <style>{`
        .share-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: share-fade-in 0.2s ease-out forwards;
          padding: 1rem;
        }
        .share-modal-overlay.closing { animation: share-fade-out 0.2s ease-in forwards; }
        
        .share-modal-panel {
          max-width: 360px;
          width: 100%;
          background: #0b0c10;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255,255,255,0.05);
          animation: share-pop-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          position: relative;
        }
        .share-modal-panel.closing { animation: share-pop-out 0.2s ease-in forwards; }

        @keyframes share-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes share-fade-out { from { opacity: 1; } to { opacity: 0; } }
        @keyframes share-pop-in {
          from { opacity: 0; transform: scale(0.8) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes share-pop-out {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.9) translateY(10px); }
        }
      `}</style>
      <div className={"share-modal-panel" + (isClosing ? " closing" : "")} onClick={(e) => e.stopPropagation()}>
        
        {/* Header / Banner */}
        <div style={{ position: "relative", height: "120px", width: "100%" }}>
          <img
            src={user.bannerUrl || "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=2000&auto=format&fit=crop"}
            alt="Banner"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0b0c10, transparent)" }} />
          <button 
            onClick={handleClose}
            style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.5)", borderRadius: "50%", padding: "6px", color: "white", border: "1px solid rgba(255,255,255,0.1)", zIndex: 10 }}
          >
            <XMarkIcon width={20} height={20} />
          </button>
        </div>

        {/* Avatar & User Info */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "-40px", padding: "0 20px 20px" }}>
          
          <div style={{ position: 'relative', flexShrink: 0, marginBottom: "8px" }}>
            {badge?.id === 'zodiac-horizon' && (
              <>
                <div className="avatar-exclusive-zodiac-horizon-orbit-1 avatar-exclusive-zodiac-horizon-orbit-back" />
                <div className="avatar-exclusive-zodiac-horizon-orbit-2 avatar-exclusive-zodiac-horizon-orbit-back" />
              </>
            )}
            <div 
              className={`zzz-avatar ${avatarBadgeClass}`} 
              style={{ '--avatar-radius': '36px', width: "72px", height: "72px", overflow: 'visible', position: 'relative', zIndex: 1 } as any}
            >
              <div className={`w-full h-full rounded-full overflow-hidden relative ${isExclusive || isSpecial ? 'public-badge-sweep' : ''}`}>
                {user.image ? (
                  <img src={user.image} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', position: 'relative', zIndex: 10 }} />
                ) : (
                  <span style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', background: '#333', fontSize: '24px', fontWeight: 'bold' }}>{user.name?.[0]?.toUpperCase() ?? "?"}</span>
                )}
              </div>
            </div>
            {badge?.id === 'zodiac-horizon' && (
              <>
                <div className="avatar-exclusive-zodiac-horizon-orbit-1 avatar-exclusive-zodiac-horizon-orbit-front" />
                <div className="avatar-exclusive-zodiac-horizon-orbit-2 avatar-exclusive-zodiac-horizon-orbit-front" />
              </>
            )}
          </div>

          <h1 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "white", margin: 0 }}>{user.name}</h1>
          {user.username && (
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginBottom: "8px" }}>@{user.username}</div>
          )}

          {badge && (
            <div className="zodiac-orbit-wrapper" style={{ position: 'relative', width: 'fit-content', marginBottom: '20px' }}>
              {badge.id === 'zodiac-horizon' && (
                <>
                  <div className="badge-zodiac-orbit-1 badge-zodiac-orbit-back" />
                  <div className="badge-zodiac-orbit-2 badge-zodiac-orbit-back" />
                </>
              )}
              <div className={`badge-card ${isExclusive || isSpecial ? 'public-badge-sweep' : ''} ${badge.effectClass} pr-3 py-1 pl-1 rounded-full flex items-center gap-1.5 border backdrop-blur-sm shadow-lg`} style={{ position: 'relative', zIndex: 1 }}>
                {badge.id === 'the-completionist' && <div className="badge-wave-layer" />}
                {badge.id === 'zodiac-horizon' && <div className="badge-zodiac-wave-layer" />}
                <div className="badge-icon w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                  <DynamicIcon name={badge.icon} className="w-3 h-3 relative z-10" />
                </div>
                <span className="badge-content relative z-10 text-white font-bold tracking-wide text-[10px] drop-shadow-md" style={{marginRight: "0.5rem"}}>
                  {badge.name}
                </span>
              </div>
              {badge.id === 'zodiac-horizon' && (
                <>
                  <div className="badge-zodiac-orbit-1 badge-zodiac-orbit-front" />
                  <div className="badge-zodiac-orbit-2 badge-zodiac-orbit-front" />
                </>
              )}
            </div>
          )}
          
          {/* Link Body */}
          <div style={{ width: "100%", background: "rgba(255,255,255,0.03)", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
              Share this station with others!
            </div>
            
            <a 
              href={url} 
              target="_blank" 
              rel="noreferrer"
              style={{ display: "block", background: "rgba(0,0,0,0.4)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", color: "#a78bfa", textDecoration: "none", fontSize: "0.85rem", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {url}
            </a>
            
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                onClick={copyLink}
                className="btn btn-primary"
                style={{ flex: 1, padding: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600" }}
              >
                <DocumentDuplicateIcon width={16} height={16} /> Copy Link
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

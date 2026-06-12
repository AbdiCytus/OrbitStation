"use client";

import { useState, useEffect } from "react";
import { getSectorOwner, getFriends, sendFriendRequest } from "@/lib/actions";
import type { SectorWithBeacons } from "@/types";
import { UserPlusIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

type Props = {
  sector: SectorWithBeacons;
  currentUserId: string;
  onClose: () => void;
};

export default function SectorMembersModal({ sector, currentUserId, onClose }: Props) {
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => { setIsClosing(true); setTimeout(onClose, 200); };
  
  const [friends, setFriends] = useState<any[]>([]);
  const [sectorOwner, setSectorOwner] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());

  const localCollaborators = sector.collaborators || [];

  useEffect(() => {
    getFriends().then(setFriends);
    getSectorOwner(sector.id).then(setSectorOwner);
  }, [sector.id]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", fn);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", fn);
    };
  }, [onClose]);

  const handleAddFriend = async (id: string) => {
    setPendingRequests(prev => new Set(prev).add(id));
    await sendFriendRequest(id);
  };

  const isFriend = (id: string) => friends.some(f => f.id === id);

  return (
    <div className={`modal-overlay ${isClosing ? "closing" : ""}`} onClick={handleClose} role="dialog" aria-modal="true" aria-label="Sector Members" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", overflowY: "auto" }}>
      <div style={{ display: "flex", gap: "1rem", flexDirection: "column", width: "100%", maxWidth: "400px", minHeight: "600px", maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
        <div className={`modal-panel ${isClosing ? "closing" : ""} glass`} style={{ margin: 0, display: "flex", flexDirection: "column", padding: 0, flex: 1 }}>
          <div className="modal-header" style={{ padding: "1.5rem 1.5rem 1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: "1rem" }}>
            <h2 className="modal-title" style={{ fontSize: "1.1rem" }}>Members of {sector.name}</h2>
            <button className="btn-icon modal-close" onClick={handleClose} aria-label="Close" style={{ right: "1.5rem", top: "1.5rem" }}>✕</button>
          </div>
          
          <div className="form-group" style={{ marginBottom: 0, flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", padding: "0 1.5rem 1.5rem 1.5rem" }}>
            {/* Owner */}
            {sectorOwner && (
              <div className="flex items-center justify-between rounded-full border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group" style={{ padding: "0.5rem 0.75rem 0.5rem 0.5rem", marginBottom: "0.5rem" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="rounded-full bg-gray-700 overflow-hidden relative flex-shrink-0" style={{ width: "40px", height: "40px" }}>
                    {sectorOwner.image ? <img src={sectorOwner.image} alt={sectorOwner.name ?? ""} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-300 font-bold w-full h-full flex items-center justify-center">{(sectorOwner.name || sectorOwner.username || "?")[0].toUpperCase()}</span>}
                  </div>
                  <p className="text-sm font-medium text-gray-300 truncate">
                    {sectorOwner.name || sectorOwner.username}
                    {sectorOwner.id === currentUserId && <span className="opacity-50 ml-1"> (You)</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-[#a78bfa] uppercase tracking-widest">Owner</span>
                  {sectorOwner.isPublic && sectorOwner.username && (
                    <Link href={`/station/${sectorOwner.username}`} className="flex items-center justify-center text-gray-400 hover:text-violet-400 rounded-full hover:bg-violet-500/20 transition-colors" style={{ width: "36px", height: "36px" }} title="Visit Profile">
                      <ArrowTopRightOnSquareIcon width={16} height={16} />
                    </Link>
                  )}
                  {sectorOwner.id !== currentUserId && !isFriend(sectorOwner.id) && !pendingRequests.has(sectorOwner.id) && (
                    <button type="button" onClick={() => handleAddFriend(sectorOwner.id)} className="flex items-center justify-center text-gray-400 hover:text-cyan-400 rounded-full hover:bg-cyan-500/20 transition-colors" style={{ width: "36px", height: "36px" }} title="Add Friend">
                      <UserPlusIcon width={16} height={16} />
                    </button>
                  )}
                  {pendingRequests.has(sectorOwner.id) && (
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 py-1 rounded-md">Pending</span>
                  )}
                </div>
              </div>
            )}

            {/* Members */}
            {localCollaborators.map((c: any) => (
              <div key={c.user.id} className="flex items-center justify-between rounded-full border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group" style={{ padding: "0.5rem 0.75rem 0.5rem 0.5rem", marginBottom: "0.5rem" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="rounded-full bg-gray-700 overflow-hidden relative flex-shrink-0" style={{ width: "40px", height: "40px" }}>
                    {c.user.image ? <img src={c.user.image} alt={c.user.name ?? ""} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-300 font-bold w-full h-full flex items-center justify-center">{(c.user.name || c.user.username || "?")[0].toUpperCase()}</span>}
                  </div>
                  <p className="text-sm font-medium text-gray-300 truncate">
                    {c.user.name || c.user.username}
                    {c.user.id === currentUserId && <span className="opacity-50 ml-1"> (You)</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {c.user.station?.isPublic && c.user.username && (
                    <Link href={`/station/${c.user.username}`} className="flex items-center justify-center text-gray-400 hover:text-violet-400 rounded-full hover:bg-violet-500/20 transition-colors" style={{ width: "36px", height: "36px" }} title="Visit Profile">
                      <ArrowTopRightOnSquareIcon width={16} height={16} />
                    </Link>
                  )}
                  {c.user.id !== currentUserId && !isFriend(c.user.id) && !pendingRequests.has(c.user.id) && (
                    <button type="button" onClick={() => handleAddFriend(c.user.id)} className="flex items-center justify-center text-gray-400 hover:text-cyan-400 rounded-full hover:bg-cyan-500/20 transition-colors" style={{ width: "36px", height: "36px" }} title="Add Friend">
                      <UserPlusIcon width={16} height={16} />
                    </button>
                  )}
                  {pendingRequests.has(c.user.id) && (
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 py-1 rounded-md">Pending</span>
                  )}
                </div>
              </div>
            ))}
            
            {localCollaborators.length === 0 && !sectorOwner && (
              <p className="text-sm text-gray-400 text-center py-4">No members found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

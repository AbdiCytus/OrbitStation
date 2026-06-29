"use client";

import { useState, useEffect } from "react";
import { getSectorOwner, getFriends, sendFriendRequest } from "@/lib/actions";
import type { SectorWithBeacons } from "@/types";
import { UserPlusIcon, ArrowTopRightOnSquareIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { motion } from "framer-motion";

type Props = {
  sector: SectorWithBeacons;
  currentUserId: string;
  ownerData: any;
  onClose: () => void;
};

export default function SectorMembersModal({ sector, currentUserId, ownerData, onClose }: Props) {
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => { setIsClosing(true); setTimeout(onClose, 200); };

  const [friends, setFriends] = useState<any[]>([]);
  const [isFriendsLoading, setIsFriendsLoading] = useState(true);
  const sectorOwner = ownerData;
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());

  const localCollaborators = sector.collaborators || [];

  useEffect(() => {
    getFriends().then((data) => {
      setFriends(data);
      setIsFriendsLoading(false);
    });
  }, []);

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
    <div
      className={`modal-overlay ${isClosing ? "closing" : ""} flex items-end sm:items-center justify-center p-0 sm:p-8`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Sector Members"
      style={{ overflowY: "hidden" }}
    >
      <div
        className="w-full sm:max-w-[400px] flex flex-col"
        style={{ maxHeight: "85vh", minHeight: "50vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`modal-panel ${isClosing ? "closing" : ""} glass rounded-t-3xl rounded-b-none sm:rounded-2xl`}
          style={{ margin: 0, display: "flex", flexDirection: "column", padding: 0, flex: 1, borderBottom: "none" }}
        >        <div className="modal-header" style={{ padding: "1.5rem 1.5rem 1rem 1.5rem", borderBottom: "1px solid var(--glass-border)", marginBottom: "1rem" }}>
            <h2 className="modal-title flex items-center gap-2" style={{ fontSize: "1.1rem" }}>
              Members of {sector.name}
              <span className="text-xs rounded-full border flex items-center justify-center shrink-0" style={{ background: "var(--sector-active-bg)", borderColor: "var(--sector-active-border)", color: "var(--color-primary)", padding: "2px 8px", minWidth: "24px" }}>{(sectorOwner ? 1 : 0) + localCollaborators.length}</span>
            </h2>
            <button className="btn-icon modal-close" onClick={handleClose} aria-label="Close" style={{ right: "1.5rem", top: "1.5rem" }}>✕</button>
          </div>

          <motion.div
            className="form-group"
            style={{ marginBottom: 0, flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", padding: "0 1.5rem 1.5rem 1.5rem" }}
            initial="hidden" animate="visible"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
          >
            {/* Owner */}
            {sectorOwner && (
              <motion.div
                className="flex items-center justify-between rounded-full border bg-[var(--item-bg)] border-[var(--item-border)] hover:bg-[var(--glass-bg-hover)] transition-colors group"
                style={{ padding: "0.5rem 0.75rem 0.5rem 0.5rem", marginBottom: "0.5rem" }}
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="rounded-full overflow-hidden relative flex-shrink-0" style={{ width: "40px", height: "40px", backgroundColor: "var(--color-border)", border: "2px solid var(--color-amber-glow)", boxShadow: "0 0 10px var(--color-amber-glow)" }}>
                    {sectorOwner.image ? <img src={sectorOwner.image} alt={sectorOwner.name ?? ""} className="w-full h-full object-cover" /> : <span className="text-xs text-comet font-bold w-full h-full flex items-center justify-center">{(sectorOwner.name || sectorOwner.username || "?")[0].toUpperCase()}</span>}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-medium text-comet truncate leading-tight">
                      {sectorOwner.name || sectorOwner.username}
                      {sectorOwner.id === currentUserId && <span className="opacity-50 ml-1"> (You)</span>}
                    </p>
                    <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: "var(--color-primary)" }}>Owner</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {(sectorOwner.isPublic || sectorOwner.station?.isPublic) && sectorOwner.username && (
                    <Link href={`/station/${sectorOwner.username}`} target="_blank" className="flex items-center justify-center text-comet hover:text-[var(--color-primary)] rounded-full hover:bg-[var(--sector-active-bg)] transition-colors" style={{ width: "32px", height: "32px" }} title="Visit Profile">
                      <GlobeAltIcon width={16} height={16} />
                    </Link>
                  )}
                  {sectorOwner.id !== currentUserId && !isFriendsLoading && !isFriend(sectorOwner.id) && !pendingRequests.has(sectorOwner.id) && (
                    <button type="button" onClick={() => handleAddFriend(sectorOwner.id)} className="flex items-center justify-center text-comet hover:text-cyan-400 rounded-full hover:bg-cyan-500/20 transition-colors" style={{ width: "32px", height: "32px" }} title="Add Friend">
                      <UserPlusIcon width={16} height={16} />
                    </button>
                  )}
                  {pendingRequests.has(sectorOwner.id) && (
                    <span className="text-[10px] font-bold text-dust uppercase tracking-widest px-2 py-1 rounded-md">Pending</span>
                  )}
                </div>
              </motion.div>
            )}

            {/* Members */}
            {localCollaborators.map((c: any) => (
              <motion.div
                key={c.user.id}
                className="flex items-center justify-between rounded-full border bg-[var(--item-bg)] border-[var(--item-border)] hover:bg-[var(--glass-bg-hover)] transition-colors group"
                style={{ padding: "0.5rem 0.75rem 0.5rem 0.5rem", marginBottom: "0.5rem" }}
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="rounded-full overflow-hidden relative flex-shrink-0" style={{ width: "40px", height: "40px", backgroundColor: "var(--color-border)", border: c.role === "ADMIN" ? "2px solid #10B981" : "1px solid var(--glass-border)" }}>
                    {c.user.image ? <img src={c.user.image} alt={c.user.name ?? ""} className="w-full h-full object-cover" /> : <span className="text-xs text-comet font-bold w-full h-full flex items-center justify-center">{(c.user.name || c.user.username || "?")[0].toUpperCase()}</span>}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-medium text-comet truncate leading-tight">
                      {c.user.name || c.user.username}
                      {c.user.id === currentUserId && <span className="opacity-50 ml-1"> (You)</span>}
                    </p>
                    <span className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: c.role === 'ADMIN' ? '#10B981' : 'var(--color-comet)' }}>{c.role || 'MEMBER'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {(c.user as any).station?.isPublic && c.user.username && (
                    <Link href={`/station/${c.user.username}`} target="_blank" className="flex items-center justify-center text-comet hover:text-[var(--color-primary)] rounded-full hover:bg-[var(--sector-active-bg)] transition-colors" style={{ width: "32px", height: "32px" }} title="Visit Profile">
                      <GlobeAltIcon width={16} height={16} />
                    </Link>
                  )}
                  {c.userId !== currentUserId && !isFriendsLoading && !isFriend(c.user.id) && !pendingRequests.has(c.user.id) && (
                    <button type="button" onClick={() => handleAddFriend(c.user.id)} className="flex items-center justify-center text-comet hover:text-cyan-400 rounded-full hover:bg-cyan-500/20 transition-colors" style={{ width: "32px", height: "32px" }} title="Add Friend">
                      <UserPlusIcon width={16} height={16} />
                    </button>
                  )}
                  {pendingRequests.has(c.user.id) && (
                    <span className="text-[10px] font-bold text-dust uppercase tracking-widest px-2 py-1 rounded-md">Pending</span>
                  )}
                </div>
              </motion.div>
            ))}

            {localCollaborators.length === 0 && !sectorOwner && (
              <p className="text-sm text-comet text-center py-4">No members found.</p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}



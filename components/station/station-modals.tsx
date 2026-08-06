"use client";

import React from "react";
import type { StationWithSectors, SectorWithBeacons, Beacon, Tag } from "@/types";
import AddBeaconModal from "@/components/add-beacon-modal";
import AddSectorModal from "@/components/add-sector-modal";
import EditSectorModal from "@/components/edit-sector-modal";
import EditBeaconModal from "@/components/edit-beacon-modal";
import BeaconDetailModal from "@/components/beacon-detail-modal";
import TagManagementModal from "@/components/tag-management-modal";
import SectorMembersModal from "@/components/sector-members-modal";
import FriendsModal from "@/components/friends-modal";
import GroupChatModal from "@/components/group-chat-modal";
import { motion, AnimatePresence } from "framer-motion";

type StationModalsProps = {
  user: any;
  station: StationWithSectors | null;
  stats: any;
  refetchNotifications: () => void;
  showFriendsModal: boolean;
  setShowFriendsModal: (show: boolean) => void;
  activeFriendChatId: string | null;
  setActiveFriendChatId: (id: string | null) => void;
  targetFriendChatId: string | null;
  setTargetFriendChatId: (id: string | null) => void;

  showAddSector: boolean;
  setShowAddSector: (show: boolean) => void;
  handleSectorCreated: (sector: any) => void;

  showAddBeacon: boolean;
  setShowAddBeacon: (show: boolean) => void;
  handleBeaconCreated: (beacon: Beacon) => void;

  editingSector: SectorWithBeacons | null;
  setEditingSector: (sector: SectorWithBeacons | null) => void;
  handleSectorUpdated: (sector: any) => void;
  handleSectorDelete: (sectorId: string) => void;

  viewingMembersSector: SectorWithBeacons | null;
  setViewingMembersSector: (sector: SectorWithBeacons | null) => void;

  editingBeacon: Beacon | null;
  setEditingBeacon: (beacon: Beacon | null) => void;
  handleBeaconUpdated: (beacon: Beacon) => void;
  handleBeaconDeleted: (beaconId: string) => void;

  selectedBeacon: Beacon | null;
  setSelectedBeacon: (beacon: Beacon | null) => void;

  showTagModal: boolean;
  setShowTagModal: (show: boolean) => void;
  sectorTagsOverride: Record<string, Tag[]>;
  setSectorTagsOverride: React.Dispatch<React.SetStateAction<Record<string, Tag[]>>>;
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;

  showAccessDenied: boolean;
  setShowAccessDenied: (show: boolean) => void;

  showGroupChat: boolean;
  setShowGroupChat: (show: boolean) => void;

  allSectors: SectorWithBeacons[];
  allOwnedSectors: SectorWithBeacons[];
  allCollabSectors: SectorWithBeacons[];
  displaySectorId: string | "all";
  isCurrentSectorAdminOrOwner: boolean;
};

export default function StationModals({
  user,
  station,
  stats,
  refetchNotifications,
  showFriendsModal,
  setShowFriendsModal,
  setActiveFriendChatId,
  targetFriendChatId,
  setTargetFriendChatId,
  showAddSector,
  setShowAddSector,
  handleSectorCreated,
  showAddBeacon,
  setShowAddBeacon,
  handleBeaconCreated,
  editingSector,
  setEditingSector,
  handleSectorUpdated,
  handleSectorDelete,
  viewingMembersSector,
  setViewingMembersSector,
  editingBeacon,
  setEditingBeacon,
  handleBeaconUpdated,
  handleBeaconDeleted,
  selectedBeacon,
  setSelectedBeacon,
  showTagModal,
  setShowTagModal,
  sectorTagsOverride,
  setSectorTagsOverride,
  setSelectedTags,
  showAccessDenied,
  setShowAccessDenied,
  showGroupChat,
  setShowGroupChat,
  allSectors,
  allOwnedSectors,
  allCollabSectors,
  displaySectorId,
  isCurrentSectorAdminOrOwner,
}: StationModalsProps) {
  return (
    <>
      <FriendsModal
        isOpen={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
        user={user}
        stats={stats}
        refetchStats={refetchNotifications}
        onActiveChatChange={setActiveFriendChatId}
        targetChatId={targetFriendChatId}
        onTargetChatHandled={() => setTargetFriendChatId(null)}
      />

      {/* Modals */}
      {showAddSector && (
        <AddSectorModal
          onClose={() => setShowAddSector(false)}
          onCreated={handleSectorCreated}
        />
      )}

      {showAddBeacon && (
        <AddBeaconModal
          sectors={allSectors.filter(
            (s) =>
              (s as any).stationId === station?.id ||
              (s as any).collaborators?.find((c: any) => c.userId === user.id)
                ?.role === "ADMIN",
          )}
          initialSectorId={
            displaySectorId !== "all" ? displaySectorId : undefined
          }
          currentStationId={station?.id}
          onClose={() => setShowAddBeacon(false)}
          onCreated={handleBeaconCreated}
        />
      )}

      {editingSector && (
        <EditSectorModal
          sector={editingSector}
          sectors={allOwnedSectors}
          currentUserId={user.id}
          onClose={() => setEditingSector(null)}
          onUpdated={handleSectorUpdated}
          onDeleted={handleSectorDelete}
        />
      )}

      {viewingMembersSector && (
        <SectorMembersModal
          sector={viewingMembersSector}
          currentUserId={user.id}
          ownerData={
            allOwnedSectors.find((s) => s.id === viewingMembersSector.id)
              ? user
              : (viewingMembersSector as any).station?.user
          }
          onClose={() => setViewingMembersSector(null)}
        />
      )}

      {editingBeacon && (
        <EditBeaconModal
          beacon={editingBeacon}
          sectors={allSectors}
          onClose={() => setEditingBeacon(null)}
          onUpdated={handleBeaconUpdated}
          onDeleted={handleBeaconDeleted}
        />
      )}

      {selectedBeacon && !editingBeacon && (
        <BeaconDetailModal
          beacon={selectedBeacon}
          sector={
            allSectors.find((s) => s.id === selectedBeacon.sectorId) ?? null
          }
          onClose={() => setSelectedBeacon(null)}
          onUpdated={handleBeaconUpdated}
          onDeleted={handleBeaconDeleted}
          canEdit={isCurrentSectorAdminOrOwner}
        />
      )}

      {showTagModal && displaySectorId !== "all" && (
        <TagManagementModal
          isOpen={showTagModal}
          onClose={() => setShowTagModal(false)}
          sector={allSectors.find((s) => s.id === displaySectorId)!}
          sectorTagsOverride={sectorTagsOverride[displaySectorId]}
          onTagsChanged={(tags) => {
            setSectorTagsOverride((prev) => ({
              ...prev,
              [displaySectorId]: tags,
            }));
            // Remove any selected tag filters that no longer exist
            const tagIds = tags.map((t) => t.id);
            setSelectedTags((prev) => prev.filter((id) => tagIds.includes(id)));
          }}
        />
      )}

      <AnimatePresence>
        {showAccessDenied && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center backdrop-blur-sm"
            onClick={() => setShowAccessDenied(false)}
            style={{ padding: "12px" }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#0b0c10] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center text-center p-8 rounded-3xl w-[90%] max-w-sm"
              onClick={(e) => e.stopPropagation()}
              style={{ padding: "12px" }}>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 border border-red-500/30">
                <svg
                  width="32"
                  height="32"
                  fill="none"
                  stroke="#f87171"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Access Denied
              </h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                You do not have permission to perform this action. Only Sector
                Admins or the Owner can modify beacons here.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-colors cursor-pointer border-none">
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {displaySectorId !== "all" && (
        <GroupChatModal
          isOpen={showGroupChat}
          onClose={() => setShowGroupChat(false)}
          sector={
            allCollabSectors.find((s) => s.id === displaySectorId) || null
          }
          user={user}
          isOwner={allOwnedSectors.some((s) => s.id === displaySectorId)}
        />
      )}
    </>
  );
}

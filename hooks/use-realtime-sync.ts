"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { pusherClient } from "@/lib/pusher-client";
import { toast } from "sonner";
import type { Beacon, SectorWithBeacons } from "@/types";

type RealtimeSyncOptions = {
  userId: string;
  userName: string | null;
  userImage: string | null;
  allSectors: SectorWithBeacons[];
  onBeaconCreated: (beacon: Beacon) => void;
  onBeaconUpdated: (beacon: Beacon) => void;
  onBeaconDeleted: (beaconId: string) => void;
  setStation: React.Dispatch<React.SetStateAction<any>>;
};

/**
 * Subscribes to Pusher channels for:
 * - Real-time beacon CRUD events (create/update/delete)
 * - Collaborator role updates
 *
 * Automatically recovers missing creator profile images from
 * local sector data before dispatching to handlers.
 */
export function useRealtimeSync({
  userId,
  userName,
  userImage,
  allSectors,
  onBeaconCreated,
  onBeaconUpdated,
  onBeaconDeleted,
  setStation,
}: RealtimeSyncOptions) {
  const router = useRouter();
  const allSectorsRef = useRef(allSectors);

  useEffect(() => {
    allSectorsRef.current = allSectors;
  }, [allSectors]);

  // ── Role update via custom DOM event ──
  useEffect(() => {
    const handleGlobalRoleUpdate = (e: any) => {
      const { sectorId, userId: targetUserId, role } = e.detail;
      setStation((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          sectors: prev.sectors.map((s: any) => {
            if (s.id === sectorId) {
              return {
                ...s,
                collaborators: s.collaborators?.map((c: any) =>
                  c.userId === targetUserId || c.user?.id === targetUserId
                    ? { ...c, role }
                    : c,
                ),
              };
            }
            return s;
          }),
        };
      });
    };

    window.addEventListener("role-updated-global", handleGlobalRoleUpdate);
    return () =>
      window.removeEventListener("role-updated-global", handleGlobalRoleUpdate);
  }, [setStation]);

  // ── Pusher: role-updated channel ──
  useEffect(() => {
    if (!userId) return;
    const channel = pusherClient.subscribe(`private-user-${userId}`);
    const handleRoleUpdate = (data: any) => {
      setStation((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          sectors: prev.sectors.map((s: any) => {
            if (s.id === data.sectorId) {
              return {
                ...s,
                collaborators: s.collaborators?.map((c: any) =>
                  c.userId === userId ? { ...c, role: data.role } : c,
                ),
              };
            }
            return s;
          }),
        };
      });

      if (data.role === "ADMIN") {
        toast.success(
          `You have been promoted to Admin in sector ${data.sectorName}!`,
          { position: "top-center" },
        );
      } else {
        toast.error(
          `Your Admin rights have been revoked in sector ${data.sectorName}.`,
          { position: "top-center" },
        );
      }
    };

    channel.bind("role-updated", handleRoleUpdate);

    return () => {
      channel.unbind("role-updated", handleRoleUpdate);
      pusherClient.unsubscribe(`private-user-${userId}`);
    };
  }, [userId, setStation]);

  // ── Pusher: beacon-update channel ──
  useEffect(() => {
    if (!userId) return;
    const channel = pusherClient.subscribe(`private-user-${userId}`);

    const handleBeaconUpdate = (payload: any) => {
      const beaconData = payload.data;

      // Recover missing creator profile image from local data
      if (
        beaconData &&
        beaconData.creatorId &&
        (!beaconData.creator || !beaconData.creator.image)
      ) {
        let foundImage = null;
        let foundName = beaconData.creator?.name || null;

        if (beaconData.creatorId === userId) {
          foundImage = userImage;
          if (!foundName) foundName = userName;
        } else {
          for (const s of allSectorsRef.current) {
            if (
              (s as any).station?.userId === beaconData.creatorId &&
              (s as any).station?.user
            ) {
              foundImage = (s as any).station.user.image;
              if (!foundName) foundName = (s as any).station.user.name;
            }
            if (!foundImage) {
              const collab = (s as any).collaborators?.find(
                (c: any) =>
                  c.userId === beaconData.creatorId ||
                  c.user?.id === beaconData.creatorId,
              );
              if (collab && collab.user) {
                foundImage = collab.user.image;
                if (!foundName) foundName = collab.user.name;
              }
            }
            // Fallback: borrow image from another beacon by the same creator
            if (!foundImage && s.beacons) {
              const existingBeacon: any = s.beacons.find(
                (b: any) =>
                  b.creatorId === beaconData.creatorId && b.creator?.image,
              );
              if (existingBeacon && existingBeacon.creator) {
                foundImage = existingBeacon.creator.image;
                if (!foundName) foundName = existingBeacon.creator.name;
              }
            }
            if (foundImage) break;
          }
        }

        beaconData.creator = {
          ...(beaconData.creator || {}),
          name: foundName,
          image: foundImage,
        };
      }

      if (payload.type === "BEACON_CREATED") {
        onBeaconCreated(beaconData);
      } else if (payload.type === "BEACON_UPDATED") {
        onBeaconUpdated(beaconData);
      } else if (payload.type === "BEACON_DELETED") {
        onBeaconDeleted(beaconData.id);
      }

      // Silent refresh after animation settles
      setTimeout(() => {
        router.refresh();
      }, 1000);
    };

    channel.bind("beacon-update", handleBeaconUpdate);

    return () => {
      channel.unbind("beacon-update", handleBeaconUpdate);
    };
  }, [
    userId,
    onBeaconCreated,
    onBeaconUpdated,
    onBeaconDeleted,
    userImage,
    userName,
    router,
  ]);
}

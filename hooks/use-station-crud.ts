"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { deleteSector } from "@/lib/actions/sector.actions";
import type { Beacon, SectorWithBeacons, StationWithSectors } from "@/types";

type UseStationCrudOptions = {
  user: {
    animationEnabled: boolean;
  };
  setStation: React.Dispatch<React.SetStateAction<StationWithSectors | null>>;
  setCollabSectors: React.Dispatch<React.SetStateAction<SectorWithBeacons[]>>;
  setActiveSectorId: (id: string | "all") => void;
  setDisplaySectorId: (id: string | "all") => void;
  startTransition: React.TransitionStartFunction;
};

export function useStationCrud({
  user,
  setStation,
  setCollabSectors,
  setActiveSectorId,
  setDisplaySectorId,
  startTransition,
}: UseStationCrudOptions) {
  const [growingBeacons, setGrowingBeacons] = useState<Set<string>>(new Set());
  const [shrinkingBeacons, setShrinkingBeacons] = useState<Set<string>>(
    new Set(),
  );

  const [selectedBeacon, setSelectedBeacon] = useState<Beacon | null>(null);
  const [editingBeacon, setEditingBeacon] = useState<Beacon | null>(null);
  const [showAddBeacon, setShowAddBeacon] = useState(false);
  const [showAddSector, setShowAddSector] = useState(false);
  const [editingSector, setEditingSector] = useState<SectorWithBeacons | null>(
    null,
  );
  const [viewingMembersSector, setViewingMembersSector] =
    useState<SectorWithBeacons | null>(null);

  const handleSectorCreated = useCallback(
    (newSector: SectorWithBeacons) => {
      setStation((prev) => {
        if (!prev) return prev;
        return { ...prev, sectors: [...prev.sectors, newSector] };
      });
      setActiveSectorId(newSector.id);
      setDisplaySectorId(newSector.id);
      setShowAddSector(false);
    },
    [setActiveSectorId, setDisplaySectorId, setStation],
  );

  const handleSectorUpdated = useCallback(
    (updated: SectorWithBeacons) => {
      setStation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sectors: prev.sectors.map((s) =>
            s.id === updated.id ? { ...s, ...updated } : s,
          ),
        };
      });
      setEditingSector(null);
    },
    [setStation],
  );

  const handleBeaconCreated = useCallback(
    (newBeacon: Beacon) => {
      if (user.animationEnabled) {
        setGrowingBeacons(new Set([newBeacon.id]));
        setTimeout(() => {
          setGrowingBeacons(new Set());
        }, 500);
      }
      setStation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sectors: prev.sectors.map((s) =>
            s.id === newBeacon.sectorId
              ? { ...s, beacons: [...s.beacons, newBeacon] }
              : s,
          ),
        };
      });
      setCollabSectors((prev) =>
        prev.map((s) =>
          s.id === newBeacon.sectorId
            ? { ...s, beacons: [...s.beacons, newBeacon] }
            : s,
        ),
      );
      setShowAddBeacon(false);
    },
    [user.animationEnabled, setStation, setCollabSectors],
  );

  const handleBeaconUpdated = useCallback(
    (updated: Beacon) => {
      setStation((prev) => {
        if (!prev) return prev;
        const oldBeacon = prev.sectors
          .flatMap((s) => s.beacons)
          .find((b) => b.id === updated.id);
        const sectorChanged =
          oldBeacon && oldBeacon.sectorId !== updated.sectorId;

        if (sectorChanged && user.animationEnabled) {
          setShrinkingBeacons(new Set([updated.id]));
          setTimeout(() => {
            setShrinkingBeacons(new Set());
            setStation((p) => {
              if (!p) return p;
              let ns = p.sectors.map((s) => ({
                ...s,
                beacons: s.beacons.filter((b) => b.id !== updated.id),
              }));
              ns = ns.map((s) =>
                s.id === updated.sectorId
                  ? {
                      ...s,
                      beacons: [...s.beacons, updated].sort(
                        (a, b) => a.order - b.order,
                      ),
                    }
                  : s,
              );
              return { ...p, sectors: ns };
            });
          }, 300);
          return prev; // don't update state yet
        }

        let newSectors = prev.sectors.map((s) => ({
          ...s,
          beacons: s.beacons.filter((b) => b.id !== updated.id),
        }));
        newSectors = newSectors.map((s) =>
          s.id === updated.sectorId
            ? {
                ...s,
                beacons: [...s.beacons, updated].sort(
                  (a, b) => a.order - b.order,
                ),
              }
            : s,
        );
        return { ...prev, sectors: newSectors };
      });
      setCollabSectors((prev) => {
        let ns = prev.map((s) => ({
          ...s,
          beacons: s.beacons.filter((b) => b.id !== updated.id),
        }));
        ns = ns.map((s) =>
          s.id === updated.sectorId
            ? {
                ...s,
                beacons: [...s.beacons, updated].sort(
                  (a, b) => a.order - b.order,
                ),
              }
            : s,
        );
        return ns;
      });
      setEditingBeacon(null);
      setSelectedBeacon((prev) => (prev?.id === updated.id ? updated : prev));
    },
    [user.animationEnabled, setStation, setCollabSectors],
  );

  const handleBeaconDeleted = useCallback(
    (beaconId: string) => {
      const doDelete = () => {
        setStation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sectors: prev.sectors.map((s) => ({
              ...s,
              beacons: s.beacons.filter((b) => b.id !== beaconId),
            })),
          };
        });
        setCollabSectors((prev) =>
          prev.map((s) => ({
            ...s,
            beacons: s.beacons.filter((b) => b.id !== beaconId),
          })),
        );
        setSelectedBeacon(null);
        setEditingBeacon(null);
      };

      if (user.animationEnabled) {
        setShrinkingBeacons(new Set([beaconId]));
        setSelectedBeacon(null);
        setEditingBeacon(null);
        setTimeout(() => {
          setShrinkingBeacons(new Set());
          doDelete();
        }, 300);
      } else {
        doDelete();
      }
    },
    [user.animationEnabled, setStation, setCollabSectors],
  );

  const handleSectorDelete = useCallback(
    (sectorId: string, moveToSectorId?: string) => {
      startTransition(async () => {
        const result = await deleteSector(sectorId, moveToSectorId);
        if (!result.error) {
          setStation((prev) => {
            if (!prev) return prev;
            let remaining = prev.sectors;
            if (moveToSectorId) {
              const deletedSector = remaining.find((s) => s.id === sectorId);
              if (deletedSector && deletedSector.beacons.length > 0) {
                remaining = remaining.map((s) => {
                  if (s.id === moveToSectorId) {
                    return {
                      ...s,
                      beacons: [...s.beacons, ...deletedSector.beacons],
                    };
                  }
                  return s;
                });
              }
            }
            remaining = remaining.filter((s) => s.id !== sectorId);
            return { ...prev, sectors: remaining };
          });
          setActiveSectorId("all");
          setDisplaySectorId("all");
          setEditingSector(null);
          toast.success("Sector deleted successfully");
        } else {
          toast.error(result.error || "Failed to delete sector");
        }
      });
    },
    [startTransition, setActiveSectorId, setDisplaySectorId, setStation],
  );

  return {
    growingBeacons,
    shrinkingBeacons,
    selectedBeacon,
    setSelectedBeacon,
    editingBeacon,
    setEditingBeacon,
    showAddBeacon,
    setShowAddBeacon,
    showAddSector,
    setShowAddSector,
    editingSector,
    setEditingSector,
    viewingMembersSector,
    setViewingMembersSector,
    handleSectorCreated,
    handleSectorUpdated,
    handleBeaconCreated,
    handleBeaconUpdated,
    handleBeaconDeleted,
    handleSectorDelete,
  };
}

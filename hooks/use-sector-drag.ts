"use client";

import { useState, useTransition } from "react";
import { reorderSectors } from "@/lib/actions/sector.actions";
import type { SectorWithBeacons, StationWithSectors } from "@/types";

/**
 * Handles drag & drop reordering of personal sectors in the sidebar.
 * Updates local state optimistically and persists via server action.
 */
export function useSectorDrag(
  personalSectors: SectorWithBeacons[],
  setStation: React.Dispatch<React.SetStateAction<StationWithSectors | null>>,
) {
  const [draggedSectorIndex, setDraggedSectorIndex] = useState<number | null>(
    null,
  );
  const [dragOverSectorIndex, setDragOverSectorIndex] = useState<number | null>(
    null,
  );
  const [, startTransition] = useTransition();

  const handleSectorDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSectorIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleSectorDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedSectorIndex !== null && draggedSectorIndex !== index) {
      setDragOverSectorIndex(index);
    } else {
      setDragOverSectorIndex(null);
    }
  };

  const handleSectorDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedSectorIndex === null || draggedSectorIndex === index) {
      setDraggedSectorIndex(null);
      setDragOverSectorIndex(null);
      return;
    }

    const reorderedSectors = Array.from(personalSectors);
    const [movedSector] = reorderedSectors.splice(draggedSectorIndex, 1);
    reorderedSectors.splice(index, 0, movedSector);

    setStation((prev) => {
      if (!prev) return prev;
      const updatedSectors = prev.sectors.map((s) => {
        const pIndex = reorderedSectors.findIndex((rs) => rs.id === s.id);
        if (pIndex !== -1) {
          return { ...s, order: pIndex };
        }
        return s;
      });
      return { ...prev, sectors: updatedSectors };
    });

    startTransition(async () => {
      await reorderSectors(reorderedSectors.map((s) => s.id));
    });

    setDraggedSectorIndex(null);
    setDragOverSectorIndex(null);
  };

  const handleSectorDragEnd = () => {
    setDraggedSectorIndex(null);
    setDragOverSectorIndex(null);
  };

  return {
    draggedSectorIndex,
    dragOverSectorIndex,
    handleSectorDragStart,
    handleSectorDragOver,
    handleSectorDrop,
    handleSectorDragEnd,
  };
}

"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { createTag, updateTag, deleteTag, assignTagsToBeacon } from "@/lib/actions";
import type { SectorWithBeacons, Tag } from "@/types";
import { useRouter } from "next/navigation";

type BeaconTag = { tagId: string; tag: Tag };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  sector: SectorWithBeacons;
  sectorTagsOverride?: Tag[];
  onTagsChanged?: (tags: Tag[]) => void;
};

export default function TagManagementModal({
  isOpen,
  onClose,
  sector,
  sectorTagsOverride,
  onTagsChanged,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"manage" | "assign">("manage");

  // Local tag state — optimistically managed
  const [localTags, setLocalTags] = useState<Tag[]>([]);

  // Manage Tab State
  const [newTagName, setNewTagName] = useState("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assign Tab State: beaconId -> array of tagIds
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);

  // Sync local tags when modal opens or override changes
  useEffect(() => {
    if (isOpen) {
      const sourceTags = sectorTagsOverride ?? sector.tags ?? [];
      setLocalTags(sourceTags);
      setActiveTab("manage");
      setNewTagName("");
      setEditingTagId(null);
      // Init assignments from beacons
      const initial: Record<string, string[]> = {};
      sector.beacons.forEach((b) => {
        initial[b.id] = (b.tags as BeaconTag[] | undefined)?.map((bt) => bt.tagId) || [];
      });
      setAssignments(initial);
    }
  }, [isOpen]);

  const [isReady, setIsReady] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsReady(true), 10);
    } else {
      setIsReady(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const overlayClass = isClosing || !isReady ? "opacity-0" : "opacity-100";
  const panelClass = isClosing || !isReady ? "translate-y-full opacity-0" : "translate-y-0 opacity-100";

  if (!isOpen && !isClosing) return null;

  // --- Manage Tag Handlers ---
  const handleAddTag = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    if (trimmed.length > 20) return toast.error("Tag name max 20 characters");
    if (localTags.length >= 10) return toast.error("Max 10 tags allowed per sector");
    if (localTags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase()))
      return toast.error("Tag already exists");

    setIsSubmitting(true);
    const res = await createTag(sector.id, trimmed);
    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      // Optimistic update: add to local state immediately
      const newTag = res.data as Tag;
      const updated = [...localTags, newTag];
      setLocalTags(updated);
      onTagsChanged?.(updated);
      setNewTagName("");
      toast.success("Tag created successfully!");
      router.refresh();
    }
  };

  const handleUpdateTag = async (tagId: string) => {
    const trimmed = editTagName.trim();
    if (!trimmed) { setEditingTagId(null); return; }
    if (trimmed.length > 20) return toast.error("Tag name max 20 characters");

    setIsSubmitting(true);
    const res = await updateTag(tagId, trimmed);
    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      const updated = localTags.map((t) => (t.id === tagId ? { ...t, name: trimmed } : t));
      setLocalTags(updated);
      onTagsChanged?.(updated);
      setEditingTagId(null);
      toast.success("Tag updated successfully!");
      router.refresh();
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm("Delete this tag? It will be removed from all beacons.")) return;
    setIsSubmitting(true);
    const res = await deleteTag(tagId);
    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      const updated = localTags.filter((t) => t.id !== tagId);
      setLocalTags(updated);
      onTagsChanged?.(updated);
      // Remove from assignments too
      setAssignments((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((bid) => {
          next[bid] = next[bid].filter((id) => id !== tagId);
        });
        return next;
      });
      toast.success("Tag deleted successfully!");
      router.refresh();
    }
  };

  // --- Assign Tag Handlers ---
  const toggleTagAssignment = (beaconId: string, tagId: string) => {
    setAssignments((prev) => {
      const current = prev[beaconId] || [];
      if (current.includes(tagId)) {
        return { ...prev, [beaconId]: current.filter((id) => id !== tagId) };
      } else {
        if (current.length >= 5) {
          toast.error("Max 5 tags per beacon");
          return prev;
        }
        return { ...prev, [beaconId]: [...current, tagId] };
      }
    });
  };

  const handleSaveAssignments = async () => {
    setIsSavingAssignments(true);
    let hasError = false;

    const promises = sector.beacons.map(async (b) => {
      const initialTagIds =
        (b.tags as BeaconTag[] | undefined)?.map((bt) => bt.tagId) || [];
      const currentTagIds = assignments[b.id] || [];
      const isChanged =
        initialTagIds.length !== currentTagIds.length ||
        !initialTagIds.every((id) => currentTagIds.includes(id));

      if (isChanged) {
        const res = await assignTagsToBeacon(b.id, currentTagIds);
        if (res.error) hasError = true;
      }
    });

    await Promise.all(promises);
    setIsSavingAssignments(false);

    if (hasError) {
      toast.error("Some assignments failed to save");
    } else {
      toast.success("Tag assignments saved successfully!");
      router.refresh();
      handleClose();
    }
  };



  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-end sm:justify-center px-0 sm:px-4"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-200 ${overlayClass}`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`relative w-full sm:max-w-2xl flex flex-col overflow-hidden z-10 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${panelClass}`}
        style={{
          background: "#0d0e14",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "1rem 1rem 0 0",
        }}
      >
        {/* Added wrapper for height limits */}
        <div className="flex flex-col w-full h-full sm:h-auto min-h-[50vh] sm:min-h-0 sm:h-[50vh]">
        {/* Header */}
        <div
          className="flex items-center justify-between border-b border-white/10"
          style={{ padding: "1rem 1.5rem" }}
        >
          <div className="flex items-center" style={{ gap: "0.625rem" }}>
            <span style={{ color: "#a78bfa", fontSize: "1.2rem" }}>🏷</span>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff" }}>
              Manage Tags
            </h2>
            <span
              style={{
                fontSize: "0.7rem",
                background: "rgba(139,92,246,0.15)",
                color: "#a78bfa",
                border: "1px solid rgba(139,92,246,0.3)",
                borderRadius: "9999px",
                padding: "0.125rem 0.5rem",
              }}
            >
              {sector.name}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            style={{ padding: "0.375rem" }}
          >
            <XMarkIcon width={20} height={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(["manage", "assign"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 text-sm font-semibold transition-colors"
              style={{
                padding: "0.75rem",
                color: activeTab === tab ? "#c4b5fd" : "#6b7280",
                borderBottom: activeTab === tab ? "2px solid #8b5cf6" : "2px solid transparent",
                background: activeTab === tab ? "rgba(139,92,246,0.07)" : "transparent",
              }}
            >
              {tab === "manage" ? "Manage Tags" : "Assign Tags"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto custom-scrollbar"
          style={{ padding: "1.25rem 1.5rem" }}
        >
          {activeTab === "manage" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Create Tag */}
              <div className="flex" style={{ gap: "0.5rem" }}>
                <input
                  type="text"
                  placeholder="New tag name (max 20 chars)..."
                  maxLength={20}
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  disabled={isSubmitting}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-all"
                  style={{ padding: "0.6rem 0.875rem", fontSize: "0.875rem" }}
                />
                <button
                  onClick={handleAddTag}
                  disabled={isSubmitting || !newTagName.trim()}
                  className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-lg font-medium transition-colors flex items-center"
                  style={{ padding: "0.6rem 1rem", gap: "0.375rem", flexShrink: 0, fontSize: "0.875rem" }}
                >
                  <PlusIcon width={16} height={16} />
                  <span>Add</span>
                </button>
              </div>

              {/* Tag List */}
              {localTags.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center text-center"
                  style={{ padding: "2.5rem 1rem", gap: "0.5rem" }}
                >
                  <span style={{ fontSize: "2rem" }}>🏷️</span>
                  <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                    No tags in this sector yet.
                  </p>
                  <p style={{ color: "#4b5563", fontSize: "0.8rem" }}>
                    Add your first tag above.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  {localTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between border border-white/5 group hover:border-white/10 transition-colors"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: "0.5rem",
                        padding: "0.625rem 0.75rem",
                      }}
                    >
                      {editingTagId === tag.id ? (
                        <input
                          type="text"
                          value={editTagName}
                          onChange={(e) => setEditTagName(e.target.value)}
                          maxLength={20}
                          className="flex-1 bg-black/50 border border-violet-500/60 rounded text-white focus:outline-none"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.875rem" }}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateTag(tag.id);
                            if (e.key === "Escape") setEditingTagId(null);
                          }}
                        />
                      ) : (
                        <div className="flex items-center" style={{ gap: "0.5rem" }}>
                          <span
                            style={{
                              width: "0.5rem",
                              height: "0.5rem",
                              borderRadius: "9999px",
                              background: "#8b5cf6",
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ color: "#e5e7eb", fontWeight: 500, fontSize: "0.875rem" }}>
                            {tag.name}
                          </span>
                        </div>
                      )}

                      <div
                        className="flex items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        style={{ gap: "0.125rem" }}
                      >
                        {editingTagId === tag.id ? (
                          <button
                            onClick={() => handleUpdateTag(tag.id)}
                            disabled={isSubmitting}
                            className="text-green-400 hover:bg-white/10 rounded transition-colors"
                            style={{ padding: "0.375rem 0.5rem", fontSize: "0.8rem", fontWeight: 600 }}
                          >
                            Save
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => { setEditingTagId(tag.id); setEditTagName(tag.name); }}
                              className="text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                              style={{ padding: "0.375rem" }}
                              title="Edit tag"
                            >
                              <PencilIcon width={15} height={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteTag(tag.id)}
                              disabled={isSubmitting}
                              className="text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                              style={{ padding: "0.375rem" }}
                              title="Delete tag"
                            >
                              <TrashIcon width={15} height={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Assign Tab */
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {localTags.length === 0 ? (
                <div className="text-center" style={{ padding: "2.5rem 1rem" }}>
                  <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
                    Create tags first in the "Manage Tags" tab.
                  </p>
                  <button
                    onClick={() => setActiveTab("manage")}
                    style={{ color: "#a78bfa", fontSize: "0.875rem" }}
                  >
                    To Manage Tags →
                  </button>
                </div>
              ) : sector.beacons.length === 0 ? (
                <p className="text-center" style={{ color: "#6b7280", fontSize: "0.875rem", padding: "2.5rem 1rem" }}>
                  No beacons in this sector.
                </p>
              ) : (
                sector.beacons.map((beacon) => {
                  const selectedTagIds = assignments[beacon.id] || [];
                  const domain = (() => { try { return new URL(beacon.url).hostname.replace("www.", ""); } catch { return beacon.url; } })();
                  return (
                    <div
                      key={beacon.id}
                      className="border border-white/5 flex flex-col"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: "0.625rem",
                        padding: "0.875rem",
                        gap: "0.75rem"
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {beacon.imageUrl ? (
                           <img src={beacon.imageUrl} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover flex-shrink-0" />
                        ) : beacon.faviconUrl ? (
                           <img src={beacon.faviconUrl} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover flex-shrink-0 bg-white/5" />
                        ) : (
                           <div className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-white/10 flex flex-shrink-0 items-center justify-center text-sm sm:text-lg font-bold text-white uppercase">{domain.charAt(0)}</div>
                        )}
                        <p
                          className="truncate flex-1"
                          style={{ color: "#d1d5db", fontWeight: 500, fontSize: "0.875rem" }}
                        >
                          {beacon.title}
                        </p>
                      </div>
                      <div className="flex flex-wrap" style={{ gap: "0.375rem" }}>
                        {localTags.map((tag) => {
                          const isSelected = selectedTagIds.includes(tag.id);
                          const isMaxed = !isSelected && selectedTagIds.length >= 5;
                          return (
                            <button
                              key={tag.id}
                              onClick={() => toggleTagAssignment(beacon.id, tag.id)}
                              disabled={isMaxed}
                              className="rounded-full border transition-all"
                              style={{
                                padding: "0.25rem 0.75rem",
                                fontSize: "0.78rem",
                                background: isSelected ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.05)",
                                borderColor: isSelected ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.1)",
                                color: isSelected ? "#c4b5fd" : "#9ca3af",
                                opacity: isMaxed ? 0.35 : 1,
                                cursor: isMaxed ? "not-allowed" : "pointer",
                              }}
                            >
                              {tag.name}
                            </button>
                          );
                        })}
                      </div>
                      {selectedTagIds.length > 0 && (
                        <p style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: "0.125rem" }}>
                          {selectedTagIds.length}/5 tags selected
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === "assign" && localTags.length > 0 && sector.beacons.length > 0 && (
          <div
            className="border-t border-white/10 flex justify-end"
            style={{ padding: "0.875rem 1.5rem", background: "rgba(0,0,0,0.2)" }}
          >
            <button
              onClick={handleSaveAssignments}
              disabled={isSavingAssignments}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
              style={{ padding: "0.625rem 1.5rem", fontSize: "0.875rem" }}
            >
              {isSavingAssignments ? "Saving..." : "Save Assignments"}
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

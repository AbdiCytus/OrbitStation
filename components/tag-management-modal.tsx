"use client";

import { useState, useEffect, useMemo } from "react";
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
  const [localTags, setLocalTags] = useState<Tag[]>(sectorTagsOverride || sector.tags || []);
  const [newTagName, setNewTagName] = useState("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState("");

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

  const [isClosing, setIsClosing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const tagUsageCount = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(assignments).forEach((tags) => {
      tags.forEach((tagId) => {
        counts[tagId] = (counts[tagId] || 0) + 1;
      });
    });
    return counts;
  }, [assignments]);

  const filteredLocalTags = useMemo(() => {
    return localTags.filter(tag => tag.name.toLowerCase().includes(modalSearchQuery.toLowerCase()));
  }, [localTags, modalSearchQuery]);

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
  const panelClass = isClosing || !isReady ? "translate-y-full sm:translate-y-0 sm:scale-95 opacity-0" : "translate-y-0 sm:scale-100 opacity-100";

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

  const handleDeleteTag = (tagId: string) => {
    setTagToDelete(tagId);
  };

  const executeDeleteTag = async () => {
    if (!tagToDelete) return;
    const tagId = tagToDelete;
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
    setTagToDelete(null);
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

      {/* Delete Confirm Modal */}
      {tagToDelete && (
        <div style={{ position: "absolute", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "1.5rem" }}>
          <div style={{ padding: "1.5rem", background: "var(--hsr-panel-bg)", borderRadius: "1rem", border: "1px solid var(--hsr-panel-border)", width: "90%", maxWidth: "400px", textAlign: "center", boxShadow: "var(--hsr-card-shadow)", backdropFilter: "var(--hsr-panel-blur)" }}>
            <TrashIcon width={32} height={32} style={{ color: "#ef4444", margin: "0 auto 1rem" }} />
            <h3 style={{ color: "var(--hsr-text-title)", fontSize: "1.1rem", marginBottom: "0.5rem" }}>Delete Tag?</h3>
            <p style={{ color: "var(--hsr-text-desc)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Are you sure? It will be removed from all beacons.</p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setTagToDelete(null)} disabled={isSubmitting} style={{ flex: 1, padding: "0.5rem", borderRadius: "0.5rem", background: "var(--hsr-action-bg-hover)", color: "var(--hsr-text-title)" }}>Cancel</button>
              <button onClick={executeDeleteTag} disabled={isSubmitting} style={{ flex: 1, padding: "0.5rem", borderRadius: "0.5rem", background: "#ef4444", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                {isSubmitting && <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin inline-block" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel */}
      <div
        className={`relative w-full sm:max-w-2xl flex flex-col overflow-hidden z-10 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] rounded-t-2xl sm:rounded-2xl ${panelClass}`}
        style={{
          background: "var(--hsr-panel-bg)",
          border: "1px solid var(--hsr-panel-border)",
          backdropFilter: "var(--hsr-panel-blur)",
        }}
      >
        {/* Added wrapper for height limits */}
        <div className="flex flex-col w-full h-full sm:h-auto min-h-[75vh] sm:min-h-[70vh] sm:max-h-[85vh]">
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--hsr-divider)" }}
        >
          <div className="flex items-center" style={{ gap: "0.625rem" }}>
            <span style={{ color: "var(--hsr-icon)", fontSize: "1.2rem" }}>🏷</span>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--hsr-text-title)" }}>
              Manage Tags
            </h2>
            <span
              style={{
                fontSize: "0.7rem",
                background: "var(--hsr-domain-pill-bg)",
                color: "var(--hsr-domain-text)",
                borderRadius: "9999px",
                padding: "0.15rem 0.6rem",
              }}
            >
              {sector.name}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="text-comet hover:text-starlight hover:bg-starlight/10 rounded-lg transition-colors"
            style={{ padding: "0.375rem" }}
          >
            <XMarkIcon width={20} height={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex" style={{ borderBottom: "1px solid var(--hsr-divider)" }}>
          {(["manage", "assign"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 text-sm font-semibold transition-colors"
              style={{
                padding: "0.75rem",
                color: activeTab === tab ? "var(--hsr-text-title)" : "var(--hsr-text-desc)",
                borderBottom: activeTab === tab ? "2px solid var(--hsr-icon)" : "2px solid transparent",
                background: activeTab === tab ? "var(--hsr-action-bg)" : "transparent",
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
                  className="flex-1 transition-all focus:outline-none"
                  style={{ 
                    padding: "0.6rem 0.875rem", 
                    fontSize: "0.875rem",
                    background: "var(--hsr-input-bg)",
                    border: "1px solid var(--hsr-input-border)",
                    color: "var(--hsr-text-title)",
                    borderRadius: "0.5rem"
                  }}
                />
                <button
                  onClick={handleAddTag}
                  disabled={isSubmitting || !newTagName.trim()}
                  className="disabled:opacity-40 rounded-lg font-medium transition-all flex items-center hover:-translate-y-[1px]"
                  style={{ 
                    padding: "0.6rem 1rem", gap: "0.375rem", flexShrink: 0, fontSize: "0.875rem",
                    background: "var(--hsr-visit-btn-bg)",
                    color: "var(--hsr-visit-btn-text)",
                    border: "1px solid var(--hsr-visit-btn-border)",
                    boxShadow: "var(--hsr-visit-btn-shadow)"
                  }}
                >
                  <PlusIcon width={16} height={16} />
                  <span>Add</span>
                </button>
              </div>

              {/* Tag List */}
              <div style={{ position: "relative" }}>
                 <input 
                    type="text" 
                    placeholder="Search tags..." 
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    style={{ width: "100%", background: "var(--hsr-input-bg)", border: "1px solid var(--hsr-input-border)", borderRadius: "6px", padding: "0.5rem 0.75rem", color: "var(--hsr-text-title)", fontSize: "0.875rem", outline: "none", marginBottom: "1rem" }}
                 />
              </div>
              
              {localTags.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center text-center"
                  style={{ padding: "2.5rem 1rem", gap: "0.5rem" }}
                >
                  <span style={{ fontSize: "2rem" }}>🏷️</span>
                  <p style={{ color: "var(--hsr-text-desc)", fontSize: "0.875rem" }}>
                    No tags in this sector yet.
                  </p>
                  <p style={{ color: "var(--hsr-text-desc)", fontSize: "0.8rem" }}>
                    Add your first tag above.
                  </p>
                </div>
              ) : filteredLocalTags.length === 0 ? (
                <p style={{ color: "var(--hsr-text-desc)", fontSize: "0.875rem", textAlign: "center", padding: "2.5rem 1rem" }}>
                  No matching tags found.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  {filteredLocalTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between transition-colors"
                      style={{
                        background: "var(--hsr-domain-pill-bg)",
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
                          className="flex-1 rounded focus:outline-none transition-all"
                          style={{ 
                            padding: "0.25rem 0.5rem", fontSize: "0.875rem",
                            background: "var(--hsr-input-bg)",
                            border: "1px solid var(--hsr-input-focus)",
                            color: "var(--hsr-text-title)"
                          }}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateTag(tag.id);
                            if (e.key === "Escape") setEditingTagId(null);
                          }}
                        />
                      ) : (
                        <div className="flex items-center" style={{ gap: "0.75rem" }}>
                          <span
                            style={{
                              width: "0.5rem",
                              height: "0.5rem",
                              borderRadius: "9999px",
                              background: "var(--hsr-icon)",
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ color: "var(--hsr-text-title)", fontWeight: 500, fontSize: "0.875rem" }}>
                            {tag.name}
                          </span>
                          <span style={{
                              fontSize: "0.65rem",
                              background: tagUsageCount[tag.id] ? "var(--hsr-action-pinned-bg)" : "var(--hsr-action-bg-hover)",
                              color: tagUsageCount[tag.id] ? "var(--hsr-action-pinned-text)" : "var(--hsr-text-desc)",
                              padding: "0.15rem 0.5rem",
                              borderRadius: "4px",
                              fontWeight: 600,
                          }}>
                              {tagUsageCount[tag.id] ? `${tagUsageCount[tag.id]} beacon${tagUsageCount[tag.id] > 1 ? 's' : ''}` : "Unused"}
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
                            className="text-[var(--hsr-icon)] hover:bg-[var(--hsr-action-bg-hover)] rounded transition-colors"
                            style={{ padding: "0.375rem 0.5rem", fontSize: "0.8rem", fontWeight: 600 }}
                          >
                            Save
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => { setEditingTagId(tag.id); setEditTagName(tag.name); }}
                              className="text-[var(--hsr-text-desc)] hover:text-[var(--hsr-text-title)] hover:bg-[var(--hsr-action-bg-hover)] rounded transition-colors"
                              style={{ padding: "0.375rem" }}
                              title="Edit tag"
                            >
                              <PencilIcon width={15} height={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteTag(tag.id)}
                              disabled={isSubmitting}
                              className="text-[var(--hsr-text-desc)] hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
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
                  <p style={{ color: "var(--hsr-text-desc)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
                    Create tags first in the "Manage Tags" tab.
                  </p>
                  <button
                    onClick={() => setActiveTab("manage")}
                    style={{ color: "var(--hsr-icon)", fontSize: "0.875rem" }}
                  >
                    To Manage Tags →
                  </button>
                </div>
              ) : sector.beacons.length === 0 ? (
                <p className="text-center" style={{ color: "var(--hsr-text-desc)", fontSize: "0.875rem", padding: "2.5rem 1rem" }}>
                  No beacons in this sector.
                </p>
              ) : (
                <>
                  <div style={{ position: "relative" }}>
                     <input 
                        type="text" 
                        placeholder="Search tags..." 
                        value={modalSearchQuery}
                        onChange={(e) => setModalSearchQuery(e.target.value)}
                        style={{ width: "100%", background: "var(--hsr-input-bg)", border: "1px solid var(--hsr-input-border)", borderRadius: "6px", padding: "0.5rem 0.75rem", color: "var(--hsr-text-title)", fontSize: "0.875rem", outline: "none", marginBottom: "0.25rem" }}
                     />
                  </div>
                  {sector.beacons.map((beacon) => {
                  const selectedTagIds = assignments[beacon.id] || [];
                  const domain = (() => { try { return new URL(beacon.url).hostname.replace("www.", ""); } catch { return beacon.url; } })();
                  return (
                    <div
                      key={beacon.id}
                      className="flex flex-col"
                      style={{
                        background: "var(--hsr-domain-pill-bg)",
                        borderRadius: "0.625rem",
                        padding: "0.875rem",
                        gap: "0.75rem"
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {beacon.imageUrl ? (
                           <img src={beacon.imageUrl} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover flex-shrink-0" />
                        ) : beacon.faviconUrl ? (
                           <img src={beacon.faviconUrl} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover flex-shrink-0 bg-starlight/5" />
                        ) : (
                           <div className="w-8 h-8 sm:w-10 sm:h-10 rounded flex flex-shrink-0 items-center justify-center text-sm sm:text-lg font-bold uppercase" style={{ background: "var(--hsr-action-bg-hover)", color: "var(--hsr-text-title)" }}>{domain.charAt(0)}</div>
                        )}
                        <p
                          className="truncate flex-1"
                          style={{ color: "var(--hsr-text-title)", fontWeight: 500, fontSize: "0.875rem" }}
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
                              className="rounded-full transition-all"
                              style={{
                                padding: "0.3rem 0.8rem",
                                fontSize: "0.78rem",
                                background: isSelected ? "var(--hsr-action-pinned-bg)" : "var(--hsr-action-bg-hover)",
                                color: isSelected ? "var(--hsr-action-pinned-text)" : "var(--hsr-text-desc)",
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
                        <p style={{ fontSize: "0.72rem", color: "var(--hsr-text-desc)", marginTop: "0.125rem" }}>
                          {selectedTagIds.length}/5 tags selected
                        </p>
                      )}
                    </div>
                  );
                })}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === "assign" && localTags.length > 0 && sector.beacons.length > 0 && (
          <div
            className="flex justify-end"
            style={{ padding: "0.875rem 1.5rem", background: "transparent", borderTop: "1px solid var(--hsr-divider)" }}
          >
            <button
              onClick={handleSaveAssignments}
              disabled={isSavingAssignments}
              className="disabled:opacity-50 rounded-lg transition-all hover:-translate-y-[1px]"
              style={{ 
                padding: "0.625rem 1.5rem", fontSize: "0.875rem", fontWeight: 500,
                background: "var(--hsr-visit-btn-bg)",
                color: "var(--hsr-visit-btn-text)",
                border: "1px solid var(--hsr-visit-btn-border)",
                boxShadow: "var(--hsr-visit-btn-shadow)"
              }}
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

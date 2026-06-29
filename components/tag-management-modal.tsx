"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { createTag, updateTag, deleteTag, assignTagsToBeacon } from "@/lib/actions";
import type { SectorWithBeacons, Tag, Beacon, BeaconTag } from "@/types";
import { useRouter } from "next/navigation";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  sector: SectorWithBeacons;
};

export default function TagManagementModal({ isOpen, onClose, sector }: Props) {
  const [activeTab, setActiveTab] = useState<"manage" | "assign">("manage");
  const router = useRouter();
  
  // Manage Tab State
  const [newTagName, setNewTagName] = useState("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assign Tab State: beaconId -> array of tagIds
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Initialize assignments from current sector state
      const initial: Record<string, string[]> = {};
      sector.beacons.forEach(b => {
        initial[b.id] = b.tags?.map(bt => bt.tagId) || [];
      });
      setAssignments(initial);
      setActiveTab("manage");
      setNewTagName("");
      setEditingTagId(null);
    }
  }, [isOpen, sector]);

  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => { setIsClosing(true); setTimeout(() => { onClose(); setIsClosing(false); }, 200); };

  if (!isOpen && !isClosing) return null;

  const tags = sector.tags || [];

  // --- Manage Tag Handlers ---
  const handleAddTag = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    if (trimmed.length > 20) return toast.error("Tag name is too long (max 20 characters)");
    if (tags.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) return toast.error("Tag already exists");

    setIsSubmitting(true);
    const res = await createTag(sector.id, trimmed);
    setIsSubmitting(false);
    
    if (res.error) toast.error(res.error);
    else {
      toast.success("Tag created!");
      setNewTagName("");
      router.refresh();
    }
  };

  const handleUpdateTag = async (tagId: string) => {
    const trimmed = editTagName.trim();
    if (!trimmed) return setEditingTagId(null);
    if (trimmed.length > 20) return toast.error("Tag name is too long (max 20 characters)");

    setIsSubmitting(true);
    const res = await updateTag(tagId, trimmed);
    setIsSubmitting(false);

    if (res.error) toast.error(res.error);
    else {
      toast.success("Tag updated!");
      setEditingTagId(null);
      router.refresh();
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;
    setIsSubmitting(true);
    const res = await deleteTag(tagId);
    setIsSubmitting(false);

    if (res.error) toast.error(res.error);
    else {
      toast.success("Tag deleted!");
      router.refresh();
    }
  };

  // --- Assign Tag Handlers ---
  const toggleTagAssignment = (beaconId: string, tagId: string) => {
    setAssignments(prev => {
      const current = prev[beaconId] || [];
      if (current.includes(tagId)) {
        return { ...prev, [beaconId]: current.filter(id => id !== tagId) };
      } else {
        if (current.length >= 5) {
          toast.error("Maximum 5 tags allowed per beacon");
          return prev;
        }
        return { ...prev, [beaconId]: [...current, tagId] };
      }
    });
  };

  const handleSaveAssignments = async () => {
    setIsSavingAssignments(true);
    let hasError = false;
    
    // We only need to save if something changed
    const promises = sector.beacons.map(async b => {
      const initialTagIds = b.tags?.map(bt => bt.tagId) || [];
      const currentTagIds = assignments[b.id] || [];
      
      const isChanged = initialTagIds.length !== currentTagIds.length || 
                        !initialTagIds.every(id => currentTagIds.includes(id));
      
      if (isChanged) {
        const res = await assignTagsToBeacon(b.id, currentTagIds);
        if (res.error) hasError = true;
      }
    });

    await Promise.all(promises);
    setIsSavingAssignments(false);

    if (hasError) toast.error("Some assignments failed to save");
    else {
      toast.success("Tag assignments saved!");
      router.refresh();
      handleClose(); // Close after save
    }
  };

  return (
    <AnimatePresence>
      {(isOpen || isClosing) && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center" style={{ padding: "1rem", paddingBottom: 0 }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isClosing ? 0 : 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: isClosing ? "100%" : 0, opacity: isClosing ? 0 : 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative bg-[#0b0c10] border-t sm:border border-white/10 sm:rounded-2xl w-full sm:max-w-2xl flex flex-col overflow-hidden max-h-[90vh] sm:max-h-[85vh] rounded-t-2xl shadow-2xl z-10"
          >
            {/* Header */}
            <div className="border-b border-white/10 flex items-center justify-between bg-black/20" style={{ padding: "1.5rem" }}>
              <h2 className="text-xl font-bold text-white">Manage Tags</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                style={{ padding: "0.5rem" }}
              >
                <XMarkIcon width={24} height={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button
                className={`flex-1 text-sm font-semibold transition-colors ${activeTab === "manage" ? "text-violet-400 border-b-2 border-violet-500 bg-violet-500/10" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"}`}
                style={{ padding: "0.75rem 0" }}
                onClick={() => setActiveTab("manage")}
              >
                Manage Tags
              </button>
              <button
                className={`flex-1 text-sm font-semibold transition-colors ${activeTab === "assign" ? "text-violet-400 border-b-2 border-violet-500 bg-violet-500/10" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"}`}
                style={{ padding: "0.75rem 0" }}
                onClick={() => setActiveTab("assign")}
              >
                Assign Tags
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ padding: "1.5rem" }}>
              {activeTab === "manage" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {/* Create Tag */}
                  <div className="flex" style={{ gap: "0.5rem" }}>
                    <input
                      type="text"
                      placeholder="New tag name (max 20 chars)..."
                      maxLength={20}
                      value={newTagName}
                      onChange={e => setNewTagName(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                      style={{ padding: "0.625rem 1rem" }}
                      onKeyDown={e => e.key === "Enter" && handleAddTag()}
                    />
                    <button
                      onClick={handleAddTag}
                      disabled={isSubmitting || !newTagName.trim()}
                      className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center"
                      style={{ padding: "0.625rem 1rem", gap: "0.5rem" }}
                    >
                      <PlusIcon width={20} height={20} />
                      <span className="hidden sm:inline">Add Tag</span>
                    </button>
                  </div>

                  {/* Tag List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {tags.length === 0 ? (
                      <p className="text-gray-500 text-center" style={{ padding: "2rem 0" }}>No tags in this sector yet.</p>
                    ) : (
                      tags.map(tag => (
                        <div key={tag.id} className="flex items-center justify-between bg-white/5 rounded-lg border border-white/5 group hover:border-white/10 transition-colors" style={{ padding: "0.75rem" }}>
                          {editingTagId === tag.id ? (
                            <input
                              type="text"
                              value={editTagName}
                              onChange={e => setEditTagName(e.target.value)}
                              maxLength={20}
                              className="flex-1 bg-black/50 border border-violet-500/50 rounded text-white focus:outline-none focus:border-violet-400"
                              style={{ padding: "0.25rem 0.5rem" }}
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === "Enter") handleUpdateTag(tag.id);
                                if (e.key === "Escape") setEditingTagId(null);
                              }}
                            />
                          ) : (
                            <div className="flex items-center" style={{ gap: "0.5rem" }}>
                              <span className="w-2 h-2 rounded-full bg-violet-400" />
                              <span className="text-gray-200 font-medium">{tag.name}</span>
                            </div>
                          )}

                          <div className="flex items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" style={{ gap: "0.25rem" }}>
                            {editingTagId === tag.id ? (
                              <button onClick={() => handleUpdateTag(tag.id)} className="text-green-400 hover:bg-white/10 rounded" style={{ padding: "0.375rem" }}>Save</button>
                            ) : (
                              <>
                                <button onClick={() => { setEditingTagId(tag.id); setEditTagName(tag.name); }} className="text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" style={{ padding: "0.375rem" }} title="Edit Tag">
                                  <PencilIcon width={18} height={18} />
                                </button>
                                <button onClick={() => handleDeleteTag(tag.id)} className="text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors" style={{ padding: "0.375rem" }} title="Delete Tag">
                                  <TrashIcon width={18} height={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {tags.length === 0 ? (
                    <div className="text-center" style={{ padding: "2rem 0" }}>
                      <p className="text-gray-500" style={{ marginBottom: "1rem" }}>No tags created yet.</p>
                      <button onClick={() => setActiveTab("manage")} className="text-violet-400 hover:text-violet-300">Go to Manage Tags</button>
                    </div>
                  ) : sector.beacons.length === 0 ? (
                    <p className="text-gray-500 text-center" style={{ padding: "2rem 0" }}>No beacons in this sector to assign tags to.</p>
                  ) : (
                    sector.beacons.map(beacon => {
                      const selectedTagIds = assignments[beacon.id] || [];
                      return (
                        <div key={beacon.id} className="bg-white/5 rounded-xl border border-white/5 flex flex-col" style={{ padding: "1rem", gap: "0.75rem" }}>
                          <h3 className="text-gray-200 font-medium truncate">{beacon.title}</h3>
                          <div className="flex flex-wrap" style={{ gap: "0.5rem" }}>
                            {tags.map(tag => {
                              const isSelected = selectedTagIds.includes(tag.id);
                              const isMaxed = !isSelected && selectedTagIds.length >= 5;
                              return (
                                <button
                                  key={tag.id}
                                  onClick={() => toggleTagAssignment(beacon.id, tag.id)}
                                  disabled={isMaxed && !isSelected}
                                  className={`text-sm rounded-full border transition-all ${
                                    isSelected 
                                      ? "bg-violet-600/20 border-violet-500/50 text-violet-300" 
                                      : "bg-black/40 border-white/10 text-gray-400 hover:border-white/30 hover:text-gray-200"
                                  } ${isMaxed && !isSelected ? "opacity-30 cursor-not-allowed" : ""}`}
                                  style={{ padding: "0.25rem 0.75rem" }}
                                >
                                  {tag.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {activeTab === "assign" && (
              <div className="border-t border-white/10 bg-black/20 flex justify-end" style={{ padding: "1.5rem" }}>
                <button
                  onClick={handleSaveAssignments}
                  disabled={isSavingAssignments}
                  className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors"
                  style={{ padding: "0.625rem 1.5rem" }}
                >
                  {isSavingAssignments ? "Saving..." : "Save Assignments"}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

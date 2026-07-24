"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, EyeIcon, EyeSlashIcon, KeyIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ChangePasswordModal({ isOpen, onClose }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setError("Current password is required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to change password");
      } else {
        toast.success("Password changed successfully!");
        onClose();
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" style={{ padding: "1rem" }} onClick={onClose}>
      <motion.div 
        className="w-full max-w-md overflow-hidden"
        style={{ background: "var(--glass-bg)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid var(--color-border)", borderRadius: "16px", boxShadow: "var(--shadow-modal)" }}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between" style={{ padding: "1.25rem", borderBottom: "1px solid var(--color-border)" }}>
          <div className="flex items-center" style={{ gap: "0.75rem" }}>
            <KeyIcon className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-medium text-white">Change Password</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors" style={{ padding: "0.375rem" }}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col" style={{ padding: "1.25rem", gap: "1rem" }}>
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: "auto" }} 
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-center bg-red-500/10 rounded-lg border border-red-500/20 text-red-400"
                style={{ padding: "0.75rem" }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col" style={{ gap: "0.375rem" }}>
            <label className="text-sm text-gray-300" style={{ marginLeft: "0.25rem" }}>Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                className="input w-full bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                style={{ padding: "0.75rem" }}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" onClick={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col" style={{ gap: "0.375rem" }}>
            <label className="text-sm text-gray-300" style={{ marginLeft: "0.25rem" }}>New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                className="input w-full bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                style={{ padding: "0.75rem" }}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" onClick={() => setShowNew(!showNew)}>
                {showNew ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col" style={{ gap: "0.375rem" }}>
            <label className="text-sm text-gray-300" style={{ marginLeft: "0.25rem" }}>Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                className="input w-full bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                style={{ padding: "0.75rem" }}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex" style={{ marginTop: "1rem", gap: "0.75rem" }}>
            <button type="button" onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/10" style={{ padding: "0.75rem", borderRadius: "12px" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 text-white font-medium transition-all disabled:opacity-50 flex justify-center items-center" style={{ padding: "0.75rem", borderRadius: "12px", background: "linear-gradient(135deg, #8b5cf6, #6366f1)", boxShadow: "0 4px 14px rgba(139, 92, 246, 0.4)" }}>
              {loading ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Update Password"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

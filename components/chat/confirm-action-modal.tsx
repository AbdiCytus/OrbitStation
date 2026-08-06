import React from "react";
import { motion, AnimatePresence } from "framer-motion";

type ConfirmActionModalProps = {
  confirmAction: { type: "kick" | "clear"; targetUser?: any } | null;
  onCancel: () => void;
  onConfirmClear: () => void;
  onConfirmKick: () => void;
};

export default function ConfirmActionModal({
  confirmAction,
  onCancel,
  onConfirmClear,
  onConfirmKick,
}: ConfirmActionModalProps) {
  return (
    <AnimatePresence>
      {confirmAction && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="flex flex-col gap-4 w-full max-w-[400px] rounded-2xl p-6 shadow-2xl"
            style={{
              background: "rgba(20,20,30,0.95)",
              border: "1px solid rgba(239,68,68,0.3)",
              backdropFilter: "blur(12px)",
              padding: "20px",
            }}
          >
            <h3 className="text-[#ef4444] text-xl font-bold m-0">
              {confirmAction.type === "clear" ? "Clear Chat History?" : "Kick Member?"}
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed m-0">
              {confirmAction.type === "clear"
                ? "Are you absolutely sure you want to clear all messages in this group chat? This action cannot be undone and will affect all members."
                : `Are you sure you want to kick ${confirmAction.targetUser?.name || confirmAction.targetUser?.username} (@${confirmAction.targetUser?.username}) from this sector? They will lose access immediately.`}
            </p>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-xl bg-transparent text-gray-400 hover:text-white border border-white/20 transition-colors cursor-pointer"
                style={{ padding: "8px 24px" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmAction.type === "clear" ? onConfirmClear : onConfirmKick}
                className="px-4 py-2 rounded-xl bg-[#ef4444] hover:bg-red-600 text-white font-semibold border-none transition-colors cursor-pointer"
                style={{ padding: "8px 24px" }}
              >
                {confirmAction.type === "clear" ? "Clear Messages" : "Kick Member"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

type DeleteAccountModalProps = {
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
};

export default function DeleteAccountModal({
  isOpen,
  isDeleting,
  onClose,
  onConfirmDelete,
}: DeleteAccountModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <div
            style={{
              background: "#111",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "400px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                color: "#ef4444",
              }}>
              Delete Account
            </h3>
            <p
              style={{
                color: "gray",
                fontSize: "0.875rem",
                lineHeight: "1.5",
              }}>
              Are you absolutely sure you want to delete your account? This action
              cannot be undone. All your data, settings, beacons, sectors,
              friendships, and messages will be permanently deleted from our
              servers.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "16px",
              }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "transparent",
                  color: "gray",
                  border: "1px solid rgba(255,255,255,0.2)",
                  cursor: "pointer",
                }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirmDelete}
                disabled={isDeleting}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                {isDeleting ? "Deleting..." : "Yes, Delete Account"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

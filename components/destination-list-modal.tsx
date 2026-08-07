"use client";

import React, { useEffect, useCallback } from "react";
import type { Beacon } from "@/types";
import { incrementBeaconVisit } from "@/lib/actions/beacon.actions";
import {
  RocketLaunchIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { normalizeUrl } from "@/lib/url-utils";
import { motion, AnimatePresence } from "framer-motion"; // Tambahan Framer Motion

type Props = {
  beacon: (Beacon & { branches?: { id?: string; name: string; url: string }[] }) | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function DestinationListModal({ beacon, isOpen, onClose }: Props) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const branches = beacon?.branches || [];

  const handleLaunch = (url: string) => {
    if (!beacon) return;
    const targetUrl = normalizeUrl(url);
    incrementBeaconVisit(beacon.id);
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  const getCleanDomain = (url: string) => {
    try {
      return url.replace(/^https?:\/\//, "");
    } catch {
      return url;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && beacon && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            zIndex: 10000,
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={onClose}
        >
          <motion.div
            className="modal-panel glass"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              width: "100%",
              maxWidth: "440px",
              background: "rgba(15, 15, 23, 0.96)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              borderRadius: "var(--radius-lg, 16px)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7), 0 0 25px rgba(139, 92, 246, 0.15)",
              padding: 0,
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="modal-header"
              style={{
                padding: "1.25rem 1.5rem 1rem",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                background: "rgba(139, 92, 246, 0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2
                  className="modal-title"
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    margin: 0,
                  }}
                >
                  <RocketLaunchIcon
                    width={20}
                    height={20}
                    style={{ color: "white" }}
                  />
                  Select Destination
                </h2>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-comet, #94a3b8)",
                    margin: "0.25rem 0 0",
                  }}
                >
                  Choose which link to launch for <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{beacon.title}</span>
                </p>
              </div>
              <button
                className="btn-icon modal-close"
                onClick={onClose}
                aria-label="Close"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <XMarkIcon width={18} height={18} />
              </button>
            </div>

            {/* Body / Destination Buttons */}
            <div
              className="modal-body hide-scrollbar"
              style={{
                padding: "1.25rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                maxHeight: "65vh",
                overflowY: "auto",
              }}
            >
              {/* Main / Primary URL */}
              <button
                type="button"
                className="btn destination-btn"
                onClick={() => handleLaunch(beacon.url)}
                style={{
                  padding: "0.85rem 1rem",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background:
                    "linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(59, 130, 246, 0.15) 100%)",
                  border: "1px solid rgba(139, 92, 246, 0.5)",
                  borderRadius: "var(--radius-md, 12px)",
                  transition: "all var(--transition-fast, 0.15s ease)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.9)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(139, 92, 246, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.5)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "8px",
                      background: "rgba(139, 92, 246, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: "#c4b5fd",
                    }}
                  >
                    <StarSolid width={18} height={18} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "var(--color-starlight, #ffffff)",
                          fontSize: "0.92rem",
                        }}
                      >
                        Main URL
                      </span>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          padding: "0.1rem 0.45rem",
                          borderRadius: "9999px",
                          background: "rgba(139, 92, 246, 0.4)",
                          color: "#e9d5ff",
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                        }}
                      >
                        PRIMARY
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-comet, #94a3b8)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginTop: "0.15rem",
                      }}
                    >
                      {getCleanDomain(beacon.url)}
                    </div>
                  </div>
                </div>
                <ArrowTopRightOnSquareIcon
                  width={16}
                  height={16}
                  style={{ color: "#c4b5fd", flexShrink: 0, marginLeft: "0.5rem" }}
                />
              </button>

              {/* Branch URLs */}
              {branches.map((branch, idx) => (
                <button
                  key={branch.id || `${branch.name}-${idx}`}
                  type="button"
                  className="btn destination-btn"
                  onClick={() => handleLaunch(branch.url)}
                  style={{
                    padding: "0.85rem 1rem",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "var(--radius-md, 12px)",
                    transition: "all var(--transition-fast, 0.15s ease)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "8px",
                        background: "rgba(255, 255, 255, 0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        color: "var(--color-comet, #94a3b8)",
                      }}
                    >
                      <LinkIcon width={16} height={16} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "var(--color-starlight, #ffffff)",
                          fontSize: "0.88rem",
                          display: "block",
                        }}
                      >
                        {branch.name}
                      </span>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-comet, #94a3b8)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginTop: "0.15rem",
                        }}
                      >
                        {getCleanDomain(branch.url)}
                      </div>
                    </div>
                  </div>
                  <ArrowTopRightOnSquareIcon
                    width={16}
                    height={16}
                    style={{
                      color: "var(--color-comet, #94a3b8)",
                      flexShrink: 0,
                      marginLeft: "0.5rem",
                    }}
                  />
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
"use client";

import { useEffect, useState } from "react";
import {
  LinkIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

export type BeaconBranchItem = {
  id?: string;
  name: string;
  url: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  branches: BeaconBranchItem[];
  onChange: (branches: BeaconBranchItem[]) => void;
  autoHttps?: boolean;
};

function normalizeBranchUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

export default function MultiUrlModal({
  isOpen,
  onClose,
  branches,
  onChange,
  autoHttps = true,
}: Props) {
  const [localBranches, setLocalBranches] = useState<BeaconBranchItem[]>(branches);

  useEffect(() => {
    setLocalBranches(branches);
  }, [branches]);

  if (!isOpen) return null;

  const handleAdd = () => {
    const updated = [...localBranches, { name: "", url: "" }];
    setLocalBranches(updated);
    onChange(updated);
  };

  const handleRemove = (idx: number) => {
    const updated = localBranches.filter((_, i) => i !== idx);
    setLocalBranches(updated);
    onChange(updated);
  };

  const handleNameChange = (idx: number, name: string) => {
    const updated = [...localBranches];
    updated[idx] = { ...updated[idx], name };
    setLocalBranches(updated);
    onChange(updated);
  };

  const handleUrlChange = (idx: number, urlVal: string) => {
    let cleanVal = urlVal;
    if (autoHttps) {
      cleanVal = urlVal.replace(/^(https?:\/\/)+/, "");
    }
    const updated = [...localBranches];
    updated[idx] = { ...updated[idx], url: cleanVal };
    setLocalBranches(updated);
    onChange(updated);
  };

  const handleUrlBlur = (idx: number) => {
    const current = localBranches[idx]?.url || "";
    if (!current) return;

    let normalized = current;
    if (autoHttps) {
      normalized = normalizeBranchUrl(current).replace(/^https?:\/\//, "");
    }
    const updated = [...localBranches];
    updated[idx] = { ...updated[idx], url: normalized };
    setLocalBranches(updated);
    onChange(updated);
  };

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 10000,
        background: "rgba(3, 7, 18, 0.85)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Manage Multi URLs"
    >
      <div
        className="modal-panel glass"
        style={{
          width: "92%",
          maxWidth: "520px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg, #111122 0%, #0c0d16 100%)",
          border: "1px solid rgba(139, 92, 246, 0.25)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(139, 92, 246, 0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(139, 92, 246, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c4b5fd",
                border: "1px solid rgba(139, 92, 246, 0.3)",
              }}
            >
              <LinkIcon width={18} height={18} />
            </div>
            <div>
              <h2
                className="modal-title"
                style={{ fontSize: "1.1rem", margin: 0, fontWeight: 600, color: "#fff" }}
              >
                Multi-URL Destinations
              </h2>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-comet)" }}>
                Add alternate links under this beacon
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon modal-close"
            onClick={onClose}
            aria-label="Close"
            style={{ color: "var(--color-comet)" }}
          >
            <XMarkIcon width={18} height={18} />
          </button>
        </div>

        {/* Body */}
        <div
          className="modal-body"
          style={{
            padding: "1.25rem 1.5rem",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            flex: 1,
          }}
        >
          {localBranches.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "2rem 1rem",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px dashed rgba(255, 255, 255, 0.1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "rgba(139, 92, 246, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#a78bfa",
                }}
              >
                <ArrowTopRightOnSquareIcon width={22} height={22} />
              </div>
              <div>
                <p style={{ fontWeight: 600, color: "#fff", margin: 0, fontSize: "0.9rem" }}>
                  No alternate URLs yet
                </p>
                <p
                  style={{
                    color: "var(--color-comet)",
                    fontSize: "0.75rem",
                    margin: "0.25rem 0 0",
                    maxWidth: "280px",
                  }}
                >
                  Add extra destinations like Documentation, GitHub repository, staging app, etc.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAdd}
                className="btn btn-primary btn-sm"
                style={{
                  marginTop: "0.5rem",
                  gap: "0.4rem",
                  padding: "0.45rem 1rem",
                }}
              >
                <PlusIcon width={16} height={16} />
                <span>Add First URL</span>
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {localBranches.map((branch, idx) => (
                <div
                  key={branch.id || idx}
                  style={{
                    padding: "0.85rem",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "#a78bfa",
                        background: "rgba(139, 92, 246, 0.15)",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "4px",
                      }}
                    >
                      Branch #{idx + 1}
                    </span>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleRemove(idx)}
                      title="Remove URL"
                      aria-label="Remove URL"
                      style={{
                        color: "#f87171",
                        width: "24px",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(239, 68, 68, 0.1)",
                        borderRadius: "6px",
                      }}
                    >
                      <TrashIcon width={14} height={14} />
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {/* Name input */}
                    <div style={{ flex: "1 1 140px" }}>
                      <label
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--color-comet)",
                          marginBottom: "0.25rem",
                          display: "block",
                        }}
                      >
                        Label / Name
                      </label>
                      <input
                        className="input input-sm"
                        style={{
                          width: "100%",
                          fontSize: "0.85rem",
                          background: "rgba(0,0,0,0.3)",
                        }}
                        placeholder="e.g. GitHub, Docs, API"
                        value={branch.name}
                        onChange={(e) => handleNameChange(idx, e.target.value)}
                        maxLength={50}
                      />
                    </div>

                    {/* URL input */}
                    <div style={{ flex: "2 1 200px" }}>
                      <label
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--color-comet)",
                          marginBottom: "0.25rem",
                          display: "block",
                        }}
                      >
                        URL
                      </label>
                      <div
                        className="url-input-wrap"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "var(--radius-md)",
                          overflow: "hidden",
                        }}
                      >
                        {autoHttps && (
                          <span
                            style={{
                              padding: "0 0.35rem 0 0.6rem",
                              color: "var(--color-comet)",
                              fontSize: "0.78rem",
                              userSelect: "none",
                            }}
                          >
                            https://
                          </span>
                        )}
                        <input
                          className="input input-sm"
                          style={{
                            border: "none",
                            borderRadius: 0,
                            flex: 1,
                            outline: "none",
                            boxShadow: "none",
                            background: "transparent",
                            fontSize: "0.85rem",
                            padding: autoHttps ? "0.35rem 0.6rem 0.35rem 0" : "0.35rem 0.6rem",
                          }}
                          placeholder="example.com/subpage"
                          value={branch.url}
                          onChange={(e) => handleUrlChange(idx, e.target.value)}
                          onBlur={() => handleUrlBlur(idx)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAdd}
                className="btn btn-secondary"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  fontSize: "0.8rem",
                  gap: "0.4rem",
                  borderStyle: "dashed",
                  color: "#c4b5fd",
                  borderColor: "rgba(139, 92, 246, 0.4)",
                  background: "rgba(139, 92, 246, 0.05)",
                }}
              >
                <PlusIcon width={15} height={15} />
                <span>Add Another URL</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="modal-footer"
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            style={{ minWidth: "90px", fontSize: "0.85rem", padding: "0.45rem 1.25rem" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

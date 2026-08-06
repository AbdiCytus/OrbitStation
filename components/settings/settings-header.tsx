"use client";

import React from "react";

type SettingsTab = "profile" | "public" | "preferences" | "shortcuts" | "developer";

type SettingsHeaderProps = {
  activeTab: SettingsTab;
  status: "idle" | "saving" | "saved" | "error";
  isScrolled: boolean;
  onBack: () => void;
};

export default function SettingsHeader({
  activeTab,
  status,
  isScrolled,
  onBack,
}: SettingsHeaderProps) {
  return (
    <>
      {/* DESKTOP UNIFIED HEADER */}
      <div className="hidden md:block">
        <div
          className="settings-page-header"
          style={{
            padding: "1.5rem 2rem",
            borderBottom: "1px solid var(--glass-border)",
            background: "var(--glass-bg)",
            backdropFilter: "var(--glass-blur)",
            position: "sticky",
            top: "60px",
            zIndex: 40,
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}>
          <div>
            <h1 className="settings-page-title m-0">
              {activeTab === "profile" && "Profile"}
              {activeTab === "public" && "Public Station"}
              {activeTab === "preferences" && "Preferences"}
              {activeTab === "shortcuts" && "Shortcuts"}
              {activeTab === "developer" && "Developer"}
            </h1>
            <p className="settings-page-sub m-0 mt-1">
              {activeTab === "profile" &&
                "Manage your personal profile details."}
              {activeTab === "public" &&
                "Customize how others see your station."}
              {activeTab === "preferences" && "Adjust your station experience."}
              {activeTab === "shortcuts" &&
                "Configure quick navigation keys."}
              {activeTab === "developer" &&
                "Register apps to use Orbit Station as a login provider."}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {status === "saved" && (
              <span
                style={{
                  color: "#4ade80",
                  fontSize: "0.875rem",
                  marginRight: "0.5rem",
                }}>
                ✓ Saved
              </span>
            )}
            <button
              type="button"
              className="btn btn-secondary shadow-lg shadow-black/50"
              onClick={onBack}
              style={{
                background: "rgba(15, 15, 20, 0.9)",
                backdropFilter: "blur(12px)",
              }}>
              Back
            </button>
            <button
              type="submit"
              className="btn btn-primary shadow-lg shadow-purple-500/30"
              disabled={status === "saving"}>
              {status === "saving" ? (
                <span className="spinner" />
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE HEADERS */}
      {/* Split Title */}
      <div className="md:hidden">
        <div
          className="settings-page-header"
          style={{
            padding: "2rem 2rem 0.5rem 2rem",
            background: "var(--glass-bg)",
            backdropFilter: "var(--glass-blur)",
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
          }}>
          <h1 className="settings-page-title m-0">Settings</h1>
          <p className="settings-page-sub m-0 mt-1">
            Manage your Orbit Station profile and preferences.
          </p>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div
        className="flex md:hidden"
        style={{
          padding: "0.5rem 2rem 1rem 2rem",
          position: "sticky",
          top: "60px",
          zIndex: 40,
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "0.5rem",
          pointerEvents: "none",
          background: "var(--glass-bg)",
          backdropFilter: "var(--glass-blur)",
          borderBottom: "1px solid var(--glass-border)",
          borderTop: isScrolled
            ? "1px solid var(--glass-border)"
            : "1px solid transparent",
          borderLeft: isScrolled
            ? "1px solid var(--glass-border)"
            : "1px solid transparent",
          borderRight: isScrolled
            ? "1px solid var(--glass-border)"
            : "1px solid transparent",
          borderTopLeftRadius: isScrolled ? "16px" : "0",
          borderTopRightRadius: isScrolled ? "16px" : "0",
          borderBottomLeftRadius: isScrolled ? "16px" : "0",
          borderBottomRightRadius: isScrolled ? "16px" : "0",
          transition: "all 0.3s ease",
        }}>
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            width: "100%",
            justifyContent: "flex-end",
          }}>
          {status === "saved" && (
            <span
              style={{
                color: "#4ade80",
                fontSize: "0.875rem",
                marginRight: "auto",
                background: "rgba(0,0,0,0.6)",
                padding: "4px 12px",
                borderRadius: "999px",
                backdropFilter: "blur(8px)",
              }}>
              ✓ Saved
            </span>
          )}
          <button
            type="button"
            className="btn btn-secondary shadow-lg shadow-black/50"
            onClick={onBack}
            style={{
              background: "rgba(15, 15, 20, 0.9)",
              backdropFilter: "blur(12px)",
            }}>
            Back
          </button>
          <button
            type="submit"
            className="btn btn-primary shadow-lg shadow-purple-500/30"
            disabled={status === "saving"}>
            {status === "saving" ? (
              <span className="spinner" />
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </>
  );
}

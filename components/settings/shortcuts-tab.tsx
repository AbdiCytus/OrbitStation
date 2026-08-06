"use client";

import React from "react";
import type { SettingsShortcuts } from "./types";

type ShortcutsTabProps = {
  isActive: boolean;
  shortcuts: SettingsShortcuts;
  handleShortcutKeyDown: (
    keyName: keyof SettingsShortcuts,
  ) => (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

export default function ShortcutsTab({
  isActive,
  shortcuts,
  handleShortcutKeyDown,
}: ShortcutsTabProps) {
  return (
    <section
      className="settings-section settings-inner-section desktop-only-section"
      style={{ display: isActive ? "flex" : "none" }}>
      <h2 className="settings-section-title md:text-2xl mb-6">Shortcuts</h2>
      <p className="text-gray-400 text-sm mb-6">
        Configure keyboard shortcuts for quick navigation on desktop.
      </p>

      <div className="flex flex-col gap-4">
        <div className="form-group flex flex-row items-center justify-between rounded-lg border border-white/10">
          <label className="form-label text-sm text-gray-300 mb-0">
            My Station
          </label>
          <input
            className="input bg-black/30 border border-white/10 rounded-lg text-center font-mono focus:border-purple-500 uppercase"
            value={shortcuts.myStation}
            readOnly
            onKeyDown={handleShortcutKeyDown("myStation")}
            placeholder="Press key..."
          />
        </div>
        <div className="form-group flex flex-row items-center justify-between rounded-lg border border-white/10">
          <label className="form-label text-sm text-gray-300 mb-0">
            Public Station
          </label>
          <input
            className="input bg-black/30 border border-white/10 rounded-lg text-center font-mono focus:border-purple-500 uppercase"
            value={shortcuts.publicStation}
            readOnly
            onKeyDown={handleShortcutKeyDown("publicStation")}
            placeholder="Press key..."
          />
        </div>
        <div className="form-group flex flex-row items-center justify-between rounded-lg border border-white/10">
          <label className="form-label text-sm text-gray-300 mb-0">
            Friends
          </label>
          <input
            className="input bg-black/30 border border-white/10 rounded-lg text-center font-mono focus:border-purple-500 uppercase"
            value={shortcuts.friends}
            readOnly
            onKeyDown={handleShortcutKeyDown("friends")}
            placeholder="Press key..."
          />
        </div>
        <div className="form-group flex flex-row items-center justify-between rounded-lg border border-white/10">
          <label className="form-label text-sm text-gray-300 mb-0">
            Analytics
          </label>
          <input
            className="input bg-black/30 border border-white/10 rounded-lg text-center font-mono focus:border-purple-500 uppercase"
            value={shortcuts.analytics}
            readOnly
            onKeyDown={handleShortcutKeyDown("analytics")}
            placeholder="Press key..."
          />
        </div>
        <div className="form-group flex flex-row items-center justify-between rounded-lg border border-white/10">
          <label className="form-label text-sm text-gray-300 mb-0">
            Settings
          </label>
          <input
            className="input bg-black/30 border border-white/10 rounded-lg text-center font-mono focus:border-purple-500 uppercase"
            value={shortcuts.settings}
            readOnly
            onKeyDown={handleShortcutKeyDown("settings")}
            placeholder="Press key..."
          />
        </div>
      </div>
    </section>
  );
}

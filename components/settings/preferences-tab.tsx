"use client";

import React from "react";
import { toast } from "sonner";

type PreferencesTabProps = {
  isActive: boolean;
  animationEnabled: boolean;
  setAnimationEnabled: (enabled: boolean) => void;
  hologramEnabled: boolean;
  setHologramEnabled: (enabled: boolean) => void;
  staticBackgroundEnabled: boolean;
  setStaticBackgroundEnabled: (enabled: boolean) => void;
  saveFilterSortEnabled: boolean;
  setSaveFilterSortEnabled: (enabled: boolean) => void;
  allowFriendRequests: boolean;
  setAllowFriendRequests: (allowed: boolean) => void;
  autoHttps: boolean;
  setAutoHttps: (enabled: boolean) => void;
  autoFetchMeta: boolean;
  setAutoFetchMeta: (enabled: boolean) => void;
  notifSoundEnabled: boolean;
  setNotifSoundEnabled: (enabled: boolean) => void;
  notifSoundType: "default" | "custom";
  setNotifSoundType: (type: "default" | "custom") => void;
  notifSoundUrl: string;
  setNotifSoundUrl: (url: string) => void;
  handleAudioFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function PreferencesTab({
  isActive,
  animationEnabled,
  setAnimationEnabled,
  hologramEnabled,
  setHologramEnabled,
  staticBackgroundEnabled,
  setStaticBackgroundEnabled,
  saveFilterSortEnabled,
  setSaveFilterSortEnabled,
  allowFriendRequests,
  setAllowFriendRequests,
  autoHttps,
  setAutoHttps,
  autoFetchMeta,
  setAutoFetchMeta,
  notifSoundEnabled,
  setNotifSoundEnabled,
  notifSoundType,
  setNotifSoundType,
  notifSoundUrl,
  setNotifSoundUrl,
  handleAudioFileChange,
}: PreferencesTabProps) {
  return (
    <section
      className="settings-section settings-inner-section"
      style={{ display: isActive ? "flex" : "none" }}>
      <h2 className="settings-section-title md:text-2xl mb-6">Preferences</h2>

      <div className="flex flex-col gap-4">
        {/* Animation toggle */}
        <div
          className="settings-toggle-row p-4 rounded-lg border border-white/10"
          style={{ padding: "1rem" }}>
          <div className="settings-toggle-info">
            <span className="settings-toggle-label text-white font-medium">
              Enable Animations
            </span>
            <span className="settings-toggle-desc text-sm text-gray-400 mt-1">
              Starfield canvas, floating beacons, sector transitions. Disable
              for performance or accessibility.
            </span>
          </div>
          <label className="toggle-switch" htmlFor="toggle-animation">
            <input
              id="toggle-animation"
              type="checkbox"
              checked={animationEnabled}
              onChange={(e) => {
                setAnimationEnabled(e.target.checked);
                if (e.target.checked) {
                  setStaticBackgroundEnabled(false);
                }
              }}
            />
            <span className="toggle-thumb" />
          </label>
        </div>

        {/* Hologram toggle */}
        <div
          className="settings-toggle-row p-4 rounded-lg border border-white/10 md:flex hidden"
          style={{ padding: "1rem" }}>
          <div className="settings-toggle-info">
            <span className="settings-toggle-label text-white font-medium">
              Hologram Effect
            </span>
            <span className="settings-toggle-desc text-sm text-gray-400 mt-1">
              Show a holographic text effect when hovering over beacons.
            </span>
          </div>
          <label className="toggle-switch" htmlFor="toggle-hologram">
            <input
              id="toggle-hologram"
              type="checkbox"
              checked={hologramEnabled}
              onChange={(e) => setHologramEnabled(e.target.checked)}
            />
            <span className="toggle-thumb" />
          </label>
        </div>

        {/* Static Background toggle */}
        {!animationEnabled && (
          <div
            className="settings-toggle-row p-4 rounded-lg border border-white/10"
            style={{ padding: "1rem" }}>
            <div className="settings-toggle-info">
              <span className="settings-toggle-label text-white font-medium">
                Static Background Mode
              </span>
              <span className="settings-toggle-desc text-sm text-gray-400 mt-1">
                Use a completely static space image instead of dynamic particle
                background.
              </span>
            </div>
            <label className="toggle-switch" htmlFor="toggle-static-bg">
              <input
                id="toggle-static-bg"
                type="checkbox"
                checked={staticBackgroundEnabled}
                onChange={(e) => setStaticBackgroundEnabled(e.target.checked)}
              />
              <span className="toggle-thumb" />
            </label>
          </div>
        )}

        {/* Save Filter & Sort toggle */}
        <div
          className="settings-toggle-row p-4 rounded-lg border border-white/10"
          style={{ padding: "1rem" }}>
          <div className="settings-toggle-info">
            <span className="settings-toggle-label text-white font-medium">
              Save My Filter & Sort
            </span>
            <span className="settings-toggle-desc text-sm text-gray-400 mt-1">
              Automatically remember your active filter and sort preferences per
              sector across sessions.
            </span>
          </div>
          <label className="toggle-switch" htmlFor="toggle-save-filter">
            <input
              id="toggle-save-filter"
              type="checkbox"
              checked={saveFilterSortEnabled}
              onChange={(e) => setSaveFilterSortEnabled(e.target.checked)}
            />
            <span className="toggle-thumb" />
          </label>
        </div>

        {/* Friend Requests toggle */}
        <div
          className="settings-toggle-row p-4 rounded-lg border border-white/10"
          style={{ padding: "1rem" }}>
          <div className="settings-toggle-info">
            <span className="settings-toggle-label text-white font-medium">
              Allow Friend Requests
            </span>
            <span className="settings-toggle-desc text-sm text-gray-400 mt-1">
              Show the &quot;Add Friend&quot; button on your Public Profile to
              other logged-in pilots.
            </span>
          </div>
          <label className="toggle-switch" htmlFor="toggle-friend-request">
            <input
              id="toggle-friend-request"
              type="checkbox"
              checked={allowFriendRequests}
              onChange={(e) => setAllowFriendRequests(e.target.checked)}
            />
            <span className="toggle-thumb" />
          </label>
        </div>

        {/* Auto-prefix HTTPS toggle */}
        <div
          className="settings-toggle-row p-4 rounded-lg border border-white/10"
          style={{ padding: "1rem" }}>
          <div className="settings-toggle-info">
            <span className="settings-toggle-label text-white font-medium">
              Auto Prefix HTTPS
            </span>
            <span className="settings-toggle-desc text-sm text-gray-400 mt-1">
              Automatically fill &apos;https://&apos; when adding a new beacon
              URL.
            </span>
          </div>
          <label className="toggle-switch" htmlFor="toggle-auto-https">
            <input
              id="toggle-auto-https"
              type="checkbox"
              checked={autoHttps}
              onChange={(e) => setAutoHttps(e.target.checked)}
            />
            <span className="toggle-thumb" />
          </label>
        </div>

        {/* Auto Fetch Metadata toggle */}
        <div
          className="settings-toggle-row p-4 rounded-lg border border-white/10"
          style={{ padding: "1rem" }}>
          <div className="settings-toggle-info">
            <span className="settings-toggle-label text-white font-medium">
              Auto Fetch Metadata
            </span>
            <span className="settings-toggle-desc text-sm text-gray-400 mt-1">
              Automatically fetch website title, description, and image when
              entering a URL.
            </span>
          </div>
          <label className="toggle-switch" htmlFor="toggle-auto-fetch">
            <input
              id="toggle-auto-fetch"
              type="checkbox"
              checked={autoFetchMeta}
              onChange={(e) => setAutoFetchMeta(e.target.checked)}
            />
            <span className="toggle-thumb" />
          </label>
        </div>

        {/* Notification Sound Group */}
        <div
          className="p-4 rounded-lg border border-white/10"
          style={{ padding: "1rem" }}>
          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-label text-white font-medium">
                Notification Sound
              </span>
              <span className="settings-toggle-desc text-sm text-gray-400 mt-1">
                Play a sound when you receive a new message or friend request.
              </span>
            </div>
            <label className="toggle-switch" htmlFor="toggle-notif-sound">
              <input
                id="toggle-notif-sound"
                type="checkbox"
                checked={notifSoundEnabled}
                onChange={(e) => setNotifSoundEnabled(e.target.checked)}
              />
              <span className="toggle-thumb" />
            </label>
          </div>

          {notifSoundEnabled && (
            <div
              className="mt-4 p-4 bg-black/20 rounded-lg border border-white/5 flex flex-col gap-4"
              style={{ padding: "1rem" }}>
              <div
                className="flex gap-3 flex-wrap flex-col md:flex-row"
                style={{ padding: "0.5rem" }}>
                <label
                  className={`flex-1 flex items-center justify-center gap-2 rounded-md cursor-pointer transition-all ${
                    notifSoundType === "default"
                      ? "bg-purple-500/15 border-purple-500/40 text-purple-300"
                      : "bg-white/5 border-white/10 text-gray-400"
                  }`}
                  style={{
                    borderStyle: "solid",
                    borderWidth: "1px",
                    padding: "0.5rem",
                  }}>
                  <input
                    type="radio"
                    name="soundType"
                    className="hidden"
                    checked={notifSoundType === "default"}
                    onChange={() => {
                      setNotifSoundType("default");
                      setNotifSoundUrl("/sounds/notif-default.mp3");
                    }}
                  />
                  <div
                    className={`w-4 h-4 rounded-full transition-all ${
                      notifSoundType === "default"
                        ? "border-4 border-purple-400"
                        : "border-2 border-gray-600"
                    }`}
                  />
                  <span className="text-sm font-semibold">System Default</span>
                </label>

                <label
                  className={`flex-1 flex items-center justify-center gap-2 rounded-md cursor-pointer transition-all ${
                    notifSoundType === "custom"
                      ? "bg-purple-500/15 border-purple-500/40 text-purple-300"
                      : "bg-white/5 border-white/10 text-gray-400"
                  }`}
                  style={{
                    borderStyle: "solid",
                    borderWidth: "1px",
                    padding: "0.5rem",
                  }}>
                  <input
                    type="radio"
                    name="soundType"
                    className="hidden"
                    checked={notifSoundType === "custom"}
                    onChange={() => {
                      setNotifSoundType("custom");
                      setNotifSoundUrl(""); // Reset url agar siap di-upload
                    }}
                  />
                  <div
                    className={`w-4 h-4 rounded-full transition-all ${
                      notifSoundType === "custom"
                        ? "border-4 border-purple-400"
                        : "border-2 border-gray-600"
                    }`}
                  />
                  <span className="text-sm font-semibold">Custom Upload</span>
                </label>
              </div>

              {notifSoundType === "custom" && (
                <div
                  className="flex items-center bg-black/30 rounded-lg border border-dashed border-white/20 flex-wrap"
                  style={{ padding: "1rem" }}>
                  <input
                    type="file"
                    accept="audio/mp3, audio/mpeg, audio/wav, audio/ogg"
                    onChange={handleAudioFileChange}
                    className="flex-1 text-xs text-gray-300 cursor-pointer"
                  />
                  <button
                    type="button"
                    disabled={
                      !notifSoundUrl ||
                      notifSoundUrl === "/sounds/notif-default.mp3"
                    }
                    onClick={() => {
                      const audio = new Audio(notifSoundUrl);
                      audio.volume = 0.5;
                      audio
                        .play()
                        .catch(() =>
                          toast.error(
                            "Could not play sound. Format might be unsupported.",
                          ),
                        );
                    }}
                    className={`text-xs px-4 py-2 rounded-sm font-semibold transition-all ${
                      !notifSoundUrl ||
                      notifSoundUrl === "/sounds/notif-default.mp3"
                        ? "bg-white/5 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_10px_rgba(109,40,217,0.4)]"
                    }`}
                    style={{ padding: "0.5rem" }}>
                    Play Test
                  </button>
                </div>
              )}
              {notifSoundType === "custom" &&
                notifSoundUrl &&
                notifSoundUrl.startsWith("data:audio") && (
                  <span className="text-xs text-emerald-400 ml-1">
                    ✓ Custom audio ready to be saved
                  </span>
                )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

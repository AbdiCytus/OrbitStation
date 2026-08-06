"use client";

import React from "react";
import type { SettingsProfile, FormErrors } from "./types";

type ProfileTabProps = {
  isActive: boolean;
  profile: SettingsProfile;
  name: string;
  setName: (name: string) => void;
  username: string;
  setUsername: (username: string) => void;
  callsign: string;
  setCallsign: (callsign: string) => void;
  bio: string;
  setBio: (bio: string) => void;
  image: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formErrors: FormErrors;
  setFormErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  errorMsg: string;
  setShowPasswordModal: (show: boolean) => void;
};

export default function ProfileTab({
  isActive,
  profile,
  name,
  setName,
  username,
  setUsername,
  callsign,
  setCallsign,
  bio,
  setBio,
  image,
  fileInputRef,
  handleFileChange,
  formErrors,
  setFormErrors,
  errorMsg,
  setShowPasswordModal,
}: ProfileTabProps) {
  return (
    <section
      className="settings-section settings-inner-section"
      style={{ display: isActive ? "flex" : "none" }}>
      <h2 className="settings-section-title md:text-2xl mb-6">Profile</h2>

      {/* Avatar row */}
      <div className="settings-avatar-row mb-8">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <div
          className="settings-avatar group relative overflow-hidden"
          style={{ cursor: "pointer", width: "80px", height: "80px" }}
          onClick={() => fileInputRef.current?.click()}
          data-tooltip="Change Avatar (Max 2MB)">
          {image ? (
            <img
              src={image}
              alt={profile.name ?? ""}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                background: "linear-gradient(135deg,#5b3fde,#22d3ee)",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                fontWeight: 800,
                color: "#fff",
              }}>
              {(profile.name ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-bold text-white tracking-widest">
            EDIT
          </div>
        </div>
        <div className="settings-avatar-info ml-4">
          <span className="settings-avatar-name text-lg">
            {profile.name ?? "No name"}
          </span>
          <span className="settings-avatar-email text-sm text-gray-400">
            {profile.email}
          </span>
        </div>
      </div>

      <div className="flex flex-col">
        {/* Display name */}
        <div className="form-group">
          <label className="form-label text-sm text-gray-300" htmlFor="s-name">
            Display Name
          </label>
          <input
            id="s-name"
            className="input w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 transition-colors"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setFormErrors((p) => ({ ...p, name: "" }));
            }}
            maxLength={60}
            placeholder="How others see your name"
          />
          {formErrors.name && (
            <span className="text-red-500 text-xs mt-1 block">
              {formErrors.name}
            </span>
          )}
        </div>

        {/* Username */}
        <div className="form-group">
          <label
            className="form-label text-sm text-gray-300"
            htmlFor="s-username">
            Username
            <span className="text-gray-500 text-xs ml-2 font-normal">
              — used in your public URL: /@username
            </span>
          </label>
          <input
            id="s-username"
            className="input w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 transition-colors"
            value={username}
            onChange={(e) => {
              setUsername(
                e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
              );
              setFormErrors((p) => ({ ...p, username: "" }));
            }}
            maxLength={32}
            placeholder="yourname"
          />
          {formErrors.username && (
            <span className="text-red-500 text-xs mt-1 block">
              {formErrors.username}
            </span>
          )}
          {errorMsg && errorMsg.toLowerCase().includes("username") && (
            <span className="text-red-500 text-xs mt-1 block">{errorMsg}</span>
          )}
        </div>

        {/* Callsign */}
        <div className="form-group">
          <label
            className="form-label text-sm text-gray-300"
            htmlFor="s-callsign">
            Callsign
            <span className="text-gray-500 text-xs ml-2 font-normal">
              — shown in dashboard instead of &quot;Pilot&quot;
            </span>
          </label>
          <input
            id="s-callsign"
            className="input w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 transition-colors"
            value={callsign}
            onChange={(e) => setCallsign(e.target.value)}
            maxLength={32}
            placeholder="e.g. Commander, Captain, Navigator…"
          />
        </div>

        {/* Bio */}
        <div className="form-group">
          <label className="form-label text-sm text-gray-300" htmlFor="s-bio">
            Bio
          </label>
          <textarea
            id="s-bio"
            className="input w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 transition-colors resize-y min-h-[100px]"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="Tell the galaxy about yourself…"
          />
        </div>

        {profile.hasPassword && (
          <>
            <hr className="border-white/10" style={{ margin: "1rem 0" }} />

            {/* Change Password Button */}
            <div className="form-group">
              <p className="text-sm text-gray-400 mb-3">
                Update your password to keep your account secure.
              </p>
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="w-full md:w-auto bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-colors flex items-center justify-center"
                style={{ padding: "0.75rem 1.5rem", gap: "0.5rem" }}>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                Change Password
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

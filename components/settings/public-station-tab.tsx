"use client";

import React from "react";
import { motion } from "framer-motion";
import { BADGE_REGISTRY } from "@/lib/badges/registry";
import * as SolidIcons from "@heroicons/react/24/solid";

const DynamicIcon = ({
  name,
  className,
}: {
  name: string;
  className?: string;
}) => {
  const Icon = (SolidIcons as any)[name];
  return Icon ? (
    <Icon className={className} />
  ) : (
    <SolidIcons.StarIcon className={className} />
  );
};

type PublicStationTabProps = {
  isActive: boolean;
  isPublic: boolean;
  setIsPublic: (isPublic: boolean) => void;
  username: string;
  allowPublicWorkspace: boolean;
  setAllowPublicWorkspace: (allow: boolean) => void;
  bannerUrl: string;
  setBannerUrl: (url: string) => void;
  titleBadge: string;
  setTitleBadge: (badgeId: string) => void;
  unlockedBadges: string[];
  openBadgeCategory: string;
  setOpenBadgeCategory: React.Dispatch<React.SetStateAction<string>>;
  setPreviewBadge: (badge: any) => void;
};

export default function PublicStationTab({
  isActive,
  isPublic,
  setIsPublic,
  username,
  allowPublicWorkspace,
  setAllowPublicWorkspace,
  bannerUrl,
  setBannerUrl,
  titleBadge,
  setTitleBadge,
  unlockedBadges,
  openBadgeCategory,
  setOpenBadgeCategory,
  setPreviewBadge,
}: PublicStationTabProps) {
  return (
    <section
      className="settings-section settings-inner-section"
      style={{ display: isActive ? "flex" : "none" }}>
      <h2 className="settings-section-title md:text-2xl mb-6">Public Station</h2>

      <div className="flex flex-col">
        {/* Public Profile toggle */}
        <div
          className="settings-toggle-row rounded-lg border border-white/10"
          style={{ padding: "1rem" }}>
          <div className="settings-toggle-info">
            <span className="settings-toggle-label text-white font-medium">
              Public Station
            </span>
            <span className="settings-toggle-desc text-sm text-gray-400 mt-1">
              Allow anyone to visit your Orbit Station via your public URL.
            </span>
            {isPublic && (
              <a
                href={`/station/${username}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm text-purple-400 hover:text-purple-300 transition-colors">
                View your public station ↗
              </a>
            )}
          </div>
          <label className="toggle-switch" htmlFor="toggle-public">
            <input
              id="toggle-public"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <span className="toggle-thumb" />
          </label>
        </div>

        {/* Allow Public Workspace Toggle */}
        <div
          className="settings-toggle-row rounded-lg border border-white/10 mt-4"
          style={{ padding: "1rem" }}>
          <div className="settings-toggle-info">
            <span className="settings-toggle-label text-white font-medium">
              Allow another pilot to visit my station workspace
            </span>
            <span className="settings-toggle-desc text-sm text-gray-400 mt-1">
              Allows other users to view your public sectors and beacons.
            </span>
          </div>
          <label
            className="toggle-switch"
            htmlFor="toggle-allow-public-workspace">
            <input
              id="toggle-allow-public-workspace"
              type="checkbox"
              checked={allowPublicWorkspace}
              onChange={(e) => setAllowPublicWorkspace(e.target.checked)}
            />
            <span className="toggle-thumb" />
          </label>
        </div>

        {/* Banner URL */}
        <div className="form-group">
          <label className="form-label text-sm text-gray-300" htmlFor="s-banner">
            Banner Image URL
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Used as the background banner on your public station profile. Leave
            blank to use default.
          </p>
          {bannerUrl && (
            <div className="beacon-preview-image mb-3 rounded-lg overflow-hidden border border-white/10">
              <img
                src={bannerUrl}
                alt="Banner preview"
                className="w-full h-32 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
          <input
            id="s-banner"
            className="input w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 transition-colors"
            type="url"
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
            placeholder="https://example.com/your-banner.jpg"
          />
        </div>

        {/* Title badge selection */}
        <div className="form-group">
          <label className="form-label text-sm text-gray-300">Title Badge</label>
          <p className="text-xs text-gray-500 mb-3">
            Unlock prestigious badges by reaching milestones in Orbit Station.
          </p>
          <div className="flex flex-col gap-8">
            {(() => {
              let globalIndex = 0;
              return [
                {
                  id: "biasa",
                  label: "Common Badges",
                  icon: "CheckBadgeIcon",
                  color:
                    "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]",
                },
                {
                  id: "ekslusif",
                  label: "Special Badges",
                  icon: "StarIcon",
                  color:
                    "text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.5)]",
                },
                {
                  id: "super-ekslusif",
                  label: "Premium Badges",
                  icon: "SparklesIcon",
                  color:
                    "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]",
                },
                {
                  id: "developer",
                  label: "Exclusive Badges",
                  icon: "CpuChipIcon",
                  color:
                    "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]",
                },
              ].map((group) => {
                const colorOrder: Record<string, number> = {
                  rose: 1,
                  pink: 2,
                  amber: 3,
                  emerald: 4,
                  cyan: 5,
                  blue: 6,
                  indigo: 7,
                  purple: 8,
                  gray: 9,
                };

                const sortedBadges = BADGE_REGISTRY.filter(
                  (b) => b.rarity === group.id,
                ).sort((a, b) => {
                  if (a.id === "rookie-pilot") return -1;
                  if (b.id === "rookie-pilot") return 1;
                  return (
                    (colorOrder[a.color] || 99) - (colorOrder[b.color] || 99)
                  );
                });

                const groupStartIndex = globalIndex;
                globalIndex += sortedBadges.length;

                return (
                  <div key={group.id} className="mb-2">
                    <div
                      className="flex justify-between items-center cursor-pointer md:cursor-default mb-3"
                      onClick={() => {
                        if (window.innerWidth < 768) {
                          setOpenBadgeCategory(
                            openBadgeCategory === group.id ? "" : group.id,
                          );
                        }
                      }}>
                      <h4
                        className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 m-0 ${group.color}`}
                        style={{ marginBottom: "0.5rem" }}>
                        <DynamicIcon name={group.icon} className="w-5 h-5" />
                        {group.label}
                      </h4>
                      <SolidIcons.ChevronDownIcon
                        className={`w-5 h-5 text-gray-400 md:hidden transition-transform duration-300 ${openBadgeCategory === group.id ? "rotate-180" : ""}`}
                      />
                    </div>
                    <motion.div
                      initial={false}
                      animate={{
                        height: openBadgeCategory === group.id ? "auto" : 0,
                        opacity: openBadgeCategory === group.id ? 1 : 0,
                      }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden md:!overflow-visible md:!h-auto md:!opacity-100"
                      style={{
                        paddingLeft: "1rem",
                        paddingRight: "1rem",
                        marginLeft: "-1rem",
                        marginRight: "-1rem",
                      }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {sortedBadges.map((badge) => {
                          const isUnlocked = unlockedBadges.includes(badge.id);
                          const isSelected = titleBadge === badge.id;

                          return (
                            <div
                              className="zodiac-orbit-wrapper"
                              style={{ position: "relative" }}
                              key={badge.id}>
                              {isUnlocked && badge.id === "zodiac-horizon" && (
                                <>
                                  <div className="badge-zodiac-orbit-1 badge-zodiac-orbit-back" />
                                  <div className="badge-zodiac-orbit-2 badge-zodiac-orbit-back" />
                                </>
                              )}
                              <div
                                onClick={() => {
                                  if (isUnlocked) setTitleBadge(badge.id);
                                  else setPreviewBadge(badge);
                                }}
                                className={`badge-card relative group p-4 rounded-xl border flex gap-3 items-center cursor-pointer ${
                                  isSelected
                                    ? `ring-2 ring-purple-500 ring-offset-2 ring-offset-[#0f0f16]`
                                    : isUnlocked
                                      ? "hover:scale-[1.02] hover:shadow-lg"
                                      : "bg-black/40 border-white/5 opacity-60 grayscale"
                                } ${isUnlocked ? badge.effectClass : ""}`}
                                style={{ position: "relative", zIndex: 1 }}>
                                {isUnlocked &&
                                  badge.id === "the-completionist" && (
                                    <div className="badge-wave-layer" />
                                  )}
                                {isUnlocked &&
                                  badge.id === "zodiac-horizon" && (
                                    <div className="badge-zodiac-wave-layer" />
                                  )}
                                <div
                                  className={`flex-1 min-w-0 flex items-center gap-2 pr-10`}>
                                  <div
                                    className={`badge-icon w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                                      isUnlocked
                                        ? ""
                                        : "bg-gray-800 text-gray-500 border border-gray-700 group-hover:bg-purple-500/20 group-hover:text-purple-400 group-hover:border-purple-500/50"
                                    }`}
                                    style={{ marginLeft: "0.5rem" }}>
                                    {isUnlocked ? (
                                      <DynamicIcon
                                        name={badge.icon}
                                        className="w-5 h-5 relative z-10"
                                      />
                                    ) : (
                                      <>
                                        <SolidIcons.LockClosedIcon className="w-5 h-5 relative z-10 block group-hover:hidden" />
                                        <SolidIcons.EyeIcon className="w-5 h-5 relative z-10 hidden group-hover:block" />
                                      </>
                                    )}
                                  </div>
                                  <div
                                    className="badge-content flex-1 min-w-0"
                                    style={{
                                      margin: "0.4rem 0",
                                      padding: "0 0.3rem",
                                    }}>
                                    <h4
                                      className={`text-sm font-bold truncate ${isUnlocked ? "text-white" : "text-gray-400"}`}>
                                      {badge.name}
                                    </h4>
                                    <p className="text-xs text-gray-400 leading-snug mt-0.5 max-h-[2rem] overflow-y-auto hide-scrollbar">
                                      {badge.hint}
                                    </p>
                                  </div>
                                </div>

                                {isSelected && (
                                  <div className="absolute top-1/2 -translate-y-1/2 right-3 text-white bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7] z-10">
                                    <SolidIcons.CheckCircleIcon className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                              {isUnlocked && badge.id === "zodiac-horizon" && (
                                <>
                                  <div className="badge-zodiac-orbit-1 badge-zodiac-orbit-front" />
                                  <div className="badge-zodiac-orbit-2 badge-zodiac-orbit-front" />
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </section>
  );
}

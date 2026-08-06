"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as SolidIcons from "@heroicons/react/24/solid";
import type { SettingsProfile } from "./types";

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

type BadgePreviewModalProps = {
  previewBadge: any;
  onClose: () => void;
  image: string;
  profile: SettingsProfile;
  name: string;
  username: string;
};

const getModalTint = (color?: string) => {
  const tintMap: Record<string, string> = {
    amber: "rgba(251, 191, 36, 0.15)",
    rose: "rgba(244, 63, 94, 0.15)",
    emerald: "rgba(16, 185, 129, 0.15)",
    cyan: "rgba(6, 182, 212, 0.15)",
    purple: "rgba(168, 85, 247, 0.15)",
    pink: "rgba(236, 72, 153, 0.15)",
    blue: "rgba(59, 130, 246, 0.15)",
    indigo: "rgba(99, 102, 241, 0.15)",
    gray: "rgba(156, 163, 175, 0.15)",
  };
  return color ? tintMap[color] || "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.05)";
};

const getModalBorder = (color?: string) => {
  const borderMap: Record<string, string> = {
    amber: "rgba(251, 191, 36, 0.3)",
    rose: "rgba(244, 63, 94, 0.3)",
    emerald: "rgba(16, 185, 129, 0.3)",
    cyan: "rgba(6, 182, 212, 0.3)",
    purple: "rgba(168, 85, 247, 0.3)",
    pink: "rgba(236, 72, 153, 0.3)",
    blue: "rgba(59, 130, 246, 0.3)",
    indigo: "rgba(99, 102, 241, 0.3)",
    gray: "rgba(156, 163, 175, 0.3)",
  };
  return color ? borderMap[color] || "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.1)";
};

export default function BadgePreviewModal({
  previewBadge,
  onClose,
  image,
  profile,
  name,
  username,
}: BadgePreviewModalProps) {
  return (
    <AnimatePresence>
      {previewBadge && (
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
          }}
          onClick={onClose}>
          <div
            style={{
              background: "#03000a",
              backgroundImage:
                "radial-gradient(circle at 50% 0%, #1a0b2e 0%, #03000a 80%)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              boxShadow:
                "0 10px 40px rgba(0,0,0,0.8), 0 0 20px rgba(139, 92, 246, 0.1)",
              borderRadius: "20px",
              padding: "24px",
              width: "100%",
              maxWidth: "550px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "white",
                  margin: 0,
                }}>
                Badge Preview
              </h3>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "gray",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                }}>
                <SolidIcons.XMarkIcon style={{ width: "24px", height: "24px" }} />
              </button>
            </div>

            {/* Preview Content */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "32px",
                alignItems: "center",
                width: "100%",
              }}>
              {/* Top Row: Avatar & Badge Card */}
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  gap: "24px",
                  alignItems: "flex-start",
                }}>
                {/* Avatar Preview (Left) */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flexShrink: 0,
                  }}>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#9ca3af",
                      marginBottom: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      fontWeight: "bold",
                      textAlign: "center",
                      margin: "0 0 12px 0",
                    }}>
                    Avatar Ring
                  </p>

                  <div
                    style={{
                      position: "relative",
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      padding: "4px",
                    }}
                    className={
                      previewBadge.rarity === "super-ekslusif" ||
                      previewBadge.rarity === "developer"
                        ? `avatar-badge avatar-exclusive-${previewBadge.id}`
                        : previewBadge.rarity === "ekslusif"
                          ? `avatar-badge avatar-badge-special-${previewBadge.color}`
                          : `avatar-badge avatar-badge-common-${previewBadge.color}`
                    }>
                    {previewBadge.id === "zodiac-horizon" && (
                      <>
                        <div className="avatar-exclusive-zodiac-horizon-orbit-1 avatar-exclusive-zodiac-horizon-orbit-back" />
                        <div className="avatar-exclusive-zodiac-horizon-orbit-2 avatar-exclusive-zodiac-horizon-orbit-back" />
                      </>
                    )}
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        overflow: "hidden",
                        position: "relative",
                        zIndex: 1,
                      }}
                      className={
                        previewBadge.rarity === "super-ekslusif" ||
                        previewBadge.rarity === "developer" ||
                        previewBadge.rarity === "ekslusif"
                          ? "public-badge-sweep"
                          : ""
                      }>
                      {image ? (
                        <img
                          src={image}
                          alt="Avatar"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            background:
                              "linear-gradient(135deg,#5b3fde,#22d3ee)",
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
                    </div>
                    {previewBadge.id === "zodiac-horizon" && (
                      <>
                        <div className="avatar-exclusive-zodiac-horizon-orbit-1 avatar-exclusive-zodiac-horizon-orbit-front" />
                        <div className="avatar-exclusive-zodiac-horizon-orbit-2 avatar-exclusive-zodiac-horizon-orbit-front" />
                      </>
                    )}
                  </div>
                </div>

                {/* Badge Card Preview (Right) */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                  }}>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#9ca3af",
                      marginBottom: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      fontWeight: "bold",
                      textAlign: "left",
                      margin: "0 0 12px 0",
                    }}>
                    Badge Card
                  </p>

                  <div
                    className="zodiac-orbit-wrapper"
                    style={{ position: "relative", width: "100%" }}>
                    {previewBadge.id === "zodiac-horizon" && (
                      <>
                        <div className="badge-zodiac-orbit-1 badge-zodiac-orbit-back" />
                        <div className="badge-zodiac-orbit-2 badge-zodiac-orbit-back" />
                      </>
                    )}
                    <div
                      className={`badge-card relative p-4 rounded-xl border flex gap-3 items-center ${previewBadge.effectClass}`}
                      style={{
                        position: "relative",
                        zIndex: 1,
                        overflow: "hidden",
                        margin: 0,
                        padding: "12px 16px",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        height: "80px",
                      }}>
                      {previewBadge.id === "the-completionist" && (
                        <div className="badge-wave-layer" />
                      )}
                      {previewBadge.id === "zodiac-horizon" && (
                        <div className="badge-zodiac-wave-layer" />
                      )}
                      <div
                        style={{
                          display: "flex",
                          flex: 1,
                          minWidth: 0,
                          alignItems: "center",
                          gap: "12px",
                          height: "100%",
                        }}>
                        <div
                          className="badge-icon"
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}>
                          <DynamicIcon
                            name={previewBadge.icon}
                            className="w-5 h-5 relative z-10"
                          />
                        </div>
                        <div
                          className="badge-content hide-scrollbar"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                            minWidth: 0,
                            maxHeight: "56px",
                            overflowY: "auto",
                            paddingRight: "4px",
                          }}>
                          <h4
                            style={{
                              margin: 0,
                              fontSize: "14px",
                              fontWeight: "bold",
                              color: "white",
                              flexShrink: 0,
                            }}>
                            {previewBadge.name}
                          </h4>
                          <p
                            style={{
                              margin: "2px 0 0 0",
                              fontSize: "12px",
                              color: "gray",
                              lineHeight: "1.2",
                            }}>
                            {previewBadge.hint}
                          </p>
                        </div>
                      </div>
                    </div>
                    {previewBadge.id === "zodiac-horizon" && (
                      <>
                        <div className="badge-zodiac-orbit-1 badge-zodiac-orbit-front" />
                        <div className="badge-zodiac-orbit-2 badge-zodiac-orbit-front" />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Popup Profile Preview */}
              <div style={{ width: "100%" }}>
                <p
                  style={{
                    fontSize: "12px",
                    color: "gray",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    fontWeight: "bold",
                    margin: "0 0 8px 0",
                  }}>
                  Popup Profile View
                </p>

                {(() => {
                  const isExclusive =
                    previewBadge.rarity === "super-ekslusif" ||
                    previewBadge.rarity === "developer";
                  const isSpecial = previewBadge.rarity === "ekslusif";
                  return (
                    <div
                      className={`chat-mention-modal ${isExclusive ? previewBadge.effectClass : ""} ${previewBadge.id === "shattered" ? "modal-shattered" : ""}`}
                      style={{
                        position: "relative",
                        padding: "24px",
                        backgroundColor: "rgba(15,15,25,0.95)",
                        backgroundImage: isSpecial
                          ? `radial-gradient(circle at top right, ${getModalTint(previewBadge.color)}, transparent)`
                          : undefined,
                        borderColor: getModalBorder(previewBadge.color),
                        borderWidth: "1px",
                        borderStyle: "solid",
                        backdropFilter: "blur(20px)",
                        borderRadius: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}>
                      {isExclusive && (
                        <div className="modal-exclusive-sparkles" />
                      )}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          overflow: "hidden",
                          borderRadius: "inherit",
                          pointerEvents: "none",
                          zIndex: 0,
                        }}
                        aria-hidden="true">
                        {previewBadge.id === "the-completionist" && (
                          <div className="modal-completionist-wave" />
                        )}
                        {previewBadge.id === "zodiac-horizon" && (
                          <div className="modal-zodiac-wave-layer" />
                        )}
                        {previewBadge.id === "zodiac-horizon" && (
                          <div className="modal-zodiac-blackhole" />
                        )}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          position: "relative",
                          zIndex: 10,
                        }}>
                        <div
                          style={{
                            position: "relative",
                            flexShrink: 0,
                            width: "64px",
                            height: "64px",
                            borderRadius: "50%",
                            padding: "3px",
                          }}
                          className={
                            previewBadge.rarity === "super-ekslusif" ||
                            previewBadge.rarity === "developer"
                              ? `avatar-badge avatar-exclusive-${previewBadge.id}`
                              : previewBadge.rarity === "ekslusif"
                                ? `avatar-badge avatar-badge-special-${previewBadge.color}`
                                : `avatar-badge avatar-badge-common-${previewBadge.color}`
                          }>
                          {previewBadge.id === "zodiac-horizon" && (
                            <>
                              <div className="avatar-exclusive-zodiac-horizon-orbit-1 avatar-exclusive-zodiac-horizon-orbit-back" />
                              <div className="avatar-exclusive-zodiac-horizon-orbit-2 avatar-exclusive-zodiac-horizon-orbit-back" />
                            </>
                          )}
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "50%",
                              overflow: "hidden",
                              position: "relative",
                              zIndex: 1,
                            }}
                            className={
                              previewBadge.rarity === "super-ekslusif" ||
                              previewBadge.rarity === "developer" ||
                              previewBadge.rarity === "ekslusif"
                                ? "public-badge-sweep"
                                : ""
                            }>
                            {image ? (
                              <img
                                src={image}
                                alt="Avatar"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  background:
                                    "linear-gradient(135deg,#5b3fde,#22d3ee)",
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "1.5rem",
                                  fontWeight: 800,
                                  color: "#fff",
                                }}>
                                {(profile.name ?? "?").charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          {previewBadge.id === "zodiac-horizon" && (
                            <>
                              <div className="avatar-exclusive-zodiac-horizon-orbit-1 avatar-exclusive-zodiac-horizon-orbit-front" />
                              <div className="avatar-exclusive-zodiac-horizon-orbit-2 avatar-exclusive-zodiac-horizon-orbit-front" />
                            </>
                          )}
                        </div>

                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                            zIndex: 10,
                            position: "relative",
                          }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              margin: 0,
                            }}>
                            <h4
                              style={{
                                margin: 0,
                                fontSize: "18px",
                                fontWeight: "bold",
                                color: "white",
                                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                              }}>
                              {name || profile.name || "Pilot"}
                            </h4>
                          </div>
                          <p
                            style={{
                              margin: "2px 0 0 0",
                              fontSize: "14px",
                              color: "gray",
                            }}>
                            @{username || profile.username || "pilot"}
                          </p>

                          <div
                            className={`badge-card ${previewBadge.rarity === "super-ekslusif" || previewBadge.rarity === "developer" || previewBadge.rarity === "ekslusif" ? "public-badge-sweep" : ""} ${previewBadge.effectClass}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "4px 20px 4px 4px",
                              borderRadius: "9999px",
                              border: "1px solid rgba(255,255,255,0.1)",
                              background: "rgba(0,0,0,0.3)",
                              marginTop: "6px",
                              position: "relative",
                              zIndex: 1,
                            }}>
                            <div
                              className="badge-icon"
                              style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}>
                              <DynamicIcon
                                name={previewBadge.icon}
                                className="w-[14px] h-[14px] relative z-10"
                              />
                            </div>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: "white",
                              }}>
                              {previewBadge.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

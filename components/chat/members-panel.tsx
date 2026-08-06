import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import { muteMember, unmuteMember } from "@/lib/actions/chat.actions";

type MembersPanelProps = {
  showMembers: boolean;
  sector: any;
  localCollaborators: any[];
  isOwner: boolean;
  isMuteAll: boolean;
  mutedMembers: string[];
  setMutedMembers: React.Dispatch<React.SetStateAction<string[]>>;
  onlineUserIds: Set<string>;
  setMentionDetail: (detail: { type: "user" | "beacon"; data: any } | null) => void;
};

export default function MembersPanel({
  showMembers,
  sector,
  localCollaborators,
  isOwner,
  isMuteAll,
  mutedMembers,
  setMutedMembers,
  onlineUserIds,
  setMentionDetail,
}: MembersPanelProps) {
  return (
    <AnimatePresence>
      {showMembers && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 240, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className="absolute right-0 top-0 bottom-0 sm:relative sm:top-auto sm:bottom-auto z-50 flex flex-col flex-shrink-0 h-full border-l border-white/10"
          style={{
            background: "rgba(15,15,25,0.95)",
            backdropFilter: "blur(12px)",
            overflow: "hidden",
          }}
        >
          {/* Members Header */}
          <div
            style={{
              padding: "16px 16px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <UserGroupIcon width={16} height={16} style={{ color: "#A78BFA", flexShrink: 0 }} />
            <h4 style={{ color: "white", fontWeight: 700, fontSize: "14px", margin: 0 }}>
              Members
            </h4>
            <span style={{ fontSize: "12px", color: "#6B7280", marginLeft: "auto" }}>
              {1 + (localCollaborators?.length || 0)}
            </span>
          </div>

          {/* Members List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {/* Owner */}
            {sector.station?.user && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.05)",
                  marginBottom: "4px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ position: "relative", width: "34px", height: "34px", flexShrink: 0 }}>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setMentionDetail({ type: "user", data: sector.station.user });
                      }}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        background: "#374151",
                        border: "2px solid #FFD700",
                        boxShadow: "0 0 8px rgba(255,215,0,0.5)",
                        overflow: "hidden",
                      }}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden relative">
                        {sector.station.user.image ? (
                          <img
                            src={sector.station.user.image}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: "bold",
                              color: "#D1D5DB",
                            }}
                          >
                            {sector.station.user.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Online indicator */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: -2,
                        right: -2,
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: onlineUserIds.has(sector.station.user.id) ? "#10B981" : "#4B5563",
                        border: "2px solid rgba(15,15,25,0.95)",
                        transition: "background 0.3s",
                      }}
                      data-tooltip={onlineUserIds.has(sector.station.user.id) ? "Online" : "Offline"}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "white",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "130px",
                      }}
                    >
                      {sector.station.user.name || sector.station.user.username}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#A78BFA",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Owner
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Collaborators */}
            {localCollaborators?.map((c: any) => {
              const isMuted = isMuteAll
                ? !mutedMembers.includes(c.user.id)
                : mutedMembers.includes(c.user.id);
              const isOnline = onlineUserIds.has(c.user.id);
              return (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: "10px",
                    marginBottom: "2px",
                    transition: "background 0.15s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ position: "relative", width: "34px", height: "34px", flexShrink: 0 }}>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setMentionDetail({ type: "user", data: c.user });
                        }}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          background: "#374151",
                          overflow: "hidden",
                          ...(c.role === "ADMIN"
                            ? { border: "2px solid #10B981" }
                            : { border: "1px solid rgba(255,255,255,0.1)" }),
                        } as any}
                      >
                        <div className="w-full h-full rounded-full overflow-hidden relative">
                          {c.user.image ? (
                            <img
                              src={c.user.image}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: "#D1D5DB",
                              }}
                            >
                              {c.user.username?.[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Online Indicator */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: -2,
                          right: -2,
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          background: isOnline ? "#10B981" : "#4B5563",
                          border: "2px solid rgba(15,15,25,0.95)",
                          transition: "background 0.3s",
                        }}
                        data-tooltip={isOnline ? "Online" : "Offline"}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#E5E7EB",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "100px",
                        }}
                      >
                        {c.user.name || c.user.username}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          color: c.role === "ADMIN" ? "#10B981" : "#9CA3AF",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {c.role}{" "}
                        {isMuted && <span style={{ color: "#F87171" }}>• MUTED</span>}
                      </span>
                    </div>
                  </div>
                  {isOwner && (
                    <button
                      onClick={async () => {
                        if (isMuted) {
                          await unmuteMember(sector.id, c.user.id);
                          setMutedMembers((prev) => prev.filter((id) => id !== c.user.id));
                        } else {
                          await muteMember(sector.id, c.user.id);
                          setMutedMembers((prev) => [...prev, c.user.id]);
                        }
                      }}
                      style={{
                        fontSize: "12px",
                        padding: "4px 8px",
                        background: "rgba(255,255,255,0.1)",
                        border: "none",
                        borderRadius: "6px",
                        color: "white",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        transition: "background 0.15s",
                      }}
                    >
                      {isMuted ? "Unmute" : "Mute"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import React from "react";
import { UserGroupIcon, QrCodeIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { DynamicIcon } from "@/components/dynamic-icon";

type ChatHeaderProps = {
  sector: any;
  collaboratorsCount: number;
  isOwner: boolean;
  amIAdmin: boolean;
  showMembers: boolean;
  setShowMembers: (show: boolean) => void;
  showQRModal: boolean;
  setShowQRModal: (show: boolean) => void;
  onClose: () => void;
};

export default function ChatHeader({
  sector,
  collaboratorsCount,
  isOwner,
  amIAdmin,
  showMembers,
  setShowMembers,
  showQRModal,
  setShowQRModal,
  onClose,
}: ChatHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(0,0,0,0.4)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "20px",
        flexShrink: 0,
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.1)",
            backgroundColor: sector?.color || "#8b5cf6",
            flexShrink: 0,
          }}
        >
          {sector?.icon && typeof sector.icon === "string" && sector.icon.endsWith("Icon") ? (
            <DynamicIcon name={sector.icon as any} className="w-6 h-6 text-white" />
          ) : (
            sector?.icon || "🌌"
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <h3
            style={{
              fontWeight: 700,
              color: "white",
              fontSize: "1.125rem",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            {sector?.name} Chat
          </h3>
          <div
            style={{
              fontSize: "0.75rem",
              color: "#C4B5FD",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <UserGroupIcon width={12} height={12} />
            {1 + collaboratorsCount} Members
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {(isOwner || amIAdmin) && sector?.inviteEnabled && (
          <button
            onClick={() => setShowQRModal(true)}
            style={{
              padding: "8px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              background: showQRModal ? "rgba(139,92,246,0.2)" : "transparent",
              color: showQRModal ? "#A78BFA" : "#9CA3AF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            data-tooltip="Share Invite QR"
          >
            <QrCodeIcon width={22} height={22} />
          </button>
        )}
        <button
          onClick={() => setShowMembers(!showMembers)}
          style={{
            padding: "8px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            background: showMembers ? "rgba(139,92,246,0.2)" : "transparent",
            color: showMembers ? "#A78BFA" : "#9CA3AF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          <UserGroupIcon width={22} height={22} />
        </button>
        <button
          onClick={onClose}
          style={{
            padding: "8px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            background: "transparent",
            color: "#9CA3AF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          <XMarkIcon width={22} height={22} />
        </button>
      </div>
    </div>
  );
}

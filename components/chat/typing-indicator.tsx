import React from "react";
import { motion } from "framer-motion";

type TypingIndicatorProps = {
  typingUsers: any[];
};

export default function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  return (
    <div style={{ padding: "4px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          display: "flex",
          gap: "4px",
          alignItems: "center",
          background: "rgba(0,0,0,0.6)",
          padding: "6px 12px",
          borderRadius: "999px",
          border: "1px solid rgba(255,255,255,0.05)",
          backdropFilter: "blur(4px)",
        }}
      >
        <span style={{ fontSize: "12px", color: "#A78BFA", fontWeight: 500 }}>
          {typingUsers.map((u: any) => u.name || u.username).join(", ")}{" "}
          {typingUsers.length > 1 ? "are" : "is"} typing
        </span>
        <div style={{ display: "flex", gap: "3px", marginLeft: "4px" }}>
          <motion.span
            animate={{ y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
            style={{
              width: "4px",
              height: "4px",
              background: "#A78BFA",
              borderRadius: "50%",
              display: "block",
            }}
          />
          <motion.span
            animate={{ y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
            style={{
              width: "4px",
              height: "4px",
              background: "#A78BFA",
              borderRadius: "50%",
              display: "block",
            }}
          />
          <motion.span
            animate={{ y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
            style={{
              width: "4px",
              height: "4px",
              background: "#A78BFA",
              borderRadius: "50%",
              display: "block",
            }}
          />
        </div>
      </div>
    </div>
  );
}

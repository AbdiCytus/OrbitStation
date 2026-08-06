import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";

type MessageInputProps = {
  replyToMsg: any | null;
  setReplyToMsg: (msg: any | null) => void;
  editMsgId: string | null;
  setEditMsgId: (id: string | null) => void;
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  isUserMuted: boolean;
  mentionQuery: any | null;
  mentionSuggestions: any[];
  mentionSelectedIndex: number;
  insertMention: (text: string) => void;
  suggestionContainerRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

export default function MessageInput({
  replyToMsg,
  setReplyToMsg,
  editMsgId,
  setEditMsgId,
  inputMessage,
  setInputMessage,
  handleInputChange,
  handleSendMessage,
  isUserMuted,
  mentionQuery,
  mentionSuggestions,
  mentionSelectedIndex,
  insertMention,
  suggestionContainerRef,
  inputRef,
  onKeyDown,
}: MessageInputProps) {
  return (
    <div
      style={{
        padding: "12px 16px",
        background: "rgba(0,0,0,0.5)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        position: "relative",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Reply Context */}
      {replyToMsg && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "8px",
            padding: "8px 12px",
            background: "rgba(139,92,246,0.1)",
            border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: "10px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "12px", color: "#A78BFA", fontWeight: 600 }}>
              Replying to {replyToMsg.sender?.name || replyToMsg.sender?.username}
            </span>
            <span
              style={{
                fontSize: "13px",
                color: "#D1D5DB",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "300px",
              }}
            >
              {replyToMsg.content}
            </span>
          </div>
          <button
            onClick={() => setReplyToMsg(null)}
            style={{
              padding: "4px",
              color: "#9CA3AF",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <XMarkIcon width={16} height={16} />
          </button>
        </div>
      )}

      {/* Edit Context */}
      {editMsgId && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "8px",
            padding: "8px 12px",
            background: "rgba(59,130,246,0.1)",
            border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: "10px",
          }}
        >
          <span style={{ fontSize: "12px", color: "#60A5FA", fontWeight: 600 }}>
            Editing Message
          </span>
          <button
            onClick={() => {
              setEditMsgId(null);
              setInputMessage("");
            }}
            style={{
              padding: "4px",
              color: "#9CA3AF",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <XMarkIcon width={16} height={16} />
          </button>
        </div>
      )}

      {/* Mention Suggestions */}
      <AnimatePresence>
        {mentionQuery && mentionSuggestions.length > 0 && (
          <motion.div
            ref={suggestionContainerRef as any}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              position: "absolute",
              bottom: "100%",
              left: "16px",
              marginBottom: "8px",
              background: "rgba(17,17,30,0.97)",
              border: "1px solid rgba(139,92,246,0.3)",
              borderRadius: "14px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              overflow: "hidden",
              zIndex: 20,
              maxHeight: "156px",
              overflowY: "auto",
              minWidth: "220px",
            }}
          >
            {mentionSuggestions.map((sg: any, idx: number) => (
              <div
                key={idx}
                onClick={() => insertMention(sg.text)}
                style={{
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  background:
                    idx === mentionSelectedIndex ? "rgba(139,92,246,0.3)" : "transparent",
                }}
              >
                {sg.image ? (
                  <img
                    src={sg.image}
                    alt=""
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "#374151",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: "bold",
                      flexShrink: 0,
                    }}
                  >
                    {sg.label[0]?.toUpperCase()}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "white",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "160px",
                      display: "block",
                    }}
                  >
                    {sg.label}
                  </span>
                  {sg.subtitle && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#9CA3AF",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {sg.subtitle}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "8px" }}>
        <input
          ref={inputRef}
          type="text"
          disabled={isUserMuted}
          placeholder={isUserMuted ? "You are muted in this group." : "Type a message..."}
          value={inputMessage}
          onChange={handleInputChange}
          onKeyDown={onKeyDown}
          style={{
            flex: 1,
            padding: "12px 20px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "999px",
            color: "white",
            outline: "none",
            fontSize: "14px",
            transition: "all 0.2s",
            opacity: isUserMuted ? 0.5 : 1,
          }}
          onFocus={(e) => {
            if (!isUserMuted) {
              e.target.style.background = "rgba(0,0,0,0.5)";
              e.target.style.border = "1px solid rgba(139,92,246,0.5)";
              e.target.style.boxShadow = "0 0 15px rgba(139,92,246,0.2)";
            }
          }}
          onBlur={(e) => {
            e.target.style.background = "rgba(255,255,255,0.05)";
            e.target.style.border = "1px solid rgba(255,255,255,0.1)";
            e.target.style.boxShadow = "none";
          }}
        />
        <button
          type="submit"
          disabled={isUserMuted || !inputMessage.trim()}
          style={{
            padding: "0 18px",
            background:
              isUserMuted || !inputMessage.trim() ? "rgba(255,255,255,0.05)" : "#8b5cf6",
            color:
              isUserMuted || !inputMessage.trim() ? "rgba(255,255,255,0.2)" : "white",
            border: "none",
            borderRadius: "999px",
            cursor: isUserMuted || !inputMessage.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            boxShadow:
              isUserMuted || !inputMessage.trim()
                ? "none"
                : "0 0 15px rgba(139,92,246,0.4)",
          }}
        >
          <PaperAirplaneIcon width={20} height={20} />
        </button>
      </form>
    </div>
  );
}

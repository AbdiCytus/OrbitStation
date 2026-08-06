import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPinIcon,
  XMarkIcon,
  ArrowUturnLeftIcon,
  ClipboardDocumentIcon,
  LinkIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { pinGroupMessageAction, unpinGroupMessageAction } from "@/lib/actions/chat.actions";

type MessageListProps = {
  messages: any[];
  user: any;
  sector: any;
  isOwner: boolean;
  amIAdmin: boolean;
  localCollaborators: any[];
  pinnedMessage: any | null;
  setPinnedMessage: (msg: any | null) => void;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  chatReady: boolean;
  isLoading: boolean;
  swipeOffset: { id: string; x: number } | null;
  selectedMsgId: string | null;
  setSelectedMsgId: (id: string | null) => void;
  amIBlinded: boolean;
  handleScroll: () => void;
  handlePressStart: (msgId: string) => void;
  handlePressEnd: () => void;
  handleTouchStartSwipe: (e: React.TouchEvent, msgId: string) => void;
  handleTouchMoveSwipe: (e: React.TouchEvent, msg: any) => void;
  handleTouchEndSwipe: () => void;
  setMentionDetail: (detail: { type: "user" | "beacon"; data: any } | null) => void;
  setReplyToMsg: (msg: any | null) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  setEditMsgId: (id: string | null) => void;
  setInputMessage: (msg: string) => void;
  handleDeleteMsg: (msgId: string) => void;
};

export default function MessageList({
  messages,
  user,
  sector,
  isOwner,
  amIAdmin,
  localCollaborators,
  pinnedMessage,
  setPinnedMessage,
  messagesContainerRef,
  messagesEndRef,
  chatReady,
  isLoading,
  swipeOffset,
  selectedMsgId,
  setSelectedMsgId,
  amIBlinded,
  handleScroll,
  handlePressStart,
  handlePressEnd,
  handleTouchStartSwipe,
  handleTouchMoveSwipe,
  handleTouchEndSwipe,
  setMentionDetail,
  setReplyToMsg,
  inputRef,
  setEditMsgId,
  setInputMessage,
  handleDeleteMsg,
}: MessageListProps) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <AnimatePresence>
        {pinnedMessage && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-20 bg-[rgba(20,20,30,0.95)] backdrop-blur-md border-b border-violet-500/30 py-2 px-4 flex items-center justify-between shadow-lg"
          >
            <div
              className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer"
              style={{ padding: "10px" }}
              onClick={() => {
                const el = document.getElementById(`msg-${pinnedMessage.id}`);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            >
              <MapPinIcon width={24} height={24} className="text-violet-400 shrink-0" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-violet-400 text-[10px] font-bold uppercase tracking-wide">
                  {pinnedMessage.sender?.name || pinnedMessage.sender?.username}
                </span>
                <span className="text-gray-200 text-sm truncate line-clamp-1">
                  {pinnedMessage.content}
                </span>
              </div>
            </div>
            {(isOwner || amIAdmin) && (
              <button
                onClick={async () => {
                  setPinnedMessage(null);
                  await unpinGroupMessageAction(sector.id);
                }}
                className="text-gray-500 hover:text-white bg-transparent border-none cursor-pointer"
                style={{ padding: "10px 0", marginRight: "20px" }}
              >
                <XMarkIcon width={18} height={18} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Messages List */}
      <div
        ref={messagesContainerRef as any}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          paddingTop: pinnedMessage ? "64px" : "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          opacity: chatReady ? 1 : 0,
          transition: chatReady ? "opacity 0.2s ease-out" : "none",
          visibility: chatReady ? "visible" : "hidden",
        }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-80 mt-10">
            {/* Spinner bergaya radar kosmos */}
            <div className="w-10 h-10 border-4 border-white/5 border-t-violet-500 rounded-full animate-spin"></div>
            <span className="text-violet-400 text-xs font-bold tracking-[0.2em] uppercase animate-pulse">
              Establishing Connection...
            </span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50 mt-10">
            <span className="text-4xl">🌌</span>
            <span className="text-gray-400 text-sm">
              No signals detected yet. Be the first to transmit.
            </span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === user.id;
            const isMsgOwner =
              msg.senderId === sector.station?.userId ||
              msg.senderId === sector.station?.user?.id ||
              (isOwner && isMine);
            const showOptions = selectedMsgId === msg.id;
            const isSending = !!msg._isSending;

            if (msg.type === "SYSTEM") {
              return (
                <div
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  style={{ textAlign: "center", margin: "4px 0" }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "rgba(156,163,175,1)",
                      background: "rgba(255,255,255,0.05)",
                      padding: "4px 12px",
                      borderRadius: "999px",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {msg.sender?.name || msg.sender?.username} {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                id={`msg-${msg.id}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMine ? "flex-end" : "flex-start",
                  position: "relative",
                  opacity: isSending ? 0.5 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "flex-end", gap: "8px", maxWidth: "85%" }}
                >
                  {!isMine && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        const targetUser =
                          localCollaborators?.find((c: any) => c.user.id === msg.senderId)
                            ?.user ||
                          (sector.station?.userId === msg.senderId
                            ? sector.station.user
                            : msg.sender);
                        if (targetUser) setMentionDetail({ type: "user", data: targetUser });
                      }}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      style={
                        {
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "#374151",
                          overflow: "hidden",
                          flexShrink: 0,
                          ...(isMsgOwner
                            ? {
                                border: "2px solid #FFD700",
                                boxShadow: "0 0 12px 2px rgba(255,215,0,0.8)",
                              }
                            : localCollaborators.find((c: any) => c.userId === msg.senderId)
                                ?.role === "ADMIN"
                            ? { border: "2px solid #10B981" }
                            : {
                                border: "1px solid rgba(255,255,255,0.1)",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                              }),
                        } as any
                      }
                    >
                      <div className="w-full h-full rounded-full overflow-hidden relative">
                        {msg.sender?.image ? (
                          <img
                            src={msg.sender.image}
                            alt={msg.sender.name}
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
                              fontSize: "11px",
                              fontWeight: "bold",
                              color: "#D1D5DB",
                            }}
                          >
                            {msg.sender?.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMine ? "flex-end" : "flex-start",
                    }}
                  >
                    {!isMine && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "6px",
                          marginLeft: "4px",
                          marginBottom: "4px",
                        }}
                      >
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "#D1D5DB" }}>
                          {msg.sender?.name || msg.sender?.username}
                        </span>
                        <span style={{ fontSize: "10px", color: "#6B7280" }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                    {isMine && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          marginBottom: "4px",
                          marginRight: "4px",
                        }}
                      >
                        <span style={{ fontSize: "10px", color: "#6B7280" }}>
                          {isSending
                            ? "Sending..."
                            : new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                        </span>
                      </div>
                    )}

                    <motion.div
                      animate={{
                        x: swipeOffset && swipeOffset.id === msg.id ? swipeOffset.x : 0,
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      onMouseDown={() => handlePressStart(msg.id)}
                      onMouseUp={handlePressEnd}
                      onMouseLeave={handlePressEnd}
                      onTouchStart={(e) => handleTouchStartSwipe(e, msg.id)}
                      onTouchEnd={handleTouchEndSwipe}
                      onTouchMove={(e) => handleTouchMoveSwipe(e, msg)}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      style={{
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        padding: "10px 14px",
                        borderRadius: "18px",
                        width: "fit-content",
                        cursor: "pointer",
                        transition:
                          "background 0.15s, border 0.15s, color 0.15s, border-radius 0.15s, box-shadow 0.15s",
                        wordBreak: "break-word",
                        fontSize: "15px",
                        lineHeight: "1.5",
                        ...(msg.isDeleted
                          ? {
                              background: "rgba(0,0,0,0.4)",
                              border: "1px solid rgba(255,255,255,0.05)",
                              color: "#6B7280",
                              fontStyle: "italic",
                            }
                          : isMine
                          ? {
                              background: isSending
                                ? "rgba(109,40,217,0.4)"
                                : "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                              border: "1px solid rgba(139,92,246,0.4)",
                              color: "white",
                              borderBottomRightRadius: "4px",
                              boxShadow: isSending ? "none" : "0 4px 15px rgba(109,40,217,0.3)",
                            }
                          : {
                              background: "rgba(255,255,255,0.08)",
                              border: "1px solid rgba(255,255,255,0.06)",
                              color: "#F3F4F6",
                              borderBottomLeftRadius: "4px",
                            }),
                      }}
                    >
                      {msg.replyTo && !msg.isDeleted && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            const el = document.getElementById(`msg-${msg.replyTo.id}`);
                            if (el)
                              el.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                          style={{
                            cursor: "pointer",
                            marginBottom: "8px",
                            padding: "6px 10px",
                            background: "rgba(0,0,0,0.25)",
                            borderRadius: "10px",
                            borderLeft: "3px solid rgba(139,92,246,0.8)",
                            fontSize: "12px",
                          }}
                        >
                          <div
                            style={{ color: "#A78BFA", fontWeight: 600, marginBottom: "2px" }}
                          >
                            {msg.replyTo.sender?.name || msg.replyTo.sender?.username}
                          </div>
                          <div
                            style={{
                              color: "#D1D5DB",
                              opacity: 0.85,
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical" as any,
                            }}
                          >
                            {msg.replyTo.isDeleted ? "Message deleted" : msg.replyTo.content}
                          </div>
                        </div>
                      )}

                      <div>
                        {msg.isDeleted ? (
                          "This message was deleted"
                        ) : amIBlinded && !isMine && msg.type !== "SYSTEM" ? (
                          <div style={{ padding: "0 10px", opacity: 0.3 }}>
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                          </div>
                        ) : (
                          msg.content.split(/(\s+)/).map((word: string, i: number) => {
                            if (word.match(/^https?:\/\//)) {
                              return (
                                <a
                                  key={i}
                                  href={word}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => {
                                    if (!e.ctrlKey && !e.metaKey) e.preventDefault();
                                  }}
                                  style={{ color: "#93C5FD", textDecoration: "underline" }}
                                  data-tooltip="Ctrl+Click to open"
                                >
                                  {word}
                                </a>
                              );
                            }
                            if (word.startsWith("@")) {
                              const clean = word.replace("@", "");
                              const isMe =
                                clean.toLowerCase() === user.username.toLowerCase();
                              if (isMe) {
                                return <span key={i}>{word}</span>;
                              }

                              return (
                                <span
                                  key={i}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMsgId(null);
                                    const targetUser =
                                      localCollaborators?.find(
                                        (c: any) =>
                                          c.user.username.toLowerCase() === clean.toLowerCase()
                                      )?.user ||
                                      (sector.station?.user?.username.toLowerCase() ===
                                      clean.toLowerCase()
                                        ? sector.station.user
                                        : null);
                                    if (targetUser) {
                                      setMentionDetail({ type: "user", data: targetUser });
                                      return;
                                    }
                                    const targetBeacon = sector.beacons?.find(
                                      (b: any) =>
                                        b.title.replace(/\s+/g, "").toLowerCase() ===
                                        clean.toLowerCase()
                                    );
                                    if (targetBeacon)
                                      setMentionDetail({ type: "beacon", data: targetBeacon });
                                  }}
                                  style={{
                                    fontWeight: 600,
                                    padding: "1px 5px",
                                    borderRadius: "5px",
                                    background: "rgba(139,92,246,0.25)",
                                    color: "#C4B5FD",
                                    cursor: "pointer",
                                  }}
                                >
                                  {word}
                                </span>
                              );
                            }
                            return <span key={i}>{word}</span>;
                          })
                        )}
                      </div>
                      {msg.editedAt && !msg.isDeleted && (
                        <span
                          style={{
                            fontSize: "10px",
                            opacity: 0.5,
                            marginLeft: "6px",
                            fontStyle: "italic",
                          }}
                        >
                          (edited)
                        </span>
                      )}
                    </motion.div>
                  </div>
                </div>

                {/* Action Menu popover */}
                <AnimatePresence>
                  {showOptions && !msg.isDeleted && !isSending && (
                    <motion.div
                      onClick={(e) => e.stopPropagation()}
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      style={{
                        position: "absolute",
                        zIndex: 10,
                        display: "flex",
                        gap: "4px",
                        padding: "6px",
                        background: "rgba(17,17,30,0.97)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                        bottom: "100%",
                        marginBottom: "4px",
                        ...(isMine ? { right: 0 } : { left: "40px" }),
                      }}
                    >
                      <button
                        onClick={async () => {
                          setSelectedMsgId(null);
                          setPinnedMessage(msg);
                          await pinGroupMessageAction(sector.id, msg.id);
                        }}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                        data-tooltip="Pin Message"
                        style={{ padding: "10px" }}
                      >
                        <MapPinIcon width={18} height={18} />
                      </button>
                      <button
                        onClick={() => {
                          setReplyToMsg(msg);
                          setSelectedMsgId(null);
                          inputRef.current?.focus();
                        }}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                        data-tooltip="Reply"
                        style={{ padding: "10px" }}
                      >
                        <ArrowUturnLeftIcon width={18} height={18} />
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(msg.content);
                          toast.success("Copied to clipboard");
                          setSelectedMsgId(null);
                        }}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                        data-tooltip="Copy"
                        style={{ padding: "10px" }}
                      >
                        <ClipboardDocumentIcon width={18} height={18} />
                      </button>
                      {msg.content.match(/https?:\/\/[^\s]+/) && (
                        <button
                          onClick={() =>
                            window.open(msg.content.match(/https?:\/\/[^\s]+/)?.[0], "_blank")
                          }
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                          data-tooltip="Open Link"
                          style={{ padding: "10px" }}
                        >
                          <LinkIcon width={18} height={18} />
                        </button>
                      )}
                      {isMine && (
                        <button
                          onClick={() => {
                            setEditMsgId(msg.id);
                            setInputMessage(msg.content);
                            setSelectedMsgId(null);
                            inputRef.current?.focus();
                          }}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                          data-tooltip="Edit"
                          style={{ padding: "10px" }}
                        >
                          <PencilIcon width={18} height={18} />
                        </button>
                      )}
                      {(isMine || isOwner) && (
                        <button
                          onClick={() => handleDeleteMsg(msg.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                          data-tooltip="Delete"
                          style={{ padding: "10px" }}
                        >
                          <TrashIcon width={18} height={18} />
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef as any} />
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  XMarkIcon, UserPlusIcon, UsersIcon, EnvelopeIcon, 
  MagnifyingGlassIcon, ChatBubbleOvalLeftEllipsisIcon, GlobeAltIcon, CheckIcon, UserMinusIcon
} from "@heroicons/react/24/outline";
import SpaceBackground from "./space-background";
import StaticStarfield from "./static-starfield";
import { 
  searchPilots, getFriends, getFriendRequests, 
  sendFriendRequest, acceptFriendRequest, rejectFriendRequest,
  getChatMessages, sendChatMessage, removeFriend
} from "@/lib/actions";

type Tab = "add" | "list" | "requests";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: any; // Current user
}

export default function FriendsModal({ isOpen, onClose, user }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatName, setActiveChatName] = useState<string>("");

  const [pilots, setPilots] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  // Fetch data based on tab
  useEffect(() => {
    if (!isOpen) return;
    
    if (activeTab === "list") {
      getFriends().then(setFriends);
    } else if (activeTab === "requests") {
      getFriendRequests().then(setRequests);
    }
  }, [activeTab, isOpen]);

  // Search logic for "Add" tab
  useEffect(() => {
    if (activeTab === "add") {
      if (searchQuery.trim().length >= 2) {
        const t = setTimeout(() => {
          searchPilots(searchQuery).then(setPilots);
        }, 300);
        return () => clearTimeout(t);
      } else {
        setPilots([]);
      }
    }
  }, [searchQuery, activeTab]);

  // Fetch chat messages
  useEffect(() => {
    if (activeTab === "list" && activeChatId) {
      getChatMessages(activeChatId).then(setMessages);
    }
  }, [activeChatId, activeTab]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: user?.animationEnabled ? "smooth" : "auto" });
    }
  }, [messages, user?.animationEnabled]);

  // Reset states when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSearchQuery("");
        setActiveChatId(null);
        setActiveTab("list");
      }, 300);
    }
  }, [isOpen]);

  const handleAddFriend = async (id: string) => {
    const res = await sendFriendRequest(id);
    if (!res.error) {
      // update pilot list to show pending
      setPilots(prev => prev.map(p => p.id === id ? { ...p, friendshipStatus: "PENDING" } : p));
    }
  };

  const handleAcceptRequest = async (id: string, friendshipId: string) => {
    await acceptFriendRequest(friendshipId);
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleRejectRequest = async (id: string, friendshipId: string) => {
    await rejectFriendRequest(friendshipId);
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleRemoveFriend = async (id: string) => {
    const res = await removeFriend(id);
    if (!res.error) {
      setFriends(prev => prev.filter(f => f.id !== id));
      if (activeChatId === id) {
        setActiveChatId(null);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChatId) return;
    
    const content = messageInput;
    setMessageInput("");
    
    // optimistic update
    const tempMsg = {
      id: Date.now().toString(),
      senderId: user.id,
      receiverId: activeChatId,
      content,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    await sendChatMessage(activeChatId, content);
    // optionally refetch messages
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <motion.div
            className="flex flex-col shadow-2xl"
            style={{ 
              width: "90vw", 
              height: "85vh", 
              maxWidth: "1200px", 
              position: "relative", 
              overflow: "hidden", 
              background: "rgba(20, 20, 35, 0.65)", 
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(139, 92, 246, 0.6)",
              boxShadow: "0 0 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(139, 92, 246, 0.3)",
              borderRadius: "24px",
              padding: "24px",
              gap: "20px"
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          >
            {/* Background Animation */}
            <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
              {user.animationEnabled ? (
                <SpaceBackground animEnabled={true} transitionDuration={800} />
              ) : (
                <StaticStarfield seed={42} />
              )}
            </div>

            {/* Modal Header */}
            <div className="flex items-center justify-between relative z-10 bg-[rgba(255,255,255,0.03)] backdrop-blur-md border border-[rgba(255,255,255,0.1)]" style={{ padding: "16px 24px", borderRadius: "16px" }}>
              <div className="flex items-center w-full">
                <div className="font-bold text-white tracking-wide shrink-0 mr-4" style={{ fontSize: "20px", width: "180px" }}>
                  {activeTab === "add" ? "Find Pilots" : activeTab === "list" ? "Friend List" : "Friend Requests"}
                </div>
                
                <div className="relative flex-1 max-w-lg ml-6">
                  <MagnifyingGlassIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" width={20} height={20} />
                    <input
                      type="text"
                      placeholder={activeTab === "add" ? "Search by name, username, or callsign..." : "Search friends..."}
                      className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-white focus:outline-none focus:border-violet-500 focus:bg-[rgba(0,0,0,0.5)] transition-all"
                      style={{ padding: "12px 24px 12px 48px", borderRadius: "9999px" }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
              </div>

              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white ml-6 shrink-0">
                <XMarkIcon width={24} height={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-1 overflow-hidden relative z-10" style={{ gap: "24px" }}>
              {/* Sidebar Tabs */}
              <div className="w-24 flex flex-col items-center border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] glass-sm" style={{ padding: "24px 0", gap: "24px", borderRadius: "16px" }}>
                <button 
                  onClick={() => { setActiveTab("add"); setActiveChatId(null); setSearchQuery(""); }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${activeTab === "add" ? "bg-violet-500/20 text-violet-400 border border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.6)]" : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
                  title="Find Pilots"
                >
                  <UserPlusIcon width={28} height={28} />
                </button>
                <button 
                  onClick={() => { setActiveTab("list"); setSearchQuery(""); }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${activeTab === "list" ? "bg-violet-500/20 text-violet-400 border border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.6)]" : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
                  title="Friend List"
                >
                  <UsersIcon width={28} height={28} />
                </button>
                <button 
                  onClick={() => { setActiveTab("requests"); setActiveChatId(null); setSearchQuery(""); }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${activeTab === "requests" ? "bg-violet-500/20 text-violet-400 border border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.6)]" : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
                  title="Friend Requests"
                >
                  <EnvelopeIcon width={28} height={28} />
                </button>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex overflow-hidden border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]" style={{ borderRadius: "16px" }}>
                {/* Left Section (List) */}
                <motion.div 
                  className="flex flex-col h-full overflow-y-auto bg-[rgba(0,0,0,0.2)] backdrop-blur-sm"
                  initial={false}
                  animate={{
                    width: (activeTab === "list" && activeChatId) ? 140 : "100%",
                    borderRight: (activeTab === "list" && activeChatId) ? "1px solid rgba(139,92,246,0.2)" : "1px solid rgba(139,92,246,0)"
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{ padding: "24px", gap: "8px", flexShrink: 0 }}
                >
                  
                  <AnimatePresence mode="wait">
                    {activeTab === "add" && pilots.map((p, i) => (
                      <motion.div
                        key={`add-${p.id}`}
                        className="glass flex items-center justify-between transition-colors group"
                        style={{ padding: "16px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px" }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={user.animationEnabled ? { type: "spring", stiffness: 300, damping: 20, delay: i * 0.05 } : { duration: 0 }}
                        exit={{ opacity: 0, y: 20, transition: { duration: 0.2, delay: i * 0.03 } }}
                        whileHover={user.animationEnabled ? { scale: 1.02, boxShadow: "0 0 15px rgba(139,92,246,0.3)" } : {}}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden relative border border-white/10 flex items-center justify-center">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-gray-400 font-bold">{(p.name || p.username || "?")[0].toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              {p.name || "Pilot"}
                              {p.titleBadge && <span className="badge badge-violet text-[0.65rem]">{p.titleBadge}</span>}
                            </div>
                            <div className="text-sm text-gray-400">@{p.username} {p.callsign && `• ${p.callsign}`}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {p.station?.isPublic && (
                            <a href={`/station/${p.username}`} target="_blank" rel="noreferrer" className="rounded-full bg-white/5 hover:bg-violet-500/20 text-gray-300 hover:text-violet-400 border border-white/10 hover:border-violet-500/50 transition-all" title="Visit Station" style={{ padding: "10px" }}>
                              <GlobeAltIcon width={22} height={22} />
                            </a>
                          )}
                          {p.friendshipStatus === "ACCEPTED" ? (
                            <button onClick={() => { setActiveTab("list"); setActiveChatId(p.id); setActiveChatName(p.name || p.username); }} className="rounded-full bg-white/5 hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-400 border border-white/10 hover:border-cyan-500/50 transition-all" title="Chat" style={{ padding: "10px" }}>
                              <ChatBubbleOvalLeftEllipsisIcon width={22} height={22} />
                            </button>
                          ) : p.friendshipStatus === "PENDING" ? (
                            <button disabled className="rounded-full bg-white/5 text-gray-500 text-sm font-medium border border-white/5 cursor-not-allowed flex items-center justify-center transition-all" style={{ padding: "0 20px", height: "44px" }}>
                              Pending
                            </button>
                          ) : (
                            <button onClick={() => handleAddFriend(p.id)} className="rounded-full bg-white/5 hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-400 border border-white/10 hover:border-cyan-500/50 transition-all" title="Add Friend" style={{ padding: "10px" }}>
                              <UserPlusIcon width={22} height={22} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {activeTab === "list" && friends.filter(f => !searchQuery || (f.name||"").toLowerCase().includes(searchQuery.toLowerCase()) || (f.username||"").toLowerCase().includes(searchQuery.toLowerCase())).map((f, i) => (
                      <motion.div
                        key={`list-${f.id}`}
                        className={`glass flex transition-colors group ${activeChatId === f.id ? "bg-[rgba(139,92,246,0.2)]" : ""}`}
                        style={{ 
                          padding: "16px", border: activeChatId === f.id ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.05)", borderRadius: "16px",
                          flexDirection: activeChatId ? "column" : "row",
                          alignItems: "center",
                          justifyContent: activeChatId ? "center" : "space-between",
                          gap: activeChatId ? "16px" : "0"
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={user.animationEnabled ? { type: "spring", stiffness: 300, damping: 20, delay: i * 0.05 } : { duration: 0 }}
                        exit={{ opacity: 0, y: 20, transition: { duration: 0.2, delay: i * 0.03 } }}
                        whileHover={user.animationEnabled ? { scale: 1.02, boxShadow: "0 0 15px rgba(139,92,246,0.3)" } : {}}
                      >
                        <div className="flex items-center gap-3">
                          <motion.div 
                            className="rounded-full bg-gray-700 overflow-hidden relative border border-white/10 flex items-center justify-center shrink-0" 
                            initial={{ width: activeChatId ? 64 : 48, height: activeChatId ? 64 : 48 }}
                            animate={{ width: activeChatId ? 64 : 48, height: activeChatId ? 64 : 48 }}
                            transition={user.animationEnabled ? { duration: 0.3, ease: "easeInOut" } : { duration: 0 }}
                          >
                            {f.image ? (
                              <img src={f.image} alt={f.name} className="w-full h-full object-cover" />
                            ) : (
                              <motion.span 
                                className="text-gray-400 font-bold" 
                                animate={{ fontSize: activeChatId ? 24 : 16 }}
                              >
                                {(f.name || f.username || "?")[0].toUpperCase()}
                              </motion.span>
                            )}
                          </motion.div>
                          <AnimatePresence>
                            {!activeChatId && (
                              <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                                transition={{ duration: 0.2 }}
                              >
                                <div className="font-semibold text-white flex items-center gap-2">
                                  {f.name || "Pilot"}
                                  {f.titleBadge && <span className="badge badge-violet text-[0.65rem]">{f.titleBadge}</span>}
                                </div>
                                <div className="text-sm text-gray-400">@{f.username} {f.callsign && `• ${f.callsign}`}</div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className={`flex items-center gap-2 transition-opacity ${activeChatId ? "opacity-100 flex-wrap justify-center" : "opacity-0 group-hover:opacity-100"}`}>
                          {f.station?.isPublic && (
                            <a href={`/station/${f.username}`} target="_blank" rel="noreferrer" className="rounded-full bg-white/5 hover:bg-violet-500/20 text-gray-300 hover:text-violet-400 border border-white/10 hover:border-violet-500/50 transition-all" title="Visit Station" style={{ padding: "10px" }}>
                              <GlobeAltIcon width={22} height={22} />
                            </a>
                          )}
                          <button 
                            onClick={() => {
                              if (activeChatId === f.id) {
                                setActiveChatId(null);
                              } else {
                                setActiveChatId(f.id);
                                setActiveChatName(f.name || f.username);
                              }
                            }}
                            className={`rounded-full border transition-all ${activeChatId === f.id ? "bg-violet-500 text-white border-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.5)]" : "bg-white/5 hover:bg-violet-500/20 text-gray-300 hover:text-violet-400 border-white/10 hover:border-violet-500/50"}`} 
                            title="Chat"
                            style={{ padding: "10px" }}
                          >
                            <ChatBubbleOvalLeftEllipsisIcon width={22} height={22} />
                          </button>
                          {!activeChatId && (
                            <button 
                              onClick={() => handleRemoveFriend(f.id)} 
                              className="rounded-full bg-white/5 hover:bg-pink-500/20 text-gray-300 hover:text-pink-400 border border-white/10 hover:border-pink-500/50 transition-all" 
                              title="Remove Friend"
                              style={{ padding: "10px" }}
                            >
                              <UserMinusIcon width={22} height={22} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {activeTab === "requests" && requests.map((r, i) => (
                      <motion.div
                        key={`req-${r.id}`}
                        className="glass flex items-center justify-between transition-colors group"
                        style={{ padding: "16px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px" }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={user.animationEnabled ? { type: "spring", stiffness: 300, damping: 20, delay: i * 0.05 } : { duration: 0 }}
                        exit={{ opacity: 0, y: 20, transition: { duration: 0.2, delay: i * 0.03 } }}
                        whileHover={user.animationEnabled ? { scale: 1.02, boxShadow: "0 0 15px rgba(139,92,246,0.3)" } : {}}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden relative border border-white/10 flex items-center justify-center">
                            {r.image ? (
                              <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-gray-400 font-bold">{(r.name || r.username || "?")[0].toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              {r.name || "Pilot"}
                              {r.titleBadge && <span className="badge badge-violet text-[0.65rem]">{r.titleBadge}</span>}
                            </div>
                            <div className="text-sm text-gray-400">@{r.username} wants to be friends</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleAcceptRequest(r.id, r.friendshipId)}
                            className="rounded-full bg-violet-500 hover:bg-violet-400 text-white font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                            style={{ height: "44px", padding: "0 20px" }}
                          >
                            <CheckIcon width={20} height={20} /> Accept
                          </button>
                          <button 
                            onClick={() => handleRejectRequest(r.id, r.friendshipId)}
                            className="rounded-full bg-white/5 hover:bg-pink-500/20 text-gray-300 hover:text-pink-400 border border-white/10 hover:border-pink-500/50 transition-all flex items-center justify-center"
                            title="Refuse"
                            style={{ width: "44px", height: "44px" }}
                          >
                            <XMarkIcon width={22} height={22} />
                          </button>
                        </div>
                      </motion.div>
                    ))}

                    {activeTab === "add" && pilots.length === 0 && searchQuery.length >= 2 && (
                      <motion.div 
                        key="empty-add-1"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-gray-400" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                      >
                        No pilots found matching "{searchQuery}"
                      </motion.div>
                    )}
                    {activeTab === "add" && searchQuery.length < 2 && (
                      <motion.div 
                        key="empty-add-2"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-gray-500 gap-2" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}
                      >
                        <UserPlusIcon width={48} height={48} className="opacity-50 mb-2" />
                        Type at least 2 characters to search for pilots across Orbit Station.
                      </motion.div>
                    )}
                    {activeTab === "list" && friends.length === 0 && (
                      <motion.div 
                        key="empty-list"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-gray-500 gap-2" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}
                      >
                        <UsersIcon width={48} height={48} className="opacity-50 mb-2" />
                        Your friend list is empty. Go to "Find Pilots" to connect!
                      </motion.div>
                    )}
                    {activeTab === "requests" && requests.length === 0 && (
                      <motion.div 
                        key="empty-requests"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-gray-500 gap-2" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}
                      >
                        <EnvelopeIcon width={48} height={48} className="opacity-50 mb-2" />
                        No pending friend requests.
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.div>

                {/* Right Section (Chat Conversation) */}
                <AnimatePresence>
                  {activeTab === "list" && activeChatId && (
                    <motion.div 
                      initial={{ opacity: 0, x: 30, width: 0 }}
                      animate={{ opacity: 1, x: 0, width: "auto" }}
                      exit={{ opacity: 0, x: 30, width: 0 }}
                      transition={user.animationEnabled ? { duration: 0.3, ease: "easeInOut" } : { duration: 0 }}
                      className="flex-1 flex flex-col h-full relative backdrop-blur-sm overflow-hidden" 
                      style={{ backgroundColor: "rgba(20, 15, 35, 0.5)", padding: "24px", gap: "16px" }}
                    >
                      <div className="flex items-center justify-between backdrop-blur-md z-10" style={{ backgroundColor: "rgba(139, 92, 246, 0.05)", padding: "16px 24px", borderRadius: "16px", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/50 flex items-center justify-center">
                           <span className="text-violet-300 font-bold">{activeChatName[0]?.toUpperCase()}</span>
                         </div>
                         <div>
                           <h3 className="font-bold text-white" style={{ fontSize: "16px" }}>{activeChatName}</h3>
                           {(() => {
                             const chatFriend = friends.find(f => f.id === activeChatId);
                             const isTyping = chatFriend?.isTyping;
                             const isOnline = chatFriend?.status === "ONLINE" || !chatFriend?.status;
                             if (isTyping) return <p className="text-xs text-violet-400">typing...</p>;
                             if (isOnline) return <p className="text-xs text-green-400">Connected</p>;
                             return null;
                           })()}
                         </div>
                       </div>
                       <button onClick={() => setActiveChatId(null)} className="text-gray-400 hover:text-white" style={{ padding: "8px" }}>
                         <XMarkIcon width={24} height={24} />
                       </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto flex flex-col" style={{ gap: "16px", padding: "8px" }}>
                      {messages.map((msg) => {
                        const isMine = msg.senderId === user.id;
                        return (
                          <div key={msg.id} style={{
                            padding: "10px 16px",
                            borderRadius: "16px",
                            borderTopRightRadius: isMine ? "4px" : "16px",
                            borderTopLeftRadius: !isMine ? "4px" : "16px",
                            backgroundColor: isMine ? "rgba(139, 92, 246, 0.7)" : "rgba(255, 255, 255, 0.05)",
                            border: isMine ? "1px solid rgba(139, 92, 246, 0.5)" : "1px solid rgba(255, 255, 255, 0.1)",
                            color: "white",
                            maxWidth: "70%",
                            backdropFilter: "blur(8px)",
                            alignSelf: isMine ? "flex-end" : "flex-start",
                            fontSize: "14px",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
                          }}>
                            {msg.content}
                          </div>
                        );
                      })}
                      {messages.length === 0 && (
                        <div className="text-center text-gray-500 mt-10 text-sm">
                          This is the beginning of your transmission history with {activeChatName}.
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                      <form onSubmit={handleSendMessage} className="backdrop-blur-md z-10" style={{ backgroundColor: "rgba(139, 92, 246, 0.05)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(139, 92, 246, 0.2)", display: "flex" }}>
                        <div className="relative w-full">
                          <input 
                            type="text" 
                            placeholder="Transmit message..." 
                            className="w-full text-white focus:outline-none transition-all"
                            style={{ backgroundColor: "rgba(0, 0, 0, 0.2)", border: "1px solid rgba(139, 92, 246, 0.3)", padding: "14px 60px 14px 24px", borderRadius: "9999px" }}
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                          />
                          <button type="submit" disabled={!messageInput.trim()} className="absolute disabled:bg-gray-600 disabled:text-gray-400 transition-colors" style={{ right: "8px", top: "50%", transform: "translateY(-50%)", padding: "10px", borderRadius: "9999px", backgroundColor: messageInput.trim() ? "rgba(139, 92, 246, 1)" : "rgba(75, 85, 99, 1)", color: "white" }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                              <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                            </svg>
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

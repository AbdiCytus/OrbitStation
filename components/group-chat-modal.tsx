"use client";

import StaticStarfield from "./static-starfield";
import BeaconDetailModal from "@/components/beacon-detail-modal";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon, UserGroupIcon, PaperAirplaneIcon,
  PencilIcon, TrashIcon, ClipboardDocumentIcon,
  ArrowUturnLeftIcon, LinkIcon, UserPlusIcon,
  GlobeAltIcon, EyeIcon, RocketLaunchIcon, UsersIcon, MapPinIcon
} from "@heroicons/react/24/outline";
import { getGroupMessages, sendGroupMessage, editGroupMessage, deleteGroupMessage, muteMember, unmuteMember, clearGroupChat, kickMember, getMutedMembers, pinGroupMessageAction, setCollabRole, blindMember, sightMember, getBlindedMembers, unpinGroupMessageAction } from "@/lib/actions/chat.actions";
import { sendFriendRequest, getFriends } from "@/lib/actions/social.actions";
import { toast } from "sonner";
import type { SectorWithBeacons } from "@/types";
import { DynamicIcon } from "@/components/dynamic-icon";
import { pusherClient } from "@/lib/pusher-client";
import { BADGE_REGISTRY } from "@/lib/badges/registry";
import SectorQRModal from "./sector-qr-modal";
import { QrCodeIcon } from "@heroicons/react/24/outline";

import ChatHeader from "./chat/chat-header";
import MessageInput from "./chat/message-input";
import MembersPanel from "./chat/members-panel";
import TypingIndicator from "./chat/typing-indicator";
import ConfirmActionModal from "./chat/confirm-action-modal";
import MentionDetailPopup from "./chat/mention-detail-popup";
import MessageList from "./chat/message-list";

export const getAvatarBadgeClass = (titleBadge?: string | null) => {
  if (!titleBadge) return '';
  const badge = BADGE_REGISTRY.find(b => b.id === titleBadge);
  if (!badge) return '';
  const isSpecial = badge.rarity === "ekslusif";
  const isExclusive = badge.rarity === "super-ekslusif" || badge.rarity === "developer";
  if (isExclusive) return `avatar-badge avatar-exclusive-${badge.id}`;
  if (isSpecial) return `avatar-badge avatar-badge-special-${badge.color}`;
  return `avatar-badge avatar-badge-common-${badge.color}`;
};

export const getAvatarSweepClass = (titleBadge?: string | null) => {
  if (!titleBadge) return '';
  const badge = BADGE_REGISTRY.find(b => b.id === titleBadge);
  return badge && (badge.rarity === "ekslusif" || badge.rarity === "super-ekslusif" || badge.rarity === "developer") ? 'public-badge-sweep' : '';
};

export const getModalTint = (color?: string) => {
  const map: Record<string, string> = {
    gray: "rgba(156, 163, 175, 0.15)",
    amber: "rgba(251, 191, 36, 0.15)",
    rose: "rgba(251, 113, 133, 0.15)",
    pink: "rgba(244, 114, 182, 0.15)",
    cyan: "rgba(34, 211, 238, 0.15)",
    emerald: "rgba(52, 211, 153, 0.15)",
    purple: "rgba(192, 132, 252, 0.15)",
    blue: "rgba(96, 165, 250, 0.15)",
    indigo: "rgba(129, 140, 248, 0.15)",
  };
  return color ? map[color] : "transparent";
};

export const getModalBorder = (color?: string) => {
  const map: Record<string, string> = {
    gray: "rgba(156, 163, 175, 0.4)",
    amber: "rgba(251, 191, 36, 0.4)",
    rose: "rgba(251, 113, 133, 0.4)",
    pink: "rgba(244, 114, 182, 0.4)",
    cyan: "rgba(34, 211, 238, 0.4)",
    emerald: "rgba(52, 211, 153, 0.4)",
    purple: "rgba(192, 132, 252, 0.4)",
    blue: "rgba(96, 165, 250, 0.4)",
    indigo: "rgba(129, 140, 248, 0.4)",
  };
  return color ? map[color] : "rgba(139, 92, 246, 0.3)";
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sector: any;
  user: any;
  isOwner: boolean;
}

export default function GroupChatModal({ isOpen, onClose, sector: incomingSector, user, isOwner }: Props) {
  const prevSectorRef = useRef(incomingSector);
  useEffect(() => {
    if (incomingSector) prevSectorRef.current = incomingSector;
  }, [incomingSector]);
  const sector = incomingSector || prevSectorRef.current;

  const [messages, setMessages] = useState<any[]>([]);
  const [localCollaborators, setLocalCollaborators] = useState<any[]>(sector?.collaborators || []);
  const [isLoading, setIsLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [mutedMembers, setMutedMembers] = useState<string[]>([]);
  const [blindedMembers, setBlindedMembers] = useState<string[]>([]);
  const [isMuteAll, setIsMuteAll] = useState(sector?.isMuteAll || false);
  const [showMembers, setShowMembers] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [myFriends, setMyFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  // Actions states
  const amIAdmin = localCollaborators.find((c: any) => c.userId === user.id)?.role === "ADMIN";
  const [replyToMsg, setReplyToMsg] = useState<any | null>(null);
  const [editMsgId, setEditMsgId] = useState<string | null>(null);
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<{ id: string, x: number } | null>(null);

  // Mentions
  const [mentionQuery, setMentionQuery] = useState<{ type: "@" | "/", text: string, startIndex: number } | null>(null);
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
  const [mentionDetail, setMentionDetail] = useState<{ type: 'user' | 'beacon', data: any } | null>(null);

  const [selectedBeaconIdForDetail, setSelectedBeaconIdForDetail] = useState<string | null>(null);
  const [pinnedMessage, setPinnedMessage] = useState<any | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: "kick" | "clear", targetUser?: any } | null>(null);

  useEffect(() => {
    if (sector && sector.collaborators) {
      setLocalCollaborators(sector.collaborators);
    }
  }, [sector]);

  const executeClearChat = async () => {
    setMessages([]);
    await clearGroupChat(sector.id);
    setConfirmAction(null);
  };

  const executeKickMember = async () => {
    if (!confirmAction?.targetUser) return;
    const targetUser = confirmAction.targetUser;
    const res = await kickMember(sector.id, targetUser.id);
    if ((res as any).error) toast.error((res as any).error);
    else toast.success(`Kicked ${targetUser.name || targetUser.username} (@${targetUser.username}).`);
    setConfirmAction(null);
  };

  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const swipeStartRef = useRef<{ x: number, y: number } | null>(null);

  const handleTouchStartSwipe = (e: React.TouchEvent, msgId: string) => {
    handlePressStart(msgId);
    swipeStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMoveSwipe = (e: React.TouchEvent, msg: any) => {
    handlePressEnd();
    if (!swipeStartRef.current) return;
    const deltaX = e.touches[0].clientX - swipeStartRef.current.x;
    const deltaY = e.touches[0].clientY - swipeStartRef.current.y;
    
    // Only animate if horizontal swipe
    if (deltaX > 0 && Math.abs(deltaY) < 40) {
      setSwipeOffset({ id: msg.id, x: Math.min(deltaX, 80) }); // Cap visual drag at 80px
      // If pulled past threshold, trigger reply
      if (deltaX > 50) {
        setReplyToMsg(msg);
        swipeStartRef.current = null;
        inputRef.current?.focus(); // Call synchronously to ensure mobile browsers open the keyboard
        setTimeout(() => setSwipeOffset(null), 100);
      }
    }
  };

  const handleTouchEndSwipe = () => {
    handlePressEnd();
    swipeStartRef.current = null;
    setSwipeOffset(null); // Spring back
  };

  const handleCloseModal = () => {
    // Prevent framer-motion drag bug from freezing body interactions
    document.body.style.pointerEvents = "";
    document.body.style.userSelect = "";
    document.documentElement.style.pointerEvents = "";
    document.documentElement.style.userSelect = "";
    document.querySelectorAll("style").forEach((style) => {
      if (style.innerHTML.includes("pointer-events: none") && style.innerHTML.includes("user-select: none")) {
        style.remove();
      }
    });
    onClose();
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount just in case
      document.body.style.pointerEvents = "";
      document.body.style.userSelect = "";
      document.documentElement.style.pointerEvents = "";
      document.documentElement.style.userSelect = "";
      document.querySelectorAll("style").forEach((style) => {
        if (style.innerHTML.includes("pointer-events: none") && style.innerHTML.includes("user-select: none")) {
          style.remove();
        }
      });
    };
  }, []);

  const handlePressStart = (msgId: string) => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => {
      setSelectedMsgId(msgId);
    }, 400); // Waktu tahan 400 milidetik untuk memunculkan popover
  };

  const handlePressEnd = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
  };

  const lastTypingRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionContainerRef = useRef<HTMLDivElement>(null);

  // 1. Variabel Pelacak
  const initialScrollDone = useRef(false);
  const hasOpenedBefore = useRef(false); // Mengingat apakah ini pertama kali dibuka di sektor ini
  const [chatReady, setChatReady] = useState(false);

  // 2. Reset pelacak (hanya reset status buka/tutup, BUKAN memori "pernah dibuka")
  useEffect(() => {
    if (!isOpen) {
      initialScrollDone.current = false;
      setChatReady(false);
    }
  }, [isOpen]);

  // 3. Logika Scroll (Kombinasi Pertama = Smooth, Kedua = Instan)
  useEffect(() => {
    if (!isOpen) return;

    if (messages.length > 0 && !initialScrollDone.current) {
      const isFirstTime = !hasOpenedBefore.current;

      if (isFirstTime) {
        // --- KASUS A: BUKA PERTAMA KALI (ANIMASI SMOOTH) ---
        setChatReady(true); // Buka tirai langsung agar proses scroll terlihat elegan

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({
            behavior: user?.animationEnabled ? "smooth" : "auto",
            block: "end"
          });
          initialScrollDone.current = true;
          hasOpenedBefore.current = true; // Tandai bahwa ia sudah pernah dibuka
        }, 100);

      } else {
        // --- KASUS B: BUKA KEDUA KALI & SETERUSNYA (INSTAN & KILAT) ---
        setChatReady(false); // Tutup tirai agar perpindahan instan tidak terlihat mata

        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setTimeout(() => {
                if (messagesContainerRef.current) {
                  messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                }
                setChatReady(true); // Buka tirai setelah posisi terkunci di bawah
                initialScrollDone.current = true;
              }, 100);
            });
          });
        }
      }
    }
    // KASUS C: Chat Kosong (Belum ada yang kirim pesan)
    else if (messages.length === 0 && !initialScrollDone.current) {
      const emptyTimer = setTimeout(() => {
        setChatReady(true);
        hasOpenedBefore.current = true; // Tetap tandai sudah dibuka
      }, 500);
      return () => clearTimeout(emptyTimer);
    }
    // KASUS D: Ada pesan baru masuk & User tidak sedang membaca riwayat di atas
    else if (messages.length > 0 && initialScrollDone.current && !isScrolledUp) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: user?.animationEnabled ? "smooth" : "auto",
          block: "end"
        });
      }, 50);
    }
  }, [isOpen, messages, isScrolledUp, user?.animationEnabled]);

  useEffect(() => {
    if (!isOpen || !sector) return;

    let isSubscribed = true;

    const fetchData = async () => {
      setIsLoading(true);
      const data = await getGroupMessages(sector.id);
      if (isSubscribed) {
        setMessages(data.messages);

        if (data.pinnedMessageId) {
          const pinned = data.messages.find((m: any) => m.id === data.pinnedMessageId);
          if (pinned) setPinnedMessage(pinned);
          else setPinnedMessage(null);
        } else {
          setPinnedMessage(null);
        }

        setIsLoading(false);
      }

      const muted = await getMutedMembers(sector.id);
      const blinded = await getBlindedMembers(sector.id);
      if (isSubscribed) {
        setMutedMembers(muted);
        setBlindedMembers(blinded);
        setIsMuteAll(sector?.isMuteAll || false);
      }

      const friendsData = await getFriends();
      if (isSubscribed) setMyFriends(friendsData);
    };

    fetchData();

    const channelName = `presence-sector-${sector.id}`;
    const channel = pusherClient.subscribe(channelName);
    const globalChannel = pusherClient.subscribe('presence-global');

    const syncGlobalMembers = () => {
      const presenceChannel = globalChannel as any;

      if (presenceChannel.members) {
        const ids = new Set<string>();
        presenceChannel.members.each((member: any) => ids.add(member.id));
        setOnlineUserIds(ids);
      }
    };

    if (globalChannel.subscribed) {
      syncGlobalMembers();
    }

    // 2. JIKA BARU AKAN SUBSCRIBE (Fallback jika use-notifications lambat)
    const handleGlobalSub = () => {
      if (!isSubscribed) return;
      syncGlobalMembers();
    };

    const handleGlobalAdd = (member: any) => {
      if (!isSubscribed) return;
      setOnlineUserIds(prev => { const next = new Set(prev); next.add(member.id); return next; });
    };

    const handleGlobalRemove = (member: any) => {
      if (!isSubscribed) return;
      setOnlineUserIds(prev => { const next = new Set(prev); next.delete(member.id); return next; });
    };

    globalChannel.bind('pusher:subscription_succeeded', handleGlobalSub);
    globalChannel.bind('pusher:member_added', handleGlobalAdd);
    globalChannel.bind('pusher:member_removed', handleGlobalRemove);

    channel.bind('new-message', (msg: any) => {
      setTypingUsers(prev => prev.filter(u => u.id !== msg.senderId));

      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        let finalSenderImg = null;

        const existingMsg = prev.find(m => m.senderId === msg.senderId && m.sender?.image);
        if (existingMsg) {
          finalSenderImg = existingMsg.sender.image;
        } else {
          if (msg.senderId === user.id) {
            finalSenderImg = user.image;
          } else if (sector.station?.userId === msg.senderId || sector.station?.user?.id === msg.senderId) {
            finalSenderImg = sector.station?.user?.image;
          } else {
            const collab = localCollaborators?.find((c: any) => c.userId === msg.senderId || c.user?.id === msg.senderId);
            if (collab?.user?.image) finalSenderImg = collab.user.image;
          }
        }

        const fixedMsg = {
          ...msg,
          sender: { ...msg.sender, image: finalSenderImg }
        };

        const tempIdx = prev.findIndex(m => m._isSending && m.content === fixedMsg.content && m.senderId === fixedMsg.senderId);
        if (tempIdx !== -1) {
          const next = [...prev];
          next[tempIdx] = fixedMsg;
          return next;
        }

        return [...prev, fixedMsg];
      });
    });

    channel.bind('pinned-message', (msg: any) => {
      setPinnedMessage(msg);
    });

    channel.bind('unpinned-message', () => {
      setPinnedMessage(null);
    });

    channel.bind('update-message', (msg: any) => {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...msg, sender: { ...msg.sender, image: m.sender?.image } } : m));
    });

    channel.bind('clear-messages', () => {
      setMessages([]);
    });

    channel.bind('sector-update', (data: any) => {
      if (data.isMuteAll !== undefined) setIsMuteAll(data.isMuteAll);
      if (data.clearMuted) setMutedMembers([]);

      if (data.isMuteAll) {
        if (data.unmutedUser) setMutedMembers(prev => [...prev, data.unmutedUser]);
        if (data.mutedUser) setMutedMembers(prev => prev.filter(id => id !== data.mutedUser));
      } else {
        if (data.mutedUser) setMutedMembers(prev => [...prev, data.mutedUser]);
        if (data.unmutedUser) setMutedMembers(prev => prev.filter(id => id !== data.unmutedUser));
      }

      if (data.roleChanged) {
        setLocalCollaborators(prev => prev.map(c => c.user.id === data.roleChanged.userId ? { ...c, role: data.roleChanged.role } : c));
        window.dispatchEvent(new CustomEvent('role-updated-global', { detail: { sectorId: sector.id, userId: data.roleChanged.userId, role: data.roleChanged.role } }));
      }
    });

    channel.bind('blind-update', (data: any) => {
      if (data.isBlinded) setBlindedMembers(prev => [...prev, data.userId]);
      else setBlindedMembers(prev => prev.filter(id => id !== data.userId));
    });

    const typingTimeouts = new Map<string, NodeJS.Timeout>();

    channel.bind('client-is-typing', (data: { isTyping: boolean; userId: string; username: string; name: string }) => {
      if (!data.isTyping) return;

      setTypingUsers(prev => {
        if (!prev.find(u => u.id === data.userId)) {
          return [...prev, { id: data.userId, username: data.username, name: data.name }];
        }
        return prev;
      });

      if (typingTimeouts.has(data.userId)) {
        clearTimeout(typingTimeouts.get(data.userId)!);
      }

      const timeout = setTimeout(() => {
        setTypingUsers(prev => prev.filter(u => u.id !== data.userId));
        typingTimeouts.delete(data.userId);
      }, 3000);

      typingTimeouts.set(data.userId, timeout);
    });

    const intervalId = setInterval(() => {
      getMutedMembers(sector.id).then(muted => { if (isSubscribed) setMutedMembers(muted); });
    }, 15000);

    return () => {
      isSubscribed = false;
      channel.unbind('new-message');
      channel.unbind('update-message');
      channel.unbind('clear-messages');
      channel.unbind('client-is-typing');
      globalChannel.unbind('pusher:subscription_succeeded', handleGlobalSub);
      globalChannel.unbind('pusher:member_added', handleGlobalAdd);
      globalChannel.unbind('pusher:member_removed', handleGlobalRemove);
      pusherClient.unsubscribe(channelName);
      clearInterval(intervalId);
      typingTimeouts.forEach(t => clearTimeout(t));
    };
  }, [isOpen, sector]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: user?.animationEnabled ? "smooth" : "auto",
          block: "end"
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [messages.length, isOpen, user?.animationEnabled]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputMessage(val);

    const now = Date.now();
    if (now - lastTypingRef.current > 3000) {
      const channel = pusherClient.channel(`presence-sector-${sector?.id}`);
      if (channel && channel.subscribed && val.trim().length > 0) {
        channel.trigger('client-is-typing', { isTyping: true, userId: user.id, username: user.username, name: user.name });
        lastTypingRef.current = now;
      }
    }

    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/(^|\s)([@/])([a-zA-Z0-9_]*)$/);

    if (mentionMatch) {
      setMentionQuery({
        type: mentionMatch[2] as "@" | "/",
        text: mentionMatch[3],
        startIndex: cursorPosition - mentionMatch[3].length - 1
      });
      setMentionSelectedIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  // const amIAdmin = localCollaborators.find((c: any) => c.userId === user.id)?.role === "ADMIN";
  const isUserMuted = isMuteAll
    ? (!isOwner && !mutedMembers.includes(user.id))
    : (!isOwner && mutedMembers.includes(user.id));
  const amIBlinded = blindedMembers.includes(user.id);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !sector || isUserMuted) return;

    const content = inputMessage;

    if (editMsgId) {
      setInputMessage("");
      setEditMsgId(null);
      setMessages(prev => prev.map(m => m.id === editMsgId ? { ...m, content, editedAt: new Date().toISOString() } : m));
      const res = await editGroupMessage(editMsgId, content);
      if ((res as any).error) toast.error((res as any).error);
      return;
    }

    if (content.startsWith("/")) {
      handleCommand(content);
      setInputMessage("");
      return;
    }

    setInputMessage("");
    const currentReplyToId = replyToMsg?.id;
    setReplyToMsg(null);

    const tempMsg = {
      id: `temp_${Date.now()}`,
      _isSending: true,
      sectorId: sector.id,
      senderId: user.id,
      content,
      type: "TEXT",
      replyToId: currentReplyToId,
      replyTo: replyToMsg,
      sender: {
        id: user.id,
        name: user.name,
        username: user.username,
        image: user.image
      },
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    await sendGroupMessage(sector.id, content, currentReplyToId);
  };

  const handleCommand = async (cmdString: string) => {
    if (!isOwner || !sector) return;
    const parts = cmdString.trim().split(":");
    const cmd = parts[0].toLowerCase();
    const arg = parts[1]?.trim();

    if (cmd === "/clear") { setConfirmAction({ type: "clear" }); return; }
    if (!arg) { toast.error("Command requires a target user (e.g. /mute:username)"); return; }

    // CEK VALIDASI MUTE ALL
    if (cmd === "/mute" && arg === "all") {
      if (isMuteAll) { toast.error("Everyone is already muted!"); return; }
      toast.promise(muteMember(sector.id, "all"), { loading: "Muting everyone...", success: "Mute All active!", error: "Failed" });
      return;
    }
    if (cmd === "/unmute" && arg === "all") {
      if (!isMuteAll) { toast.error("Mute All is not active!"); return; }
      toast.promise(unmuteMember(sector.id, "all"), { loading: "Unmuting everyone...", success: "Mute All lifted!", error: "Failed" });
      return;
    }

    const targetUser = localCollaborators.find((c: any) => c.user.username === arg)?.user;
    if (!targetUser) { toast.error(`User @${arg} not found`); return; }

    // CEK VALIDASI STATUS TARGET SEBELUM EKSEKUSI
    if (cmd === "/mute") {
      const currentlyMuted = isMuteAll ? !mutedMembers.includes(targetUser.id) : mutedMembers.includes(targetUser.id);
      if (currentlyMuted) { toast.error(`@${arg} is already muted!`); return; }
      toast.promise(muteMember(sector.id, targetUser.id), { loading: "Muting...", success: `@${arg} muted!`, error: "Failed" });
    }
    else if (cmd === "/unmute") {
      const currentlyMuted = isMuteAll ? !mutedMembers.includes(targetUser.id) : mutedMembers.includes(targetUser.id);
      if (!currentlyMuted) { toast.error(`@${arg} is not muted!`); return; }
      toast.promise(unmuteMember(sector.id, targetUser.id), { loading: "Unmuting...", success: `@${arg} unmuted!`, error: "Failed" });
    }
    else if (cmd === "/blind") {
      if (blindedMembers.includes(targetUser.id)) { toast.error(`@${arg} is already blinded!`); return; }
      toast.promise(blindMember(sector.id, targetUser.id), { loading: "Blinding...", success: `@${arg} blinded!`, error: "Failed" });
    }
    else if (cmd === "/sight") {
      if (!blindedMembers.includes(targetUser.id)) { toast.error(`@${arg} can already see!`); return; }
      toast.promise(sightMember(sector.id, targetUser.id), { loading: "Restoring sight...", success: `@${arg} sight restored!`, error: "Failed" });
    }
    else if (cmd === "/promote") {
      const currentRole = localCollaborators.find((c: any) => c.userId === targetUser.id)?.role;
      if (currentRole === "ADMIN") { toast.error(`@${arg} is already an Admin!`); return; }
      toast.promise(setCollabRole(sector.id, targetUser.id, "ADMIN"), { loading: "Promoting...", success: `@${arg} promoted to Admin!`, error: "Failed" });
    }
    else if (cmd === "/demote") {
      const currentRole = localCollaborators.find((c: any) => c.userId === targetUser.id)?.role;
      if (currentRole !== "ADMIN") { toast.error(`@${arg} is already a Member!`); return; }
      toast.promise(setCollabRole(sector.id, targetUser.id, "MEMBER"), { loading: "Demoting...", success: `@${arg} demoted to Member!`, error: "Failed" });
    }
    else if (cmd === "/kick") {
      setConfirmAction({ type: "kick", targetUser });
    }
    else { toast.error(`Unknown command: ${cmd}`); }
  };

  const mentionSuggestions = useMemo(() => {
    if (!mentionQuery || !sector) return [];

    if (mentionQuery.type === "/") {
      if (!isOwner) return [];
      const q = mentionQuery.text.toLowerCase();

      const cmdMatch = q.match(/^(mute|unmute|kick|blind|sight|promote|demote):(.*)/);
      if (cmdMatch) {
        const cmdPart = cmdMatch[1];
        const searchPart = cmdMatch[2];

        let members = localCollaborators.filter((c: any) => c.user.id !== user.id);

        if (cmdPart === "mute") {
          members = members.filter((c: any) => isMuteAll ? mutedMembers.includes(c.user.id) : !mutedMembers.includes(c.user.id));
        } else if (cmdPart === "unmute") {
          members = members.filter((c: any) => isMuteAll ? !mutedMembers.includes(c.user.id) : mutedMembers.includes(c.user.id));
        } else if (cmdPart === "blind") {
          members = members.filter((c: any) => !blindedMembers.includes(c.user.id));
        } else if (cmdPart === "sight") {
          members = members.filter((c: any) => blindedMembers.includes(c.user.id));
        } else if (cmdPart === "promote") {
          members = members.filter((c: any) => c.role !== "ADMIN");
        } else if (cmdPart === "demote") {
          members = members.filter((c: any) => c.role === "ADMIN");
        }

        let suggestions = members.map((c: any) => ({
          text: `${cmdPart}:${c.user.username}`,
          label: c.user.name || c.user.username,
          subtitle: `@${c.user.username}`,
          image: c.user.image
        }));

        if (cmdPart === "mute" && !isMuteAll) {
          suggestions.unshift({ text: "mute:all", label: "Everyone (All Members)", subtitle: "Apply to all", image: null });
        } else if (cmdPart === "unmute" && isMuteAll) {
          suggestions.unshift({ text: "unmute:all", label: "Everyone (All Members)", subtitle: "Apply to all", image: null });
        }

        return suggestions.filter((m: any) => m.label.toLowerCase().includes(searchPart) || m.subtitle.toLowerCase().includes(searchPart));
      }

      const cmds = ["mute:", "unmute:", "kick:", "clear", "blind:", "sight:", "promote:", "demote:"];
      return cmds.filter(c => c.includes(q)).map(c => ({ text: c, label: `/${c}`, subtitle: "Command", image: null }));
    }

    if (mentionQuery.type === "@") {
      const q = mentionQuery.text.toLowerCase();
      const members = localCollaborators?.filter((c: any) => c.user.id !== user.id).map((c: any) => ({
        text: `@${c.user.username}`,
        label: c.user.name || c.user.username,
        subtitle: `@${c.user.username}`,
        image: c.user.image
      })) || [];

      // Filter: Tidak boleh memanggil diri sendiri (jika owner) [POIN 4]
      const hasOwner = members.some((m: any) => m.text === `@${sector.station?.user?.username}`);
      if (!hasOwner && sector.station?.user && sector.station.user.id !== user.id) {
        members.unshift({
          text: `@${sector.station?.user?.username}`,
          label: sector.station?.user?.name || sector.station?.user?.username,
          subtitle: `@${sector.station?.user?.username} (Owner)`,
          image: sector.station?.user?.image
        });
      }

      const beacons = sector.beacons?.map((b: any) => ({
        text: `@${b.title.replace(/\s+/g, '')}`,
        label: b.title,
        subtitle: "Beacon",
        image: b.faviconUrl
      })) || [];

      const allOptions = [
        { text: "@all", label: "Everyone", subtitle: "@all", image: null },
        ...members,
        ...beacons
      ];

      return allOptions.filter(o => o.text.toLowerCase().includes(`@${q}`));
    }
    return [];
  }, [mentionQuery, sector, isOwner, user.id]);

  useEffect(() => {
    if (suggestionContainerRef.current && mentionSuggestions.length > 0) {
      const activeEl = suggestionContainerRef.current.children[mentionSelectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "auto" });
      }
    }
  }, [mentionSelectedIndex, mentionSuggestions.length]);

  const insertMention = (text: string) => {
    if (!mentionQuery) return;
    const before = inputMessage.slice(0, mentionQuery.startIndex);
    const after = inputMessage.slice(mentionQuery.startIndex + mentionQuery.text.length + 1);

    const prefix = (mentionQuery.type === "/" && !text.startsWith("/")) ? "/" : "";
    const suffix = text.endsWith(":") ? "" : " ";

    setInputMessage(before + prefix + text + suffix + after);
    if (text.endsWith(":")) setMentionQuery({ type: "/", text: text, startIndex: mentionQuery.startIndex });
    else setMentionQuery(null);
    inputRef.current?.focus();
  };

  const handleDeleteMsg = async (msgId: string) => {
    setSelectedMsgId(null);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isDeleted: true, deletedBy: user.id } : m));
    const res = await deleteGroupMessage(msgId);
    if ((res as any).error) toast.error((res as any).error);
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;

    // Jika jarak ke bawah lebih dari 150px, berarti pengguna sedang scroll ke atas
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    if (distanceToBottom > 150) {
      if (!isScrolledUp) setIsScrolledUp(true);
    } else {
      if (isScrolledUp) setIsScrolledUp(false);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: user?.animationEnabled ? "smooth" : "auto",
        block: "end"
      });
      setIsScrolledUp(false); // Sembunyikan instan saat ditekan
    }
  };

  if (!sector) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
          key="group-chat-overlay"
          className="modal-overlay fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-8 bg-black/60 backdrop-blur-sm"
          style={{ zIndex: 110, animation: "none", pointerEvents: isOpen ? "auto" : "none" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            key="group-chat-container"
            className="flex flex-col shadow-2xl fm-modal-container w-full h-full rounded-none sm:max-w-[1200px] sm:max-h-[85vh] sm:rounded-[28px]"
            style={{
              position: "relative", overflow: "hidden",
              background: "rgba(15, 15, 25, 0.85)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              transform: "translateZ(0)",
              WebkitMaskImage: "-webkit-radial-gradient(white, black)"
            }}
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {!user?.staticBackgroundEnabled && (
              <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
                <StaticStarfield />
              </div>
            )}

            <div
              className="flex flex-col flex-1 relative z-10 w-full h-full overflow-hidden"
              onClick={() => {
                setSelectedMsgId(null);
                setMentionDetail(null);
              }}
            >
              {/* Header */}
              <ChatHeader
                sector={sector}
                collaboratorsCount={localCollaborators?.length || 0}
                isOwner={isOwner}
                amIAdmin={amIAdmin}
                showMembers={showMembers}
                setShowMembers={setShowMembers}
                showQRModal={showQRModal}
                setShowQRModal={setShowQRModal}
                onClose={handleCloseModal}
              />

              {/* Area Body & Chat */}
              <div className="flex flex-1 overflow-hidden relative">
                <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
                  <MessageList
                    messages={messages}
                    user={user}
                    sector={sector}
                    isOwner={isOwner}
                    amIAdmin={amIAdmin}
                    localCollaborators={localCollaborators}
                    pinnedMessage={pinnedMessage}
                    setPinnedMessage={setPinnedMessage}
                    messagesContainerRef={messagesContainerRef}
                    messagesEndRef={messagesEndRef}
                    chatReady={chatReady}
                    isLoading={isLoading}
                    swipeOffset={swipeOffset}
                    selectedMsgId={selectedMsgId}
                    setSelectedMsgId={setSelectedMsgId}
                    amIBlinded={amIBlinded}
                    handleScroll={handleScroll}
                    handlePressStart={handlePressStart}
                    handlePressEnd={handlePressEnd}
                    handleTouchStartSwipe={handleTouchStartSwipe}
                    handleTouchMoveSwipe={handleTouchMoveSwipe}
                    handleTouchEndSwipe={handleTouchEndSwipe}
                    setMentionDetail={setMentionDetail}
                    setReplyToMsg={setReplyToMsg}
                    inputRef={inputRef}
                    setEditMsgId={setEditMsgId}
                    setInputMessage={setInputMessage}
                    handleDeleteMsg={handleDeleteMsg}
                  />

                  {/* Typing Indicator */}
                  <TypingIndicator typingUsers={typingUsers} />

                  <AnimatePresence>
                    {isScrolledUp && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.8 }}
                        style={{ position: "absolute", bottom: "85px", right: "16px", zIndex: 30 }}
                      >
                        <button
                          onClick={scrollToBottom}
                          className="bg-violet-600 hover:bg-violet-500 text-white rounded-full p-2 shadow-[0_4px_15px_rgba(0,0,0,0.5)] border border-violet-400/50 cursor-pointer transition-colors"
                          data-tooltip="Scroll to bottom"
                          style={{ padding: "10px" }}
                        >
                          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <MessageInput
                    replyToMsg={replyToMsg}
                    setReplyToMsg={setReplyToMsg}
                    editMsgId={editMsgId}
                    setEditMsgId={setEditMsgId}
                    inputMessage={inputMessage}
                    setInputMessage={setInputMessage}
                    handleInputChange={handleInputChange}
                    handleSendMessage={handleSendMessage}
                    isUserMuted={isUserMuted}
                    mentionQuery={mentionQuery}
                    mentionSuggestions={mentionSuggestions}
                    mentionSelectedIndex={mentionSelectedIndex}
                    insertMention={insertMention}
                    suggestionContainerRef={suggestionContainerRef}
                    inputRef={inputRef}
                    onKeyDown={(e) => {
                      if (mentionQuery && mentionSuggestions.length > 0) {
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setMentionSelectedIndex(p => Math.min(p + 1, mentionSuggestions.length - 1));
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setMentionSelectedIndex(p => Math.max(p - 1, 0));
                        } else if (e.key === "Enter" || e.key === "Tab") {
                          e.preventDefault();
                          insertMention(mentionSuggestions[mentionSelectedIndex].text);
                        } else if (e.key === "Escape") {
                          setMentionQuery(null);
                        }
                      }
                    }}
                  />
                </div>

                <MembersPanel
                  showMembers={showMembers}
                  sector={sector}
                  localCollaborators={localCollaborators}
                  isOwner={isOwner}
                  isMuteAll={isMuteAll}
                  mutedMembers={mutedMembers}
                  setMutedMembers={setMutedMembers}
                  onlineUserIds={onlineUserIds}
                  setMentionDetail={setMentionDetail}
                />
              </div>

              {/* Popover Detail Mention */}
              <MentionDetailPopup
                mentionDetail={mentionDetail}
                onClose={() => setMentionDetail(null)}
                myFriends={myFriends}
                pendingRequests={pendingRequests}
                onSendFriendRequest={async (userId) => {
                  setPendingRequests(prev => new Set(prev).add(userId));
                  toast.success("Friend request sent!");
                  const res = await sendFriendRequest(userId);
                  if ((res as any).error) {
                    toast.error((res as any).error);
                    setPendingRequests(prev => {
                      const next = new Set(prev);
                      next.delete(userId);
                      return next;
                    });
                  }
                }}
                onViewBeaconDetail={(beaconId) => {
                  setSelectedBeaconIdForDetail(beaconId);
                  setMentionDetail(null);
                }}
              />

            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {selectedBeaconIdForDetail && (() => {
        const targetBeacon = sector.beacons?.find((b: any) => b.id === selectedBeaconIdForDetail);
        if (!targetBeacon) return null;
        return (
          <BeaconDetailModal
            beacon={targetBeacon}
            sector={sector}
            onClose={() => setSelectedBeaconIdForDetail(null)}
            readOnly={!(isOwner || localCollaborators?.some((c: any) => c.userId === user.id))}
          />
        );
      })()}
      <ConfirmActionModal
        confirmAction={confirmAction}
        onCancel={() => setConfirmAction(null)}
        onConfirmClear={executeClearChat}
        onConfirmKick={executeKickMember}
      />
      <SectorQRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        sectorId={sector?.id}
        sectorName={sector?.name}
      />
    </>
  );
}
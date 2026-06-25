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
import {
  getGroupMessages, sendGroupMessage, editGroupMessage,
  deleteGroupMessage, muteMember, unmuteMember,
  clearGroupChat, kickMember, getMutedMembers,
  sendFriendRequest, getFriends, pinGroupMessageAction,
  setCollabRole, blindMember, sightMember, getBlindedMembers,
  unpinGroupMessageAction
} from "@/lib/actions";
import { toast } from "sonner";
import type { SectorWithBeacons } from "@/types";
import { DynamicIcon } from "@/components/dynamic-icon";
import { pusherClient } from "@/lib/pusher-client";

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
    if (now - lastTypingRef.current > 1000) {
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "20px", flexShrink: 0, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: sector.color || "#8b5cf6", flexShrink: 0 }}>
                    {sector.icon && typeof sector.icon === "string" && sector.icon.endsWith("Icon") ? (
                      <DynamicIcon name={sector.icon as any} className="w-6 h-6 text-white" />
                    ) : (sector.icon || "🌌")}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <h3 style={{ fontWeight: 700, color: "white", fontSize: "1.125rem", lineHeight: 1.2, margin: 0 }}>{sector.name} Chat</h3>
                    <div style={{ fontSize: "0.75rem", color: "#C4B5FD", display: "flex", alignItems: "center", gap: "4px" }}>
                      <UserGroupIcon width={12} height={12} />
                      {1 + (localCollaborators?.length || 0)} Members
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button onClick={() => setShowMembers(!showMembers)} style={{ padding: "8px", borderRadius: "10px", border: "none", cursor: "pointer", background: showMembers ? "rgba(139,92,246,0.2)" : "transparent", color: showMembers ? "#A78BFA" : "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                    <UserGroupIcon width={22} height={22} />
                  </button>
                  <button onClick={handleCloseModal} style={{ padding: "8px", borderRadius: "10px", border: "none", cursor: "pointer", background: "transparent", color: "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                    <XMarkIcon width={22} height={22} />
                  </button>
                </div>
              </div>

              {/* Area Body & Chat */}
              <div className="flex flex-1 overflow-hidden relative">
                <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>

                  <AnimatePresence>
                    {pinnedMessage && (
                      <motion.div
                        initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
                        className="absolute top-0 left-0 right-0 z-20 bg-[rgba(20,20,30,0.95)] backdrop-blur-md border-b border-violet-500/30 py-2 px-4 flex items-center justify-between shadow-lg"
                      >
                        <div className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer" style={{ padding: "10px" }} onClick={() => {
                          const el = document.getElementById(`msg-${pinnedMessage.id}`);
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                        }}>
                          <MapPinIcon width={24} height={24} className="text-violet-400 shrink-0" />
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-violet-400 text-[10px] font-bold uppercase tracking-wide">
                              {pinnedMessage.sender?.name || pinnedMessage.sender?.username}
                            </span>
                            <span className="text-gray-200 text-sm truncate line-clamp-1">{pinnedMessage.content}</span>
                          </div>
                        </div>
                        {(isOwner || amIAdmin) && (
                          <button onClick={async () => {
                            setPinnedMessage(null);
                            await unpinGroupMessageAction(sector.id);
                          }} className="text-gray-500 hover:text-white bg-transparent border-none cursor-pointer" style={{ padding: "10px 0", marginRight: "20px" }}>
                            <XMarkIcon width={18} height={18} />
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {/* Messages List */}
                  <div
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                    style={{ flex: 1, overflowY: "auto", padding: "16px", paddingTop: pinnedMessage ? "64px" : "16px", display: "flex", flexDirection: "column", gap: "12px", opacity: chatReady ? 1 : 0, transition: chatReady ? "opacity 0.2s ease-out" : "none", visibility: chatReady ? "visible" : "hidden" }}>

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
                        <span className="text-gray-400 text-sm">No signals detected yet. Be the first to transmit.</span>
                      </div>
                    ) : (
                      messages.map(msg => {
                        const isMine = msg.senderId === user.id;
                        const isMsgOwner = msg.senderId === sector.station?.userId || msg.senderId === sector.station?.user?.id || (isOwner && isMine);
                        const showOptions = selectedMsgId === msg.id;
                        const isSending = !!msg._isSending;

                        if (msg.type === "SYSTEM") {
                          return (
                            <div key={msg.id} id={`msg-${msg.id}`} style={{ textAlign: "center", margin: "4px 0" }}>
                              <span style={{ fontSize: "12px", fontWeight: 500, color: "rgba(156,163,175,1)", background: "rgba(255,255,255,0.05)", padding: "4px 12px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.1)" }}>
                                {msg.sender?.name || msg.sender?.username} {msg.content}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={msg.id}
                            id={`msg-${msg.id}`}
                            style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", position: "relative", opacity: isSending ? 0.5 : 1, transition: "opacity 0.2s" }}
                          >
                            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", maxWidth: "85%" }}>
                              {!isMine && (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const targetUser = localCollaborators?.find((c: any) => c.user.id === msg.senderId)?.user || (sector.station?.userId === msg.senderId ? sector.station.user : msg.sender);
                                    if (targetUser) setMentionDetail({ type: 'user', data: targetUser });
                                  }}
                                  className="cursor-pointer hover:opacity-80 transition-opacity"
                                  style={{
                                    width: "32px", height: "32px", borderRadius: "50%", background: "#374151", overflow: "hidden", flexShrink: 0,
                                    ...(isMsgOwner ? { border: "2px solid #FFD700", boxShadow: "0 0 12px 2px rgba(255,215,0,0.8)" } :
                                      localCollaborators.find((c: any) => c.userId === msg.senderId)?.role === "ADMIN" ? { border: "2px solid #10B981" } :
                                        { border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" })
                                  }}
                                >
                                  {msg.sender?.image ? (
                                    <img src={msg.sender.image} alt={msg.sender.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  ) : (
                                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold", color: "#D1D5DB" }}>
                                      {msg.sender?.username?.[0]?.toUpperCase()}
                                    </div>
                                  )}
                                </div>
                              )}

                              <div style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
                                {!isMine && (
                                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginLeft: "4px", marginBottom: "4px" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#D1D5DB" }}>{msg.sender?.name || msg.sender?.username}</span>
                                    <span style={{ fontSize: "10px", color: "#6B7280" }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                  </div>
                                )}
                                {isMine && (
                                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "4px", marginRight: "4px" }}>
                                    <span style={{ fontSize: "10px", color: "#6B7280" }}>
                                      {isSending ? "Sending..." : new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  </div>
                                )}

                                <motion.div
                                  animate={{ x: (swipeOffset && swipeOffset.id === msg.id) ? swipeOffset.x : 0 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                  onMouseDown={() => handlePressStart(msg.id)}
                                  onMouseUp={handlePressEnd}
                                  onMouseLeave={handlePressEnd}
                                  onTouchStart={(e) => handleTouchStartSwipe(e, msg.id)}
                                  onTouchEnd={handleTouchEndSwipe}
                                  onTouchMove={(e) => handleTouchMoveSwipe(e, msg)}
                                  onClick={(e) => { e.stopPropagation() }}
                                  style={{
                                    userSelect: "none",
                                    WebkitUserSelect: "none",
                                    padding: "10px 14px", borderRadius: "18px", width: "fit-content", cursor: "pointer", transition: "background 0.15s, border 0.15s, color 0.15s, border-radius 0.15s, box-shadow 0.15s", wordBreak: "break-word", fontSize: "15px", lineHeight: "1.5",
                                    ...(msg.isDeleted ? {
                                      background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)", color: "#6B7280", fontStyle: "italic"
                                    } : isMine ? {
                                      background: isSending ? "rgba(109,40,217,0.4)" : "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                                      border: "1px solid rgba(139,92,246,0.4)", color: "white", borderBottomRightRadius: "4px", boxShadow: isSending ? "none" : "0 4px 15px rgba(109,40,217,0.3)"
                                    } : {
                                      background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.06)", color: "#F3F4F6", borderBottomLeftRadius: "4px",
                                    })
                                  }}
                                >
                                  {msg.replyTo && !msg.isDeleted && (
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const el = document.getElementById(`msg-${msg.replyTo.id}`);
                                        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                                      }}
                                      style={{ cursor: "pointer", marginBottom: "8px", padding: "6px 10px", background: "rgba(0,0,0,0.25)", borderRadius: "10px", borderLeft: "3px solid rgba(139,92,246,0.8)", fontSize: "12px" }}
                                    >
                                      <div style={{ color: "#A78BFA", fontWeight: 600, marginBottom: "2px" }}>{msg.replyTo.sender?.name || msg.replyTo.sender?.username}</div>
                                      <div style={{ color: "#D1D5DB", opacity: 0.85, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" as any }}>{msg.replyTo.isDeleted ? "Message deleted" : msg.replyTo.content}</div>
                                    </div>
                                  )}

                                  <div>
                                    {msg.isDeleted ? (
                                      "This message was deleted"
                                    ) : (amIBlinded && !isMine && msg.type !== "SYSTEM") ? (
                                      <div style={{ padding: "0 10px", opacity: 0.3 }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
                                    ) : (
                                      msg.content.split(/(\s+)/).map((word: string, i: number) => {
                                        if (word.match(/^https?:\/\//)) {
                                          return <a key={i} href={word} target="_blank" rel="noreferrer" onClick={e => { if (!e.ctrlKey && !e.metaKey) e.preventDefault(); }} style={{ color: "#93C5FD", textDecoration: "underline" }} title="Ctrl+Click to open">{word}</a>;
                                        }
                                        if (word.startsWith('@')) {
                                          const clean = word.replace('@', '');
                                          const isMe = clean.toLowerCase() === user.username.toLowerCase();
                                          if (isMe) {
                                            return <span key={i}>{word}</span>;
                                          }

                                          return (
                                            <span
                                              key={i}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedMsgId(null);
                                                const targetUser = localCollaborators?.find((c: any) => c.user.username.toLowerCase() === clean.toLowerCase())?.user || (sector.station?.user?.username.toLowerCase() === clean.toLowerCase() ? sector.station.user : null);
                                                if (targetUser) { setMentionDetail({ type: 'user', data: targetUser }); return; }
                                                const targetBeacon = sector.beacons?.find((b: any) => b.title.replace(/\s+/g, '').toLowerCase() === clean.toLowerCase());
                                                if (targetBeacon) setMentionDetail({ type: 'beacon', data: targetBeacon });
                                              }}
                                              style={{ fontWeight: 600, padding: "1px 5px", borderRadius: "5px", background: "rgba(139,92,246,0.25)", color: "#C4B5FD", cursor: "pointer" }}
                                            >
                                              {word}
                                            </span>
                                          );
                                        }
                                        return <span key={i}>{word}</span>;
                                      })
                                    )}
                                  </div>
                                  {msg.editedAt && !msg.isDeleted && <span style={{ fontSize: "10px", opacity: 0.5, marginLeft: "6px", fontStyle: "italic" }}>(edited)</span>}
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
                                    position: "absolute", zIndex: 10, display: "flex", gap: "4px", padding: "6px", background: "rgba(17,17,30,0.97)",
                                    backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                                    bottom: "100%", marginBottom: "4px",
                                    ...(isMine ? { right: 0 } : { left: "40px" })
                                  }}
                                >
                                  <button onClick={async () => {
                                    setSelectedMsgId(null);
                                    setPinnedMessage(msg);
                                    await pinGroupMessageAction(sector.id, msg.id);
                                  }} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer" title="Pin Message" style={{ padding: "10px" }}>
                                    <MapPinIcon width={18} height={18} />
                                  </button>
                                  <button onClick={() => { setReplyToMsg(msg); setSelectedMsgId(null); inputRef.current?.focus(); }} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer" title="Reply" style={{ padding: "10px" }}>
                                    <ArrowUturnLeftIcon width={18} height={18} />
                                  </button>
                                  <button onClick={() => { navigator.clipboard.writeText(msg.content); toast.success("Copied to clipboard"); setSelectedMsgId(null); }} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer" title="Copy" style={{ padding: "10px" }}>
                                    <ClipboardDocumentIcon width={18} height={18} />
                                  </button>
                                  {msg.content.match(/https?:\/\/[^\s]+/) && (
                                    <button onClick={() => window.open(msg.content.match(/https?:\/\/[^\s]+/)[0], "_blank")} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer" title="Open Link" style={{ padding: "10px" }}>
                                      <LinkIcon width={18} height={18} />
                                    </button>
                                  )}
                                  {isMine && (
                                    <button onClick={() => { setEditMsgId(msg.id); setInputMessage(msg.content); setSelectedMsgId(null); inputRef.current?.focus(); }} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer" title="Edi t" style={{ padding: "10px" }}>
                                      <PencilIcon width={18} height={18} />
                                    </button>
                                  )}
                                  {(isMine || isOwner) && (
                                    <button onClick={() => handleDeleteMsg(msg.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors border-none bg-transparent cursor-pointer" title="Delete" style={{ padding: "10px" }}>
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
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Typing Indicator */}
                  {typingUsers.length > 0 && (
                    <div style={{ padding: "4px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ display: "flex", gap: "4px", alignItems: "center", background: "rgba(0,0,0,0.6)", padding: "6px 12px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(4px)" }}>
                        <span style={{ fontSize: "12px", color: "#A78BFA", fontWeight: 500 }}>
                          {typingUsers.map((u: any) => u.name || u.username).join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing
                        </span>
                        <div style={{ display: "flex", gap: "3px", marginLeft: "4px" }}>
                          <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} style={{ width: "4px", height: "4px", background: "#A78BFA", borderRadius: "50%", display: "block" }} />
                          <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} style={{ width: "4px", height: "4px", background: "#A78BFA", borderRadius: "50%", display: "block" }} />
                          <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} style={{ width: "4px", height: "4px", background: "#A78BFA", borderRadius: "50%", display: "block" }} />
                        </div>
                      </div>
                    </div>
                  )}

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
                          title="Scroll to bottom"
                          style={{ padding: "10px" }}
                        >
                          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Input Area */}
                  <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.5)", borderTop: "1px solid rgba(255,255,255,0.07)", position: "relative", backdropFilter: "blur(10px)" }}>

                    {/* Reply / Edit Context... */}
                    {replyToMsg && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", padding: "8px 12px", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "10px" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "12px", color: "#A78BFA", fontWeight: 600 }}>Replying to {replyToMsg.sender?.name || replyToMsg.sender?.username}</span>
                          <span style={{ fontSize: "13px", color: "#D1D5DB", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "300px" }}>{replyToMsg.content}</span>
                        </div>
                        <button onClick={() => setReplyToMsg(null)} style={{ padding: "4px", color: "#9CA3AF", background: "transparent", border: "none", cursor: "pointer" }}>
                          <XMarkIcon width={16} height={16} />
                        </button>
                      </div>
                    )}
                    {editMsgId && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", padding: "8px 12px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "10px" }}>
                        <span style={{ fontSize: "12px", color: "#60A5FA", fontWeight: 600 }}>Editing Message</span>
                        <button onClick={() => { setEditMsgId(null); setInputMessage(""); }} style={{ padding: "4px", color: "#9CA3AF", background: "transparent", border: "none", cursor: "pointer" }}>
                          <XMarkIcon width={16} height={16} />
                        </button>
                      </div>
                    )}

                    {/* Mention Suggestions */}
                    <AnimatePresence>
                      {mentionQuery && mentionSuggestions.length > 0 && (
                        <motion.div
                          ref={suggestionContainerRef}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                          style={{ position: "absolute", bottom: "100%", left: "16px", marginBottom: "8px", background: "rgba(17,17,30,0.97)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "14px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", overflow: "hidden", zIndex: 20, maxHeight: "156px", overflowY: "auto", minWidth: "220px" }}
                        >
                          {mentionSuggestions.map((sg: any, idx: number) => (
                            <div
                              key={idx}
                              onClick={() => insertMention(sg.text)}
                              style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", transition: "background 0.15s", background: idx === mentionSelectedIndex ? "rgba(139,92,246,0.3)" : "transparent" }}
                            >
                              {sg.image ? <img src={sg.image} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#374151", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>{sg.label[0]?.toUpperCase()}</div>}
                              <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                                <span style={{ fontSize: "14px", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px", display: "block" }}>{sg.label}</span>
                                {sg.subtitle && <span style={{ fontSize: "12px", color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sg.subtitle}</span>}
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "8px" }}>
                      <input
                        ref={inputRef}
                        type="text"
                        disabled={isUserMuted}
                        placeholder={isUserMuted ? "You are muted in this group." : "Type a message..."}
                        value={inputMessage}
                        onChange={handleInputChange}
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
                        style={{ flex: 1, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "10px 16px", borderRadius: "12px", outline: "none", fontSize: "14px", transition: "border-color 0.2s" }}
                        onFocus={e => e.target.style.borderColor = "rgba(139,92,246,0.6)"}
                        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                      />
                      <button
                        type="submit"
                        disabled={isUserMuted || !inputMessage.trim()}
                        style={{ background: isUserMuted || !inputMessage.trim() ? "#374151" : "linear-gradient(135deg, #7c3aed, #4f46e5)", color: isUserMuted || !inputMessage.trim() ? "#6B7280" : "white", padding: "10px 14px", borderRadius: "12px", border: "none", cursor: isUserMuted || !inputMessage.trim() ? "not-allowed" : "pointer", boxShadow: inputMessage.trim() ? "0 0 15px rgba(109,40,217,0.4)" : "none", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                      >
                        <PaperAirplaneIcon width={22} height={22} />
                      </button>
                    </form>
                  </div>
                </div>

                <AnimatePresence>
                  {showMembers && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 240, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="absolute right-0 top-0 bottom-0 sm:relative sm:top-auto sm:bottom-auto z-50 flex flex-col flex-shrink-0 h-full border-l border-white/10"
                      style={{ background: "rgba(15,15,25,0.95)", backdropFilter: "blur(12px)", overflow: "hidden" }}
                    >
                      {/* Members Header */}
                      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <UserGroupIcon width={16} height={16} style={{ color: "#A78BFA", flexShrink: 0 }} />
                        <h4 style={{ color: "white", fontWeight: 700, fontSize: "14px", margin: 0 }}>Members</h4>
                        <span style={{ fontSize: "12px", color: "#6B7280", marginLeft: "auto" }}>{1 + (localCollaborators?.length || 0)}</span>
                      </div>

                      {/* Members List */}
                      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
                        {sector.station?.user && (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", marginBottom: "4px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ position: "relative", width: "34px", height: "34px", flexShrink: 0 }}>
                                <div
                                  onClick={(e) => { e.stopPropagation(), setMentionDetail({ type: 'user', data: sector.station.user }) }}
                                  className="cursor-pointer hover:opacity-80 transition-opacity"
                                  style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#374151", overflow: "hidden", border: "2px solid #FFD700", boxShadow: "0 0 8px rgba(255,215,0,0.5)" }}
                                >
                                  {sector.station.user.image
                                    ? <img src={sector.station.user.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", color: "#D1D5DB" }}>{sector.station.user.username?.[0]?.toUpperCase()}</div>
                                  }
                                </div>
                                {/* Titik Online */}
                                <div style={{
                                  position: "absolute", bottom: -2, right: -2, width: "12px", height: "12px", borderRadius: "50%",
                                  background: onlineUserIds.has(sector.station.user.id) ? "#10B981" : "#4B5563", border: "2px solid rgba(15,15,25,0.95)",
                                  transition: "background 0.3s"
                                }} title={onlineUserIds.has(sector.station.user.id) ? "Online" : "Offline"} />
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                                <span style={{ fontSize: "14px", fontWeight: 500, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "130px" }}>{sector.station.user.name || sector.station.user.username}</span>
                                <span style={{ fontSize: "10px", color: "#A78BFA", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Owner</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {localCollaborators?.map((c: any) => {
                          const isMuted = isMuteAll
                            ? (!mutedMembers.includes(c.user.id))
                            : (mutedMembers.includes(c.user.id));
                          const isOnline = onlineUserIds.has(c.user.id);
                          return (
                            <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: "10px", marginBottom: "2px", transition: "background 0.15s", cursor: "default" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>

                                {/* STRUKTUR AVATAR MEMBER YANG BARU */}
                                <div style={{ position: "relative", width: "34px", height: "34px", flexShrink: 0 }}>
                                  <div
                                    onClick={(e) => { e.stopPropagation(); setMentionDetail({ type: 'user', data: c.user }) }}
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                    style={{
                                      width: "100%", height: "100%", borderRadius: "50%", background: "#374151", overflow: "hidden",
                                      ...(c.role === "ADMIN" ? { border: "2px solid #10B981" } : { border: "1px solid rgba(255,255,255,0.1)" })
                                    }}
                                  >
                                    {c.user.image
                                      ? <img src={c.user.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", color: "#D1D5DB" }}>{c.user.username?.[0]?.toUpperCase()}</div>
                                    }
                                  </div>

                                  {/* Titik Online Indicator */}
                                  <div style={{
                                    position: "absolute", bottom: -2, right: -2, width: "12px", height: "12px", borderRadius: "50%",
                                    background: isOnline ? "#10B981" : "#4B5563", border: "2px solid rgba(15,15,25,0.95)",
                                    transition: "background 0.3s"
                                  }} title={isOnline ? "Online" : "Offline"} />
                                </div>
                                {/* END AVATAR MEMBER */}

                                <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#E5E7EB", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100px" }}>{c.user.name || c.user.username}</span>
                                  <span style={{ fontSize: "10px", color: c.role === "ADMIN" ? "#10B981" : "#9CA3AF", fontWeight: 700, textTransform: "uppercase" }}>{c.role} {isMuted && <span style={{ color: "#F87171" }}>• MUTED</span>}</span>
                                </div>
                              </div>
                              {isOwner && (
                                <button
                                  onClick={async () => {
                                    if (isMuted) {
                                      await unmuteMember(sector.id, c.user.id);
                                      setMutedMembers(prev => prev.filter(id => id !== c.user.id));
                                    } else {
                                      await muteMember(sector.id, c.user.id);
                                      setMutedMembers(prev => [...prev, c.user.id]);
                                    }
                                  }}
                                  style={{ fontSize: "12px", padding: "4px 8px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "6px", color: "white", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "background 0.15s" }}
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
              </div>

              {/* Popover Detail Mention */}
              <AnimatePresence>
                {mentionDetail && (() => {
                  const isUserType = mentionDetail.type === 'user';
                  const allowAddFriend = isUserType && mentionDetail.data.allowFriendRequests !== false;
                  const allowVisitProfile = isUserType && mentionDetail.data.station?.isPublic !== false;
                  const isAlreadyFriend = isUserType && myFriends.some(f => f.id === mentionDetail.data.id);
                  const isPending = isUserType && pendingRequests.has(mentionDetail.data.id);

                  return (
                    <motion.div
                      onClick={(e) => e.stopPropagation()}
                      initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute z-[120] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[rgba(20,20,30,0.95)] backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-violet-500/30 flex flex-col gap-4 min-w-[300px]"
                      style={{ padding: "1.5rem" }}
                    >
                      <button onClick={() => setMentionDetail(null)} className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-1">
                        <XMarkIcon width={20} height={20} />
                      </button>

                      <div className="flex items-center gap-5">
                        <div className="p-1 rounded-full bg-white/5 border border-white/10 shrink-0">
                          <img src={mentionDetail.data.image || mentionDetail.data.faviconUrl || '/default.png'} className="w-16 h-16 rounded-full object-cover" />
                        </div>
                        <div className="flex flex-col pr-6">
                          <h4 className="text-white font-bold text-lg m-0">{mentionDetail.data.name || mentionDetail.data.title}</h4>
                          {isUserType ? (
                            <p className="text-gray-400 text-sm m-0">@{mentionDetail.data.username} {mentionDetail.data.callsign ? `• ${mentionDetail.data.callsign}` : ''}</p>
                          ) : (
                            <p className="text-violet-400 text-sm m-0">Sector Beacon Reference</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full">
                        {isUserType ? (
                          <>
                            {allowAddFriend && (
                              <button
                                disabled={isAlreadyFriend || isPending}
                                onClick={async () => {
                                  if (isAlreadyFriend || isPending) return;
                                  
                                  setPendingRequests(prev => new Set(prev).add(mentionDetail.data.id));
                                  toast.success("Friend request sent!");
                                  const res = await sendFriendRequest(mentionDetail.data.id);
                                  if ((res as any).error) {
                                    toast.error((res as any).error);
                                    setPendingRequests(prev => {
                                      const next = new Set(prev);
                                      next.delete(mentionDetail.data.id);
                                      return next;
                                    });
                                  }
                                }}
                                style={{ padding: "5px 0" }}
                                className={`flex-1 flex justify-center items-center gap-2 rounded-xl text-sm font-semibold transition-colors border-none ${
                                  isAlreadyFriend || isPending ? 'bg-white/5 text-gray-400 cursor-default' : 'bg-violet-600 hover:bg-violet-500 text-white cursor-pointer'
                                }`}
                              >
                                {isAlreadyFriend ? <UsersIcon width={18} height={18} /> : <UserPlusIcon width={18} height={18} />}
                                {isAlreadyFriend ? "Friends" : isPending ? "Pending" : "Add Friend"}
                              </button>
                            )}
                            {allowVisitProfile && (
                              <a
                                href={`/station/${mentionDetail.data.username}`}
                                target="_blank"
                                style={{ padding: "5px 0", color: "white" }}
                                className="flex-1 flex justify-center items-center gap-2 text-center bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition-colors no-underline"
                              >
                                <GlobeAltIcon width={18} height={18} /> Visit Profile
                              </a>
                            )}
                            {!allowAddFriend && !allowVisitProfile && (
                              <p className="text-gray-500 text-sm italic w-full text-center m-0">This pilot's station is completely private.</p>
                            )}
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setSelectedBeaconIdForDetail(mentionDetail.data.id);
                                setMentionDetail(null);
                              }}
                              style={{ padding: "5px 0" }}
                              className="flex-1 flex justify-center items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors border-none cursor-pointer"
                            >
                              <EyeIcon width={18} height={18} /> See Detail
                            </button>
                            <a
                              href={mentionDetail.data.url}
                              target="_blank"
                              style={{ padding: "5px 0", color: "white" }}
                              className="flex-1 flex justify-center items-center gap-2 text-center bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition-colors no-underline"
                            >
                              <RocketLaunchIcon width={18} height={18} /> Launch
                            </a>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>

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
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="flex flex-col gap-4 w-full max-w-[400px] rounded-2xl p-6 shadow-2xl"
              style={{ background: "rgba(20,20,30,0.95)", border: "1px solid rgba(239,68,68,0.3)", backdropFilter: "blur(12px)", padding: "20px" }}
            >
              <h3 className="text-[#ef4444] text-xl font-bold m-0">
                {confirmAction.type === 'clear' ? 'Clear Chat History?' : 'Kick Member?'}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed m-0">
                {confirmAction.type === 'clear'
                  ? "Are you absolutely sure you want to clear all messages in this group chat? This action cannot be undone and will affect all members."
                  : `Are you sure you want to kick ${confirmAction.targetUser?.name || confirmAction.targetUser?.username} (@${confirmAction.targetUser?.username}) from this sector? They will lose access immediately.`}
              </p>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="px-4 py-2 rounded-xl bg-transparent text-gray-400 hover:text-white border border-white/20 transition-colors cursor-pointer"
                  style={{ padding: "8px 24px" }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction.type === 'clear' ? executeClearChat : executeKickMember}
                  className="px-4 py-2 rounded-xl bg-[#ef4444] hover:bg-red-600 text-white font-semibold border-none transition-colors cursor-pointer"
                  style={{ padding: "8px 24px" }}
                >
                  {confirmAction.type === 'clear' ? 'Clear Messages' : 'Kick Member'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getNotificationStats } from "@/lib/actions";
import { toast } from "sonner";
import { pusherClient } from "@/lib/pusher-client";

export type NotificationStats = {
  totalUnreadMessages: number;
  totalPendingRequests: number;
  hasNotifications: boolean;
  unreadPerFriend: Record<string, number>;
  latestGroupMessages?: any[];
  soundConfig?: { enabled: boolean; url: string };
};

interface UseNotificationsOptions {
  userId?: string;
  activeSectorId?: string | null;
  activeFriendId?: string | null;
  onChatNotificationClick?: (type: 'private' | 'group', id: string) => void;
}

const globalSpamTracker: Record<string, { count: number, firstMsgTime: number, suspendedUntil: number, mentionBypassUsed?: boolean }> = {};

export function useNotifications({
  userId,
  activeSectorId,
  activeFriendId,
  onChatNotificationClick,
}: UseNotificationsOptions = {}) {
  const [stats, setStats] = useState<NotificationStats>({
    totalUnreadMessages: 0,
    totalPendingRequests: 0,
    hasNotifications: false,
    unreadPerFriend: {},
    latestGroupMessages: [],
  });

  const activeSectorIdRef = useRef(activeSectorId);
  const activeFriendIdRef = useRef(activeFriendId);
  const statsRef = useRef(stats);

  const soundConfigRef = useRef<{ enabled: boolean; url: string }>({
    enabled: true,
    url: "/sounds/notif-default.mp3"
  });

  const [unreadGroupSectors, setUnreadGroupSectors] = useState<Record<string, { unread: boolean, mention: boolean }>>({});

  const clearGroupUnread = useCallback((sectorId: string) => {
    setUnreadGroupSectors(prev => {
      const next = { ...prev };
      delete next[sectorId];
      return next;
    });
  }, []);

  // 1. MINTA IZIN SAAT PERTAMA KALI LOAD
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // 2. FUNGSI HELPER UNTUK MENGIRIM NOTIFIKASI OS/SISTEM
  const showSystemNotification = useCallback((title: string, body: string) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted" && document.hidden) {
        new Notification(title, {
          body: body,
          icon: "/icon.png"
        });
      }
    }
  }, []);

  useEffect(() => { statsRef.current = stats; }, [stats]);

  useEffect(() => {
    activeSectorIdRef.current = activeSectorId;
    if (activeSectorId && globalSpamTracker[activeSectorId]) {
      delete globalSpamTracker[activeSectorId];
    }
  }, [activeSectorId]);

  useEffect(() => {
    activeFriendIdRef.current = activeFriendId;
    if (activeFriendId && globalSpamTracker[activeFriendId]) {
      delete globalSpamTracker[activeFriendId];
    }
  }, [activeFriendId]);

  const checkSpam = useCallback((sourceId: string, isMention: boolean = false) => {
    const now = Date.now();
    if (!globalSpamTracker[sourceId]) {
      globalSpamTracker[sourceId] = { count: 0, firstMsgTime: now, suspendedUntil: 0, mentionBypassUsed: false };
    }
    const tracker = globalSpamTracker[sourceId];

    // Jika sedang dalam hukuman spam
    if (now < tracker.suspendedUntil) {
      if (isMention && !tracker.mentionBypassUsed) {
        tracker.mentionBypassUsed = true; // Tiket gratis terpakai
        return false; // Loloskan notif!
      }
      return true; // Blokir
    }

    // Jika masa penangguhan sudah lewat (1 menit), reset hitungan
    if (now - tracker.firstMsgTime > 60000) {
      tracker.count = 0;
      tracker.firstMsgTime = now;
      tracker.mentionBypassUsed = false;
    }

    tracker.count += 1;
    const unreadCount = statsRef.current.unreadPerFriend[sourceId] || 0;

    // Jika pesan terlalu banyak masuk, aktifkan hukuman Spam
    if (tracker.count > 3 || unreadCount >= 3) {
      tracker.suspendedUntil = now + 60000;
      tracker.count = 0;

      if (isMention) {
        tracker.mentionBypassUsed = true;
        return false;
      }
      return true;
    }

    return false;
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getNotificationStats();
      if (res) {
        setStats(res as NotificationStats);
        if (res.soundConfig) {
          soundConfigRef.current = res.soundConfig;
        }
      }
    } catch (e) {
      console.error("Failed to fetch notification stats", e);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    let channelName = "";
    if (userId) {
      channelName = `private-user-${userId}`;
      const channel = pusherClient.subscribe(channelName);

      pusherClient.subscribe('presence-global');

      channel.bind("new-notification", (payload: any) => {
        if (payload && payload.type) {

          if (payload.type === 'NEW_PRIVATE_MESSAGE') {
            const { senderId, senderName, content, messageId } = payload.data;
            if (activeFriendIdRef.current !== senderId) {
              const isSpam = checkSpam(senderId);
              if (!isSpam) {
                toast.success(`Message from ${senderName}`, {
                  description: content,
                  id: `priv-msg-${messageId}`,
                  action: {
                    label: "View",
                    onClick: () => {
                      if (onChatNotificationClick) onChatNotificationClick('private', senderId);
                    }
                  }
                });
                // ---> NOTIF BROWSER <---
                showSystemNotification(`Message from ${senderName}`, content);

                const sound = soundConfigRef.current;
                if (sound?.enabled) {
                  const audio = new Audio(sound.url);
                  audio.volume = 0.5;
                  audio.play().catch(() => { });
                }
              }
            }
            fetchStats();

          } else if (payload.type === 'NEW_FRIEND_REQUEST') {
            toast.success("New friend request received", { id: `new-req-${Date.now()}` });
            // ---> NOTIF BROWSER <---
            showSystemNotification("Friend Request", "You have a new friend request.");

            const sound = soundConfigRef.current;
            if (sound?.enabled) {
              const audio = new Audio(sound.url);
              audio.volume = 0.5;
              audio.play().catch(() => { });
            }
            fetchStats();

          } else if (payload.type === 'NEW_COLLAB_INVITE') {
            const { sectorName, senderName } = payload.data;
            toast.success("Collaboration Invite", {
              description: `${senderName} invited you to sector ${sectorName}`,
              id: `collab-${Date.now()}`
            });
            // ---> NOTIF BROWSER <---
            showSystemNotification("Collaboration Invite", `${senderName} invited you to sector ${sectorName}`);

            const sound = soundConfigRef.current;
            if (sound?.enabled) {
              const audio = new Audio(sound.url);
              audio.volume = 0.5;
              audio.play().catch(() => { });
            }
            fetchStats();

          } else if (payload.type === 'NEW_GROUP_MESSAGE') {
            const { sectorId, sectorName, senderName, content, isMention, messageId } = payload.data;
            if (activeSectorIdRef.current !== sectorId) {
              setUnreadGroupSectors(prev => ({
                ...prev,
                [sectorId]: { unread: true, mention: prev[sectorId]?.mention || isMention }
              }));
              const isSpam = checkSpam(sectorId, isMention);
              if (!isSpam) {
                const title = isMention
                  ? `${senderName} mentioned you in Sector: ${sectorName}`
                  : `Message from Sector: ${sectorName}`;

                toast.info(title, {
                  description: `${senderName}: ${content}`,
                  id: `grp-msg-${messageId}`,
                  action: {
                    label: "View",
                    onClick: () => {
                      if (onChatNotificationClick) onChatNotificationClick('group', sectorId);
                    }
                  }
                });
                // ---> NOTIF BROWSER <---
                showSystemNotification(title, `${senderName}: ${content}`);

                const sound = soundConfigRef.current;
                if (sound?.enabled) {
                  const audio = new Audio(sound.url);
                  audio.volume = 0.5;
                  audio.play().catch(() => { });
                }
              }
            }
          } else if (payload.type === 'TOAST') {
            toast.success(payload.message, { id: `toast-${Date.now()}` });
            showSystemNotification("Orbit Station Notification", payload.message);

            const sound = soundConfigRef.current;
            if (sound?.enabled) {
              const audio = new Audio(sound.url);
              audio.volume = 0.5;
              audio.play().catch(() => { });
            }
            fetchStats();
          }
        } else {
          fetchStats();
        }
      });
    }

    const onFocus = () => fetchStats();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      pusherClient.unsubscribe('presence-global');
      if (channelName) {
        pusherClient.unsubscribe(channelName);
      }
    };
  }, [fetchStats, userId, checkSpam]);

  return { stats, refetch: fetchStats, unreadGroupSectors, clearGroupUnread };
}
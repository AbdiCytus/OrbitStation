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
}

const globalSpamTracker: Record<string, { count: number, firstMsgTime: number, suspendedUntil: number }> = {};

export function useNotifications({
  userId,
  activeSectorId,
  activeFriendId,
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

  const checkSpam = useCallback((sourceId: string) => {
    const now = Date.now();
    if (!globalSpamTracker[sourceId]) {
      globalSpamTracker[sourceId] = { count: 0, firstMsgTime: now, suspendedUntil: 0 };
    }
    const tracker = globalSpamTracker[sourceId];

    if (now < tracker.suspendedUntil) return true;

    if (now - tracker.firstMsgTime > 60000) {
      tracker.count = 0;
      tracker.firstMsgTime = now;
    }

    tracker.count += 1;

    const unreadCount = statsRef.current.unreadPerFriend[sourceId] || 0;

    if (tracker.count > 3 || unreadCount >= 3) {
      tracker.suspendedUntil = now + 60000;
      tracker.count = 0;
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

      channel.bind("new-notification", (payload: any) => {
        if (payload && payload.type) {

          if (payload.type === 'NEW_PRIVATE_MESSAGE') {
            const { senderId, senderName, content, messageId } = payload.data;
            if (activeFriendIdRef.current !== senderId) {
              const isSpam = checkSpam(senderId);
              if (!isSpam) {
                toast.success(`Message from ${senderName}`, {
                  description: content,
                  id: `priv-msg-${messageId}`
                });
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
              const isSpam = checkSpam(sectorId);
              if (!isSpam) {
                const title = isMention
                  ? `${senderName} mentioned you in sector ${sectorName}`
                  : `New message from sector ${sectorName}`;

                toast.info(title, {
                  description: `${senderName}: ${content}`,
                  id: `grp-msg-${messageId}`
                });
                const sound = soundConfigRef.current;
                if (sound?.enabled) {
                  const audio = new Audio(sound.url);
                  audio.volume = 0.5;
                  audio.play().catch(() => { });
                }
              }
            }
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
      if (channelName) {
        pusherClient.unsubscribe(channelName);
      }
    };
  }, [fetchStats, userId, checkSpam]);

  return { stats, refetch: fetchStats };
}
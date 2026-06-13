"use client";

import { useState, useEffect, useCallback } from "react";
import { getNotificationStats } from "@/lib/actions";

export type NotificationStats = {
  totalUnreadMessages: number;
  totalPendingRequests: number;
  hasNotifications: boolean;
  unreadPerFriend: Record<string, number>;
};

export function useNotifications() {
  const [stats, setStats] = useState<NotificationStats>({
    totalUnreadMessages: 0,
    totalPendingRequests: 0,
    hasNotifications: false,
    unreadPerFriend: {}
  });

  const fetchStats = useCallback(async () => {
    try {
      const res = await getNotificationStats();
      if (res) {
        setStats(res);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchStats();
    // Poll every 15 seconds
    const interval = setInterval(fetchStats, 15000);
    
    // Also fetch when window regains focus
    const onFocus = () => fetchStats();
    window.addEventListener("focus", onFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return { stats, refetch: fetchStats };
}

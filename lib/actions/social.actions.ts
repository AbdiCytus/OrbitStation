"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { pusherServer } from "@/lib/pusher";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { requireAuth, requireStation } from "./utils";

// SOCIAL ACTIONS
// ============================================================

export async function searchPilots(query: string) {
  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!query || query.trim().length < 2) return [];
  const searchStr = query.trim();

  // Find users
  const users = await db.user.findMany({
    where: {
      OR: [
        { username: { contains: searchStr, mode: "insensitive" } },
        { name: { contains: searchStr, mode: "insensitive" } },
        { callsign: { contains: searchStr, mode: "insensitive" } },
      ],
      ...(currentUserId ? { id: { not: currentUserId } } : {}),
    },
    select: {
      id: true,
      username: true,
      name: true,
      callsign: true,
      image: true,
      titleBadge: true,
      station: {
        select: { isPublic: true },
      },
    },
    take: 10,
  });

  if (!currentUserId) {
    return users.map(u => ({ ...u, friendshipStatus: null }));
  }

  // Get friendship status for these users
  const friendships = await db.friendship.findMany({
    where: {
      OR: [
        { requesterId: currentUserId, receiverId: { in: users.map(u => u.id) } },
        { receiverId: currentUserId, requesterId: { in: users.map(u => u.id) } },
      ]
    }
  });

  return users.map(u => {
    const fs = friendships.find(f => (f.requesterId === u.id || f.receiverId === u.id));
    return { ...u, friendshipStatus: fs ? fs.status : null };
  });
}

export async function getFriends() {
  const user = await requireAuth();

  const friendships = await db.friendship.findMany({
    where: {
      OR: [
        { requesterId: user.id },
        { receiverId: user.id },
      ],
      status: "ACCEPTED",
    },
    include: {
      requester: { select: { id: true, username: true, name: true, callsign: true, image: true, titleBadge: true, station: { select: { isPublic: true } } } },
      receiver: { select: { id: true, username: true, name: true, callsign: true, image: true, titleBadge: true, station: { select: { isPublic: true } } } },
    }
  });

  return friendships.map(f => {
    const isRequester = f.requesterId === user.id;
    const friend = isRequester ? f.receiver : f.requester;
    return {
      friendshipId: f.id,
      ...friend,
    };
  });
}

export async function getFriendRequests() {
  const user = await requireAuth();

  const requests = await db.friendship.findMany({
    where: {
      receiverId: user.id,
      status: "PENDING",
    },
    include: {
      requester: { select: { id: true, username: true, name: true, callsign: true, image: true, titleBadge: true } },
    }
  });

  return requests.map(r => ({
    friendshipId: r.id,
    ...r.requester,
  }));
}

export async function sendFriendRequest(receiverId: string) {
  const user = await requireAuth();
  if (user.id === receiverId) return { error: "Cannot send request to yourself" };

  const existing = await db.friendship.findFirst({
    where: {
      OR: [
        { requesterId: user.id, receiverId },
        { requesterId: receiverId, receiverId: user.id },
      ]
    }
  });

  if (existing) {
    if (existing.status === "PENDING") return { error: "Request already pending" };
    if (existing.status === "ACCEPTED") return { error: "Already friends" };

    const updated = await db.friendship.update({
      where: { id: existing.id },
      data: { status: "PENDING", requesterId: user.id!, receiverId }
    });

    // [PUSH DATA]
    await pusherServer.trigger(`private-user-${receiverId}`, 'new-notification', {
      type: 'NEW_FRIEND_REQUEST',
      data: { requesterId: user.id }
    });

    return { data: updated };
  }

  const friendship = await db.friendship.create({
    data: { requesterId: user.id!, receiverId, status: "PENDING" }
  });

  // [PUSH DATA]
  await pusherServer.trigger(`private-user-${receiverId}`, 'new-notification', {
    type: 'NEW_FRIEND_REQUEST',
    data: { requesterId: user.id }
  });

  return { data: friendship };
}

export async function acceptFriendRequest(friendshipId: string) {
  const user = await requireAuth();

  const friendship = await db.friendship.findUnique({ where: { id: friendshipId } });
  if (!friendship || friendship.receiverId !== user.id) return { error: "Request not found" };

  const updated = await db.friendship.update({
    where: { id: friendshipId },
    data: { status: "ACCEPTED" }
  });

  await pusherServer.trigger(`private-user-${friendship.requesterId}`, 'new-notification', {
    type: 'TOAST',
    message: `${user.name || (user as any).username} accepted your friend request!`
  });

  return { data: updated };
}

export async function rejectFriendRequest(friendshipId: string) {
  const user = await requireAuth();

  const friendship = await db.friendship.findUnique({ where: { id: friendshipId } });
  if (!friendship || friendship.receiverId !== user.id) return { error: "Request not found" };

  await db.friendship.delete({ where: { id: friendshipId } });

  await pusherServer.trigger(`private-user-${friendship.requesterId}`, 'new-notification', {
    type: 'TOAST',
    message: `${user.name || (user as any).username} declined your friend request.`
  });

  return { success: true };
}

export async function getChatMessages(friendId: string) {
  const user = await requireAuth();

  const messages = await db.chatMessage.findMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: friendId },
        { senderId: friendId, receiverId: user.id },
      ]
    },
    orderBy: { createdAt: "asc" }
  });

  return messages;
}

export async function sendChatMessage(receiverId: string, content: string) {
  const user = await requireAuth();
  if (!content.trim()) return { error: "Message is empty" };

  const friendship = await db.friendship.findFirst({
    where: {
      OR: [
        { requesterId: user.id, receiverId },
        { requesterId: receiverId, receiverId: user.id },
      ],
      status: "ACCEPTED"
    }
  });

  if (!friendship) return { error: "Not friends" };

  const message = await db.chatMessage.create({
    data: {
      senderId: user.id!,
      receiverId,
      content: content.trim()
    },
    include: {
      sender: { select: { id: true, name: true, username: true, image: true, titleBadge: true } }
    }
  });

  const chatId = [user.id, receiverId].sort().join('_');
  const pusherPayload = {
    ...message,
    sender: { ...message.sender, image: null }
  };
  await pusherServer.trigger(`private-chat-${chatId}`, 'new-private-message', pusherPayload);

  await pusherServer.trigger(`private-user-${receiverId}`, 'new-notification', {
    type: 'NEW_PRIVATE_MESSAGE',
    data: {
      messageId: message.id,
      content: message.content,
      senderId: user.id,
      senderName: user.name || "Pilot",
      timestamp: message.createdAt.toISOString()
    }
  });

  return { data: message };
}

export async function clearChat(friendId: string) {
  const user = await requireAuth();
  await db.chatMessage.deleteMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: friendId },
        { senderId: friendId, receiverId: user.id },
      ]
    }
  });
  return { success: true };
}

export async function removeFriend(friendId: string) {
  const user = await requireAuth();

  const friendship = await db.friendship.findFirst({
    where: {
      OR: [
        { requesterId: user.id, receiverId: friendId },
        { requesterId: friendId, receiverId: user.id },
      ]
    }
  });

  if (!friendship) return { error: "Friendship not found" };

  await db.$transaction([
    db.friendship.delete({ where: { id: friendship.id } }),
    db.chatMessage.deleteMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: friendId },
          { senderId: friendId, receiverId: user.id },
        ]
      }
    })
  ]);
  return { success: true };
}

// ============================================================
// ACCOUNT ACTIONS
// ============================================================

export async function deleteAccount() {
  const user = await requireAuth();

  try {
    await db.user.delete({
      where: { id: user.id },
    });
    return { success: true };
  } catch (err) {
    console.error('Failed to delete account:', err);
    return { error: 'Failed to delete account' };
  }
}

// ============================================================
// NOTIFICATION ACTIONS
// ============================================================

export async function getNotificationStats() {
  const user = await requireAuth();

  const [unreadMessages, pendingRequests, dbUser] = await Promise.all([
    db.chatMessage.count({
      where: {
        receiverId: user.id,
        isRead: false
      }
    }),
    db.friendship.count({
      where: {
        receiverId: user.id,
        status: "PENDING"
      }
    }),
    db.user.findUnique({
      where: { id: user.id },
      select: { notifSoundEnabled: true, notifSoundUrl: true }
    })
  ]);

  // Unread per friend
  const unreadPerFriendData = await db.chatMessage.groupBy({
    by: ['senderId'],
    where: {
      receiverId: user.id,
      isRead: false
    },
    _count: {
      id: true
    }
  });

  const unreadPerFriend = unreadPerFriendData.reduce((acc, curr) => {
    acc[curr.senderId] = curr._count.id;
    return acc;
  }, {} as Record<string, number>);

  // Latest group messages per sector to notify user
  // We get the sectors the user is part of
  const mySectors = await db.sector.findMany({
    where: {
      OR: [
        { station: { userId: user.id } },
        { collaborators: { some: { userId: user.id } } }
      ]
    },
    select: { id: true }
  });

  const sectorIds = mySectors.map(s => s.id);

  // Latest message for each sector
  const latestGroupMessagesData = await db.groupMessage.findMany({
    where: {
      sectorId: { in: sectorIds },
      senderId: { not: user.id }
    },
    orderBy: { createdAt: 'desc' },
    distinct: ['sectorId'],
    select: { id: true, sectorId: true, sender: { select: { name: true, username: true } }, content: true, createdAt: true, sector: { select: { name: true } } }
  });

  return {
    totalUnreadMessages: unreadMessages,
    totalPendingRequests: pendingRequests,
    hasNotifications: unreadMessages > 0 || pendingRequests > 0,
    unreadPerFriend,
    latestGroupMessages: latestGroupMessagesData,
    soundConfig: {
      enabled: dbUser?.notifSoundEnabled ?? true,
      url: dbUser?.notifSoundUrl || "/sounds/notif-default.mp3"
    }
  };
}

export async function markChatAsRead(senderId: string) {
  const user = await requireAuth();

  await db.chatMessage.updateMany({
    where: {
      senderId,
      receiverId: user.id,
      isRead: false
    },
    data: {
      isRead: true
    }
  });

  return { success: true };
}


export async function recordStationVisit(stationId: string, visitorId?: string) {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown-ip";

    if (!checkRateLimit(`visit_${ip}`, 1, 300000)) {
      return { success: false, message: "Rate limited" };
    }

    const station = await db.station.findUnique({ where: { id: stationId }, select: { userId: true } });
    if (!station || station.userId === visitorId) {
      return { success: true }; // Do not record visit if it's the owner
    }

    await db.stationVisit.create({
      data: {
        stationId,
        visitorId: visitorId || null
      }
    });
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getStationAnalytics(stationId: string) {
  try {
    const totalVisits = await db.stationVisit.count({ where: { stationId } });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentVisits = await db.stationVisit.findMany({
      where: {
        stationId,
        visitorId: null,
        createdAt: { gte: sevenDaysAgo }
      },
      select: { createdAt: true }
    });

    const guestVisitorsCount = await db.stationVisit.count({
      where: { stationId, visitorId: null }
    });

    const topBeacons = await db.beacon.findMany({
      where: { sector: { stationId } },
      orderBy: { visits: 'desc' },
      take: 5,
      select: { title: true, visits: true, imageUrl: true, faviconUrl: true }
    });

    return { totalVisits, recentVisits, uniqueVisitorCount: guestVisitorsCount, topBeacons };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ============================================================
"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { pusherServer } from "@/lib/pusher";

// ============================================================
// HELPER — ambil session + pastikan Station user sudah ada
// ============================================================

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return { ...session.user, id: session.user.id };
}

async function requireStation(userId: string) {
  // Cari Station milik user, buat otomatis jika belum ada
  let station = await db.station.findUnique({ where: { userId } });
  if (!station) {
    station = await db.station.create({ data: { userId } });
  }
  return station;
}

// ============================================================
// SECTOR ACTIONS
// ============================================================

export type SectorFormData = {
  name: string;
  icon?: string;
  color?: string;
  isPublic?: boolean;
  invitedFriendIds?: string[];
};

/** Buat Sektor baru di Station pengguna */
export async function createSector(data: SectorFormData) {
  const user = await requireAuth();
  const station = await requireStation(user.id!);

  if (!data.name?.trim()) {
    return { error: "Sector name is required" };
  }

  // Hitung order: taruh di urutan terakhir
  const lastSector = await db.sector.findFirst({
    where: { stationId: station.id },
    orderBy: { order: "desc" },
  });
  const newOrder = (lastSector?.order ?? -1) + 1;

  const sector = await db.sector.create({
    data: {
      stationId: station.id,
      name: data.name.trim(),
      icon: data.icon?.trim() || null,
      color: data.color?.trim() || null,
      isPublic: data.isPublic ?? true,
      order: newOrder,
    },
  });

  if (!data.isPublic && data.invitedFriendIds && data.invitedFriendIds.length > 0) {
    const messages = data.invitedFriendIds.map(id => ({
      senderId: user.id!,
      receiverId: id,
      content: `invited you to sector collaboration`,
      type: "COLLAB_INVITE",
      metadata: JSON.stringify({ sectorId: sector.id, sectorName: sector.name })
    }));
    await db.chatMessage.createMany({ data: messages });

    await Promise.all(data.invitedFriendIds.map(id =>
      pusherServer.trigger(`private-user-${id}`, 'new-notification', {
        type: 'NEW_COLLAB_INVITE',
        data: { sectorName: sector.name, senderName: user.name }
      })
    ));
  }

  revalidatePath("/station");
  return { data: sector };
}

/** Update Sektor yang sudah ada */
export async function updateSector(
  sectorId: string,
  data: Partial<SectorFormData>
) {
  const user = await requireAuth();

  // Pastikan sector milik user yang bersangkutan
  const sector = await db.sector.findFirst({
    where: { id: sectorId, station: { userId: user.id } },
  });
  if (!sector) {
    return { error: "Sector not found or access denied" };
  }

  const updated = await db.sector.update({
    where: { id: sectorId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.icon !== undefined && { icon: data.icon.trim() || null }),
      ...(data.color !== undefined && { color: data.color.trim() || null }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
    },
  });

  if (!updated.isPublic && data.invitedFriendIds && data.invitedFriendIds.length > 0) {
    const messages = data.invitedFriendIds.map(id => ({
      senderId: user.id!,
      receiverId: id,
      content: `invited you to sector collaboration`,
      type: "COLLAB_INVITE",
      metadata: JSON.stringify({ sectorId: updated.id, sectorName: updated.name })
    }));
    await db.chatMessage.createMany({ data: messages });

    await Promise.all(data.invitedFriendIds.map(id =>
      pusherServer.trigger(`private-user-${id}`, 'new-notification', {
        type: 'NEW_COLLAB_INVITE',
        data: { sectorName: updated.name, senderName: user.name }
      })
    ));
  }

  revalidatePath("/station");
  return { data: updated };
}

export async function acceptCollab(messageId: string, sectorId: string) {
  const user = await requireAuth();

  const msg = await db.chatMessage.findUnique({ where: { id: messageId } });
  if (!msg) return { error: "Message not found" };

  try {
    await db.sectorCollaborator.create({
      data: {
        userId: user.id!,
        sectorId: sectorId
      }
    });

    await db.chatMessage.update({
      where: { id: messageId },
      data: { type: "COLLAB_ACCEPTED", content: "accepted the sector collaboration" }
    });

    const sysMsg = await db.groupMessage.create({
      data: { sectorId, senderId: user.id, content: `joined the sector`, type: "SYSTEM" },
      include: { sender: { select: { id: true, name: true, username: true, image: true, titleBadge: true } } }
    });
    const pusherPayload = {
      ...sysMsg,
      sender: { ...sysMsg.sender, image: null }
    };
    await pusherServer.trigger(`presence-sector-${sectorId}`, 'new-message', pusherPayload);
  } catch (e) {
    // If they already joined, just update the message
    await db.chatMessage.update({
      where: { id: messageId },
      data: { type: "COLLAB_ACCEPTED", content: "accepted the sector collaboration" }
    });
  }

  if (msg.senderId) {
    await pusherServer.trigger(`private-user-${msg.senderId}`, 'new-notification', {
      type: 'TOAST',
      message: `${user.name || (user as any).username} accepted your collaboration invite!`
    });
  }

  revalidatePath("/station");
  return { success: true };
}

export async function rejectCollab(messageId: string) {
  const user = await requireAuth();

  const msg = await db.chatMessage.findUnique({ where: { id: messageId } });
  if (!msg) return { error: "Message not found" };

  await db.chatMessage.update({
    where: { id: messageId },
    data: { type: "COLLAB_REJECTED", content: "rejected the sector collaboration" }
  });

  if (msg.senderId) {
    await pusherServer.trigger(`private-user-${msg.senderId}`, 'new-notification', {
      type: 'TOAST',
      message: `${user.name || (user as any).username} declined your collaboration invite.`
    });
  }

  revalidatePath("/station");
  return { success: true };
}

export async function removeCollaborator(sectorId: string, userIdToRemove: string) {
  const user = await requireAuth();
  const sector = await db.sector.findFirst({
    where: { id: sectorId, station: { userId: user.id } }
  });
  if (!sector) return { error: "Access denied" };

  await db.sectorCollaborator.deleteMany({
    where: { sectorId, userId: userIdToRemove }
  });
  revalidatePath("/station");
  return { success: true };
}

export async function sendTransferOwnershipInvite(sectorId: string, newOwnerId: string) {
  const user = await requireAuth();
  const sector = await db.sector.findFirst({
    where: { id: sectorId, station: { userId: user.id } }
  });
  if (!sector) return { error: "Access denied" };

  const msg = await db.chatMessage.create({
    data: {
      senderId: user.id!,
      receiverId: newOwnerId,
      content: `wants to transfer ownership of sector`,
      type: "OWNERSHIP_TRANSFER_INVITE",
      metadata: JSON.stringify({ sectorId, sectorName: sector.name })
    }
  });

  await pusherServer.trigger(`private-user-${newOwnerId}`, 'new-notification', {
    type: 'NEW_PRIVATE_MESSAGE',
    data: {
      messageId: msg.id,
      content: `Wants to transfer ownership of Sector "${sector.name}"`,
      senderId: user.id,
      senderName: user.name || "System",
      timestamp: msg.createdAt.toISOString()
    }
  });

  revalidatePath("/station");
  return { success: true };
}

export async function acceptTransferOwnership(messageId: string) {
  const user = await requireAuth();
  const message = await db.chatMessage.findUnique({ where: { id: messageId } });
  if (!message || message.receiverId !== user.id) return { error: "Message not found" };

  const meta = JSON.parse(message.metadata || "{}");
  const sectorId = meta.sectorId;
  if (!sectorId) return { error: "Invalid metadata" };

  const sector = await db.sector.findUnique({
    where: { id: sectorId },
    include: { station: true }
  });
  if (!sector) return { error: "Sector not found" };

  const previousOwnerId = sector.station.userId;

  // Get the new owner's station
  const targetStation = await db.station.findUnique({
    where: { userId: user.id }
  });
  if (!targetStation) return { error: "Your station not found" };

  // Make the previous owner a collaborator
  await db.sectorCollaborator.create({
    data: { sectorId, userId: previousOwnerId }
  });

  // Remove the new owner from collaborators
  await db.sectorCollaborator.deleteMany({
    where: { sectorId, userId: user.id }
  });

  // Transfer the sector to the new owner's station
  await db.sector.update({
    where: { id: sectorId },
    data: { stationId: targetStation.id }
  });

  await db.chatMessage.update({
    where: { id: messageId },
    data: { type: "OWNERSHIP_TRANSFER_ACCEPTED", content: "accepted the ownership transfer" }
  });

  if (message.senderId) {
    await pusherServer.trigger(`private-user-${message.senderId}`, 'new-notification', {
      type: 'TOAST',
      message: `${user.name || (user as any).username} accepted ownership of sector "${sector.name}"!`
    });
  }

  revalidatePath("/station");
  return { success: true };
}

export async function rejectTransferOwnership(messageId: string) {
  const user = await requireAuth();
  const message = await db.chatMessage.findUnique({ where: { id: messageId } });
  if (!message || message.receiverId !== user.id) return { error: "Message not found" };

  await db.chatMessage.update({
    where: { id: messageId },
    data: { type: "OWNERSHIP_TRANSFER_REJECTED", content: "rejected the ownership transfer" }
  });

  const meta = JSON.parse(message.metadata || "{}");
  if (message.senderId) {
    await pusherServer.trigger(`private-user-${message.senderId}`, 'new-notification', {
      type: 'TOAST',
      message: `${user.name || (user as any).username} declined ownership of sector "${meta.sectorName || ''}".`
    });
  }

  revalidatePath("/station");
  return { success: true };
}

export async function hasCollabInvites(sectorId: string) {
  const user = await requireAuth();
  // Check if there are any pending COLLAB_INVITE messages for this sector
  const count = await db.chatMessage.count({
    where: {
      type: "COLLAB_INVITE",
      metadata: {
        contains: `"sectorId":"${sectorId}"`
      }
    }
  });
  return count > 0;
}

export async function getPendingCollabInvites(sectorId: string) {
  const user = await requireAuth();
  const messages = await db.chatMessage.findMany({
    where: {
      type: "COLLAB_INVITE",
      metadata: {
        contains: `"sectorId":"${sectorId}"`
      }
    },
    include: { receiver: true }
  });
  // deduplicate by receiverId
  const uniqueUsers = Array.from(new Map(messages.map(m => [m.receiverId, m.receiver])).values());
  return uniqueUsers;
}

export async function getSectorOwner(sectorId: string) {
  const sector = await db.sector.findUnique({
    where: { id: sectorId },
    include: { station: { include: { user: true } } }
  });
  if (!sector?.station?.user) return null;
  return {
    ...sector.station.user,
    isPublic: sector.station.isPublic
  };
}

/** Hapus Sektor beserta semua Beacon di dalamnya */
export async function deleteSector(sectorId: string, moveToSectorId?: string) {
  const user = await requireAuth();

  const sector = await db.sector.findFirst({
    where: { id: sectorId, station: { userId: user.id } },
    include: { _count: { select: { beacons: true } } }
  });
  if (!sector) {
    return { error: "Sector not found or access denied" };
  }

  if (moveToSectorId && sector._count.beacons > 0) {
    const targetSector = await db.sector.findFirst({
      where: { id: moveToSectorId, station: { userId: user.id } }
    });
    if (!targetSector) return { error: "Target sector not found" };

    await db.beacon.updateMany({
      where: { sectorId },
      data: { sectorId: moveToSectorId }
    });
  }

  await db.sector.delete({ where: { id: sectorId } });

  revalidatePath("/station");
  return { success: true };
}

/** Update urutan (order) semua Sector dalam satu Station */
export async function reorderSectors(
  sectorIds: string[]  // urutan baru, index = order baru
) {
  const user = await requireAuth();
  const station = await requireStation(user.id!);

  // Validasi bahwa semua sector milik station ini
  const sectors = await db.sector.findMany({
    where: { stationId: station.id },
    select: { id: true },
  });
  const ownedIds = new Set(sectors.map((s: { id: string }) => s.id));
  if (!sectorIds.every((id) => ownedIds.has(id))) {
    return { error: "Invalid sector IDs" };
  }

  await Promise.all(
    sectorIds.map((id, index) =>
      db.sector.update({ where: { id }, data: { order: index } })
    )
  );

  revalidatePath("/station");
  return { success: true };
}

// ============================================================
// BEACON ACTIONS
// ============================================================

export type BeaconFormData = {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  faviconUrl?: string;
  notes?: string;
  isPinned?: boolean;
  sectorId?: string;
};

/** Tambah Suar (Beacon) baru ke dalam sebuah Sektor */
export async function createBeacon(sectorId: string, data: BeaconFormData) {
  const user = await requireAuth();

  // Validasi sektor milik user DAN cek role kolaborator
  const sector = await db.sector.findUnique({
    where: { id: sectorId },
    include: { station: true, collaborators: true }
  });

  if (!sector) return { error: "Sector not found" };

  const isOwner = sector.station.userId === user.id;
  const isAdmin = sector.collaborators.some((c: any) => c.userId === user.id && c.role === "ADMIN");

  if (!isOwner && !isAdmin) {
    return { error: "Access Denied: Only Admins or Owner can modify beacons." };
  }

  if (!data.url?.trim()) return { error: "URL is required" };
  if (!data.title?.trim()) return { error: "Title is required" };

  // Validasi URL
  try {
    const parsedUrl = new URL(data.url.trim());
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { error: "URL must start with http:// or https://" };
    }
  } catch {
    return { error: "Invalid URL format" };
  }

  const lastBeacon = await db.beacon.findFirst({
    where: { sectorId },
    orderBy: { order: "desc" },
  });
  const newOrder = (lastBeacon?.order ?? -1) + 1;

  const beacon = await db.beacon.create({
    data: {
      sectorId,
      url: data.url.trim(),
      title: data.title.trim(),
      description: data.description?.trim() || null,
      imageUrl: data.imageUrl?.trim() || null,
      faviconUrl: data.faviconUrl?.trim() || null,
      notes: data.notes?.trim() || null,
      isPinned: data.isPinned ?? false,
      order: newOrder,
      creatorId: user.id
    },
    include: { creator: { select: { name: true, image: true } } }
  });

  const userIdsToNotify = new Set([sector.station.userId, ...sector.collaborators.map((c: any) => c.userId)]);
  userIdsToNotify.delete(user.id); // Jangan kirim ke diri sendiri

  if (userIdsToNotify.size > 0) {
    const safeBeacon = {
      ...beacon,
      imageUrl: beacon.imageUrl && beacon.imageUrl.length > 2000 ? null : beacon.imageUrl,
      faviconUrl: beacon.faviconUrl && beacon.faviconUrl.length > 2000 ? null : beacon.faviconUrl,
      description: beacon.description && beacon.description.length > 500 ? beacon.description.substring(0, 500) + '...' : beacon.description,
      notes: beacon.notes && beacon.notes.length > 500 ? beacon.notes.substring(0, 500) + '...' : beacon.notes,
    };

    if (safeBeacon.creator?.image && safeBeacon.creator.image.length > 2000) {
      safeBeacon.creator = { ...safeBeacon.creator, image: null };
    }

    await Promise.all(Array.from(userIdsToNotify).map(id =>
      pusherServer.trigger(`private-user-${id}`, 'beacon-update', { type: 'BEACON_CREATED', data: safeBeacon })
    ));
  }
  // -----------------------------------

  revalidatePath("/station");
  return { data: beacon };
}

/** Update Suar yang sudah ada */
export async function updateBeacon(
  beaconId: string,
  data: Partial<BeaconFormData>
) {
  const user = await requireAuth();

  const beacon = await db.beacon.findUnique({
    where: { id: beaconId },
    include: {
      sector: {
        include: { station: true, collaborators: true }
      }
    }
  });

  if (!beacon) return { error: "Beacon not found" };

  const isOwner = beacon.sector.station.userId === user.id;
  const isAdmin = beacon.sector.collaborators.some((c: any) => c.userId === user.id && c.role === "ADMIN");

  if (!isOwner && !isAdmin) {
    return { error: "Access Denied: Only Admins or Owner can modify beacons." };
  }

  if (data.url !== undefined) {
    try {
      const parsedUrl = new URL(data.url.trim());
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return { error: "URL must start with http:// or https://" };
      }
    } catch {
      return { error: "Invalid URL format" };
    }
  }

  const updated = await db.beacon.update({
    where: { id: beaconId },
    data: {
      ...(data.url !== undefined && { url: data.url.trim() }),
      ...(data.title !== undefined && { title: data.title.trim() }),
      ...(data.description !== undefined && {
        description: data.description.trim() || null,
      }),
      ...(data.imageUrl !== undefined && {
        imageUrl: data.imageUrl.trim() || null,
      }),
      ...(data.faviconUrl !== undefined && {
        faviconUrl: data.faviconUrl.trim() || null,
      }),
      ...(data.notes !== undefined && { notes: data.notes.trim() || null }),
      ...(data.isPinned !== undefined && { isPinned: data.isPinned }),
      ...(data.sectorId !== undefined && { sectorId: data.sectorId }),
    },
    include: { creator: { select: { name: true, image: true } } }
  });

  const userIdsToNotify = new Set([beacon.sector.station.userId, ...beacon.sector.collaborators.map((c: any) => c.userId)]);
  userIdsToNotify.delete(user.id);

  if (userIdsToNotify.size > 0) {
    const safeUpdated = {
      ...updated,
      imageUrl: updated.imageUrl && updated.imageUrl.length > 2000 ? null : updated.imageUrl,
      faviconUrl: updated.faviconUrl && updated.faviconUrl.length > 2000 ? null : updated.faviconUrl,
      description: updated.description && updated.description.length > 500 ? updated.description.substring(0, 500) + '...' : updated.description,
      notes: updated.notes && updated.notes.length > 500 ? updated.notes.substring(0, 500) + '...' : updated.notes,
    };

    if (safeUpdated.creator?.image && safeUpdated.creator.image.length > 2000) {
      safeUpdated.creator = { ...safeUpdated.creator, image: null };
    }

    await Promise.all(Array.from(userIdsToNotify).map(id =>
      pusherServer.trigger(`private-user-${id}`, 'beacon-update', { type: 'BEACON_UPDATED', data: safeUpdated })
    ));
  }

  revalidatePath("/station");
  return { data: updated };
}

/** Hapus sebuah Suar */
export async function deleteBeacon(beaconId: string) {
  const user = await requireAuth();

  const beacon = await db.beacon.findUnique({
    where: { id: beaconId },
    include: {
      sector: {
        include: { station: true, collaborators: true }
      }
    }
  });

  if (!beacon) return { error: "Beacon not found" };

  const isOwner = beacon.sector.station.userId === user.id;
  const isAdmin = beacon.sector.collaborators.some((c: any) => c.userId === user.id && c.role === "ADMIN");

  if (!isOwner && !isAdmin) {
    return { error: "Access Denied: Only Admins or Owner can modify beacons." };
  }

  await db.beacon.delete({ where: { id: beaconId } });

  const userIdsToNotify = new Set([beacon.sector.station.userId, ...beacon.sector.collaborators.map((c: any) => c.userId)]);
  userIdsToNotify.delete(user.id);
  if (userIdsToNotify.size > 0) {
    await Promise.all(Array.from(userIdsToNotify).map(id =>
      pusherServer.trigger(`private-user-${id}`, 'beacon-update', { type: 'BEACON_DELETED', data: { id: beaconId } })
    ));
  }

  revalidatePath("/station");
  return { success: true };
}

/** Tambah visit count ketika Beacon dikunjungi */
export async function incrementBeaconVisit(beaconId: string) {
  // Tidak perlu auth check — ini "public" action untuk track kunjungan
  await db.beacon.update({
    where: { id: beaconId },
    data: { visits: { increment: 1 } },
  });
  return { success: true };
}

/** Toggle isPinned pada sebuah Beacon */
export async function toggleBeaconPin(beaconId: string) {
  const user = await requireAuth();

  const beacon = await db.beacon.findFirst({
    where: {
      id: beaconId,
      sector: {
        OR: [
          { station: { userId: user.id } },
          { collaborators: { some: { userId: user.id } } }
        ]
      }
    },
  });
  if (!beacon) {
    return { error: "Beacon not found or access denied" };
  }

  if (!beacon.isPinned) {
    const pinnedCount = await db.beacon.count({
      where: { sectorId: beacon.sectorId, isPinned: true },
    });
    if (pinnedCount >= 10) {
      return { error: "Maximum 10 pinned beacons per sector allowed." };
    }
  }

  const updated = await db.beacon.update({
    where: { id: beaconId },
    data: { isPinned: !beacon.isPinned },
    include: { creator: { select: { name: true, image: true } } }
  });

  revalidatePath("/station");
  return { data: updated };
}
/** Update urutan Beacon dalam satu Sektor */
export async function reorderBeacons(
  sectorId: string,
  beaconIds: string[]
) {
  const user = await requireAuth();

  // Validasi sektor milik user atau kolaborator
  const sector = await db.sector.findFirst({
    where: {
      id: sectorId,
      OR: [
        { station: { userId: user.id } },
        { collaborators: { some: { userId: user.id } } }
      ]
    },
    include: { beacons: { select: { id: true } } },
  });
  if (!sector) {
    return { error: "Sector not found or access denied" };
  }

  const ownedIds = new Set(sector.beacons.map((b: { id: string }) => b.id));
  if (!beaconIds.every((id) => ownedIds.has(id))) {
    return { error: "Invalid beacon IDs" };
  }

  await Promise.all(
    beaconIds.map((id, index) =>
      db.beacon.update({ where: { id }, data: { order: index } })
    )
  );

  revalidatePath("/station");
  return { success: true };
}

// ============================================================
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
// GROUP CHAT ACTIONS
// ============================================================

export async function getGroupMessages(sectorId: string) {
  const user = await requireAuth();

  // Validate member
  const sector = await db.sector.findUnique({
    where: { id: sectorId },
    include: { station: true, collaborators: true }
  });

  if (!sector) return { messages: [], pinnedMessageId: null };

  const isOwner = sector.station.userId === user.id;
  const isCollab = sector.collaborators.some(c => c.userId === user.id);
  if (!isOwner && !isCollab) return { messages: [], pinnedMessageId: null };

  // Ambil 100 pesan TERBARU dengan descending
  const messages = await db.groupMessage.findMany({
    where: { sectorId },
    include: {
      sender: {
        select: { id: true, name: true, username: true, image: true, callsign: true, titleBadge: true }
      },
      replyTo: {
        select: { id: true, content: true, senderId: true, sender: { select: { name: true, username: true } }, isDeleted: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return { messages: messages.reverse(), pinnedMessageId: sector.pinnedMessageId };
}

export async function sendGroupMessage(sectorId: string, content: string, replyToId?: string) {
  const user = await requireAuth();

  const sector = await db.sector.findUnique({
    where: { id: sectorId },
    include: {
      station: { include: { user: true } },
      collaborators: { include: { user: true } }
    }
  });
  if (!sector) return { error: "Sector not found" };

  const isOwner = sector.station.userId === user.id;
  const isCollab = sector.collaborators.some(c => c.userId === user.id);
  if (!isOwner && !isCollab) return { error: "Not a member" };

  const muted = await db.mutedMember.findUnique({
    where: { sectorId_userId: { sectorId, userId: user.id } }
  });
  if (muted) return { error: "You are muted in this sector" };

  const msg = await db.groupMessage.create({
    data: {
      sectorId,
      senderId: user.id,
      content,
      replyToId: replyToId || null
    },
    include: {
      sender: { select: { id: true, name: true, username: true, image: true, titleBadge: true } },
      replyTo: { include: { sender: { select: { name: true, username: true, titleBadge: true } } } }
    }
  });

  const pusherPayload = {
    ...msg,
    sender: { ...msg.sender, image: null }
  };
  await pusherServer.trigger(`presence-sector-${sectorId}`, 'new-message', pusherPayload);

  const membersMap = new Map<string, string>();
  if (sector.station.user) {
    membersMap.set(sector.station.userId, sector.station.user.username || "");
  }
  sector.collaborators.forEach(c => {
    membersMap.set(c.userId, c.user.username || "");
  });

  membersMap.delete(user.id!);

  if (membersMap.size > 0) {
    await Promise.all(
      Array.from(membersMap.entries()).map(([memberId, memberUsername]) => {
        const isMentioned = content.toLowerCase().includes(`@${memberUsername.toLowerCase()}`) || content.toLowerCase().includes('@all');

        return pusherServer.trigger(`private-user-${memberId}`, 'new-notification', {
          type: 'NEW_GROUP_MESSAGE',
          data: {
            messageId: msg.id,
            sectorId: sector.id,
            sectorName: sector.name,
            content: msg.content,
            senderName: user.name || "Pilot",
            timestamp: msg.createdAt.toISOString(),
            isMention: isMentioned
          }
        });
      })
    );
  }

  return { data: msg };
}

export async function editGroupMessage(messageId: string, content: string) {
  const user = await requireAuth();

  const msg = await db.groupMessage.findUnique({ where: { id: messageId } });
  if (!msg || msg.senderId !== user.id) return { error: "Not authorized" };
  if (msg.isDeleted) return { error: "Cannot edit deleted message" };

  const updated = await db.groupMessage.update({
    where: { id: messageId },
    data: { content, editedAt: new Date() },
    include: {
      sender: { select: { id: true, name: true, username: true, image: true } },
      replyTo: { include: { sender: { select: { name: true, username: true } } } }
    }
  });

  const pusherPayload = {
    ...updated,
    sender: { ...updated.sender, image: null }
  };
  await pusherServer.trigger(`presence-sector-${msg.sectorId}`, 'update-message', pusherPayload);

  return { success: true };
}

export async function deleteGroupMessage(messageId: string) {
  const user = await requireAuth();

  const msg = await db.groupMessage.findUnique({
    where: { id: messageId },
    include: { sector: { include: { station: true } } }
  });

  if (!msg) return { error: "Not found" };

  const isOwner = msg.sector.station.userId === user.id;
  if (msg.senderId !== user.id && !isOwner) {
    return { error: "Not authorized to delete" };
  }

  const deletedMsg = await db.groupMessage.update({
    where: { id: messageId },
    data: {
      isDeleted: true,
      deletedBy: user.id,
      content: ""
    },
    include: {
      sender: { select: { id: true, name: true, username: true, image: true } },
      replyTo: { include: { sender: { select: { name: true, username: true } } } }
    }
  });

  const pusherPayload = {
    ...deletedMsg,
    sender: { ...deletedMsg.sender, image: null }
  };
  await pusherServer.trigger(`presence-sector-${msg.sectorId}`, 'update-message', pusherPayload);

  return { success: true };
}

export async function muteMember(sectorId: string, targetUserId: string) {
  const user = await requireAuth();
  const sector = await db.sector.findUnique({ where: { id: sectorId }, include: { station: true } });
  if (!sector || sector.station.userId !== user.id) return { error: "Only owner can mute" };

  if (targetUserId === "all") {
    await db.sector.update({ where: { id: sectorId }, data: { isMuteAll: true } });
    await db.mutedMember.deleteMany({ where: { sectorId } }); // Hapus semua pengecualian

    const sysMsg = await db.groupMessage.create({ data: { sectorId, senderId: user.id, content: `muted everyone in the sector`, type: "SYSTEM" }, include: { sender: { select: { id: true, name: true, username: true, image: true } } } });
    const sysPayload = { ...sysMsg, sender: { ...sysMsg.sender, image: null } };

    await pusherServer.trigger(`presence-sector-${sectorId}`, 'sector-update', { isMuteAll: true, clearMuted: true });
    await pusherServer.trigger(`presence-sector-${sectorId}`, 'new-message', sysPayload);
    return { success: true };
  }

  if (user.id === targetUserId) return { error: "Cannot mute yourself" };

  if (sector.isMuteAll) {
    // Cabut Pengecualian (Kembali Mute saat Mute All)
    await db.mutedMember.deleteMany({ where: { sectorId: sectorId, userId: targetUserId } });
  } else {
    // Mute Normal
    await db.mutedMember.upsert({ where: { sectorId_userId: { sectorId, userId: targetUserId } }, update: {}, create: { sectorId, userId: targetUserId } });
  }
  const targetUser = await db.user.findUnique({ where: { id: targetUserId }, select: { username: true } });
  const sysMsg = await db.groupMessage.create({ data: { sectorId, senderId: user.id, content: `muted @${targetUser?.username}`, type: "SYSTEM" }, include: { sender: { select: { id: true, name: true, username: true, image: true } } } });

  const sysPayload = { ...sysMsg, sender: { ...sysMsg.sender, image: null } };
  await pusherServer.trigger(`presence-sector-${sectorId}`, 'sector-update', { mutedUser: targetUserId, isMuteAll: sector.isMuteAll });
  await pusherServer.trigger(`presence-sector-${sectorId}`, 'new-message', sysPayload);
  return { success: true };
}

export async function unmuteMember(sectorId: string, targetUserId: string) {
  const user = await requireAuth();
  const sector = await db.sector.findUnique({ where: { id: sectorId }, include: { station: true } });
  if (!sector || sector.station.userId !== user.id) return { error: "Only owner can unmute" };

  if (targetUserId === "all") {
    await db.sector.update({ where: { id: sectorId }, data: { isMuteAll: false } });
    await db.mutedMember.deleteMany({ where: { sectorId } }); // Hapus semua mute tunggal

    const sysMsg = await db.groupMessage.create({ data: { sectorId, senderId: user.id, content: `unmuted everyone in the sector`, type: "SYSTEM" }, include: { sender: { select: { id: true, name: true, username: true, image: true } } } });
    const sysPayload = { ...sysMsg, sender: { ...sysMsg.sender, image: null } };

    await pusherServer.trigger(`presence-sector-${sectorId}`, 'sector-update', { isMuteAll: false, clearMuted: true });
    await pusherServer.trigger(`presence-sector-${sectorId}`, 'new-message', sysPayload);
    return { success: true };
  }

  if (sector.isMuteAll) {
    // Berikan Pengecualian (Unmute) saat Mute All aktif
    await db.mutedMember.upsert({ where: { sectorId_userId: { sectorId, userId: targetUserId } }, update: {}, create: { sectorId, userId: targetUserId } });
  } else {
    // Unmute Normal
    await db.mutedMember.deleteMany({ where: { sectorId: sectorId, userId: targetUserId } });
  }

  const targetUser = await db.user.findUnique({ where: { id: targetUserId }, select: { username: true } });
  const sysMsg = await db.groupMessage.create({ data: { sectorId, senderId: user.id, content: `unmuted @${targetUser?.username}`, type: "SYSTEM" }, include: { sender: { select: { id: true, name: true, username: true, image: true } } } });

  const sysPayload = { ...sysMsg, sender: { ...sysMsg.sender, image: null } };
  await pusherServer.trigger(`presence-sector-${sectorId}`, 'sector-update', { unmutedUser: targetUserId, isMuteAll: sector.isMuteAll });
  await pusherServer.trigger(`presence-sector-${sectorId}`, 'new-message', sysPayload);
  return { success: true };
}

export async function setCollabRole(sectorId: string, targetUserId: string, role: string) {
  const user = await requireAuth();
  const sector = await db.sector.findUnique({ where: { id: sectorId }, include: { station: true } });
  if (!sector || sector.station.userId !== user.id) return { error: "Only owner can change roles" };

  await db.sectorCollaborator.update({ where: { sectorId_userId: { sectorId, userId: targetUserId } }, data: { role } });

  const targetUser = await db.user.findUnique({ where: { id: targetUserId }, select: { username: true } });
  const contentMsg = role === "ADMIN" ? `promoted @${targetUser?.username} to Admin` : `demoted @${targetUser?.username} to Member`;
  const sysMsg = await db.groupMessage.create({ data: { sectorId, senderId: user.id, content: contentMsg, type: "SYSTEM" }, include: { sender: { select: { id: true, name: true, username: true, image: true } } } });

  const sysPayload = { ...sysMsg, sender: { ...sysMsg.sender, image: null } };
  await pusherServer.trigger(`presence-sector-${sectorId}`, 'new-message', sysPayload);
  await pusherServer.trigger(`presence-sector-${sectorId}`, 'sector-update', { roleChanged: { userId: targetUserId, role } });
  await pusherServer.trigger(`private-user-${targetUserId}`, 'role-updated', { sectorId, sectorName: sector.name, role });

  return { success: true };
}

export async function blindMember(sectorId: string, targetUserId: string) {
  const user = await requireAuth();
  const sector = await db.sector.findUnique({ where: { id: sectorId }, include: { station: true } });
  if (!sector || sector.station.userId !== user.id) return { error: "Only owner can blind" };

  await db.blindedMember.upsert({
    where: { sectorId_userId: { sectorId, userId: targetUserId } },
    update: {}, create: { sectorId, userId: targetUserId }
  });

  const targetUser = await db.user.findUnique({ where: { id: targetUserId }, select: { username: true } });
  const sysMsg = await db.groupMessage.create({
    data: { sectorId, senderId: user.id, content: `blinded @${targetUser?.username}`, type: "SYSTEM" },
    include: { sender: { select: { id: true, name: true, username: true, image: true } } }
  });

  const sysPayload = { ...sysMsg, sender: { ...sysMsg.sender, image: null } };
  await pusherServer.trigger(`presence-sector-${sectorId}`, 'new-message', sysPayload);
  await pusherServer.trigger(`presence-sector-${sectorId}`, 'blind-update', { userId: targetUserId, isBlinded: true });
  return { success: true };
}

export async function sightMember(sectorId: string, targetUserId: string) {
  const user = await requireAuth();
  const sector = await db.sector.findUnique({ where: { id: sectorId }, include: { station: true } });
  if (!sector || sector.station.userId !== user.id) return { error: "Only owner can restore sight" };

  await db.blindedMember.deleteMany({ where: { sectorId, userId: targetUserId } });
  const targetUser = await db.user.findUnique({ where: { id: targetUserId }, select: { username: true } });
  const sysMsg = await db.groupMessage.create({
    data: { sectorId, senderId: user.id, content: `restored sight to @${targetUser?.username}`, type: "SYSTEM" },
    include: { sender: { select: { id: true, name: true, username: true, image: true } } }
  });

  const sysPayload = { ...sysMsg, sender: { ...sysMsg.sender, image: null } };
  await pusherServer.trigger(`presence-sector-${sectorId}`, 'new-message', sysPayload);
  await pusherServer.trigger(`presence-sector-${sectorId}`, 'blind-update', { userId: targetUserId, isBlinded: false });
  return { success: true };
}

export async function getBlindedMembers(sectorId: string) {
  const blinded = await db.blindedMember.findMany({ where: { sectorId }, select: { userId: true } });
  return blinded.map((m: any) => m.userId);
}

export async function getMutedMembers(sectorId: string) {
  const muted = await db.mutedMember.findMany({
    where: { sectorId },
    select: { userId: true }
  });
  return muted.map(m => m.userId);
}

export async function clearGroupChat(sectorId: string) {
  const user = await requireAuth();

  const sector = await db.sector.findUnique({
    where: { id: sectorId },
    include: { station: true }
  });
  if (!sector || sector.station.userId !== user.id) return { error: "Only owner can clear chat" };

  await db.groupMessage.deleteMany({
    where: { sectorId }
  });

  const sysMsg = await db.groupMessage.create({
    data: {
      sectorId, senderId: user.id, content: `cleared the chat history`, type: "SYSTEM"
    },
    include: {
      sender: { select: { id: true, name: true, username: true, image: true } },
      replyTo: { include: { sender: { select: { name: true, username: true } } } }
    }
  });

  const pusherPayload = {
    ...sysMsg,
    sender: { ...sysMsg.sender, image: null }
  };
  await pusherServer.trigger(`presence-sector-${sectorId}`, 'clear-messages', {});
  await pusherServer.trigger(`presence-sector-${sectorId}`, 'new-message', pusherPayload);

  return { success: true };
}

export async function kickMember(sectorId: string, targetUserId: string) {
  const user = await requireAuth();

  const sector = await db.sector.findUnique({
    where: { id: sectorId },
    include: { station: true }
  });
  if (!sector || sector.station.userId !== user.id) return { error: "Only owner can kick members" };

  try {
    await db.sectorCollaborator.delete({
      where: { sectorId_userId: { sectorId, userId: targetUserId } }
    });
    // System message
    const targetUser = await db.user.findUnique({ where: { id: targetUserId }, select: { username: true } });
    const sysMsg = await db.groupMessage.create({
      data: { sectorId, senderId: user.id, content: `kicked @${targetUser?.username}`, type: "SYSTEM" },
      include: {
        sender: { select: { id: true, name: true, username: true, image: true } },
        replyTo: { include: { sender: { select: { name: true, username: true } } } }
      }
    });
    const pusherPayload = {
      ...sysMsg,
      sender: { ...sysMsg.sender, image: null }
    };
    await pusherServer.trigger(`presence-sector-${sectorId}`, 'new-message', pusherPayload);
  } catch (e) {
    // Member might not exist
  }

  return { success: true };
}

export async function updateTypingStatus(sectorId: string | null, chatWithId: string | null) {
  const user = await requireAuth();

  if (sectorId) {
    const existing = await db.typingIndicator.findFirst({
      where: { sectorId, userId: user.id }
    });
    if (existing) {
      await db.typingIndicator.update({ where: { id: existing.id }, data: { updatedAt: new Date() } });
    } else {
      await db.typingIndicator.create({ data: { sectorId, userId: user.id } });
    }
  } else if (chatWithId) {
    const existing = await db.typingIndicator.findFirst({
      where: { chatWithId, userId: user.id }
    });
    if (existing) {
      await db.typingIndicator.update({ where: { id: existing.id }, data: { updatedAt: new Date() } });
    } else {
      await db.typingIndicator.create({ data: { chatWithId, userId: user.id } });
    }
  }
}

export async function getTypingUsers(sectorId: string | null, chatWithId: string | null) {
  const user = await requireAuth();
  const fiveSecondsAgo = new Date(Date.now() - 5000);

  if (sectorId) {
    const indicators = await db.typingIndicator.findMany({
      where: { sectorId, updatedAt: { gt: fiveSecondsAgo }, userId: { not: user.id } },
      include: { user: { select: { id: true, name: true, username: true } } }
    });
    return indicators.map(i => i.user);
  } else if (chatWithId) {
    const indicator = await db.typingIndicator.findFirst({
      where: { chatWithId: user.id, userId: chatWithId },
      include: { user: { select: { id: true, name: true, username: true } } }
    });
    if (indicator && indicator.updatedAt > fiveSecondsAgo) {
      return [indicator.user];
    }
  }
  return [];
}

export async function pinGroupMessageAction(sectorId: string, msgId: string) {
  const user = await requireAuth();

  // Verifikasi akses
  const sector = await db.sector.findUnique({
    where: { id: sectorId },
    include: { station: true, collaborators: true }
  });
  if (!sector) return { error: "Sector not found" };

  const isOwner = sector.station.userId === user.id;
  const isAdmin = sector.collaborators.some((c: any) => c.userId === user.id && c.role === "ADMIN");
  if (!isOwner && !isAdmin) return { error: "Access denied" };

  const msg = await db.groupMessage.findUnique({
    where: { id: msgId },
    include: { sender: { select: { name: true, username: true } } }
  });
  if (!msg) return { error: "Message not found" };

  // Simpan ke database
  await db.sector.update({
    where: { id: sectorId },
    data: { pinnedMessageId: msgId }
  });

  const sysMsg = await db.groupMessage.create({
    data: { sectorId, senderId: user.id, content: `pinned a message`, type: "SYSTEM" },
    include: { sender: { select: { id: true, name: true, username: true, image: true } } }
  });

  const sysPayload = {
    ...sysMsg,
    sender: { ...sysMsg.sender, image: null }
  };
  await pusherServer.trigger(`presence-sector-${sectorId}`, 'new-message', sysPayload);

  const pinPayload = {
    ...msg,
    sender: { ...msg.sender, image: null }
  };
  await pusherServer.trigger(`presence-sector-${sectorId}`, 'pinned-message', pinPayload);

  return { success: true };
}

export async function unpinGroupMessageAction(sectorId: string) {
  const user = await requireAuth();

  const sector = await db.sector.findUnique({
    where: { id: sectorId },
    include: { station: true, collaborators: true }
  });
  if (!sector) return { error: "Sector not found" };

  const isOwner = sector.station.userId === user.id;
  const isAdmin = sector.collaborators.some((c: any) => c.userId === user.id && c.role === "ADMIN");
  if (!isOwner && !isAdmin) return { error: "Access denied" };

  await db.sector.update({
    where: { id: sectorId },
    data: { pinnedMessageId: null }
  });

  const sysMsg = await db.groupMessage.create({
    data: { sectorId, senderId: user.id, content: `unpinned the message`, type: "SYSTEM" },
    include: { sender: { select: { id: true, name: true, username: true, image: true } } }
  });

  const sysPayload = {
    ...sysMsg,
    sender: { ...sysMsg.sender, image: null }
  };

  await pusherServer.trigger(`presence-sector-${sectorId}`, 'new-message', sysPayload);
  await pusherServer.trigger(`presence-sector-${sectorId}`, 'unpinned-message', {});

  return { success: true };
}

// ============================================================
// OAUTH APP ACTIONS (SSO Identity Provider)
// ============================================================

/** Generate URL-safe random string */
function generateSecret(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/** Ambil semua OAuth App milik user yang sedang login */
export async function getMyOAuthApps() {
  const user = await requireAuth();
  const apps = await db.oAuthApp.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      clientId: true,
      redirectUris: true,
      createdAt: true,
      // clientSecret TIDAK dikembalikan di sini karena ini adalah daftar (list)
    }
  });
  return apps;
}

/** Buat OAuth App baru, kembalikan clientSecret HANYA di response ini */
export async function createOAuthApp(name: string, redirectUris: string[]) {
  const user = await requireAuth();

  if (!name.trim()) return { error: "App name is required." };
  if (!redirectUris.length || !redirectUris[0].trim()) return { error: "At least one redirect URI is required." };

  // Validasi format URL setiap redirect URI
  for (const uri of redirectUris) {
    try {
      const parsed = new URL(uri.trim());
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return { error: `Redirect URI must use http or https: ${uri}` };
      }
    } catch {
      return { error: `Invalid redirect URI format: ${uri}` };
    }
  }

  const clientId = `orbit_${generateSecret(16)}`;
  const clientSecret = `secret_${generateSecret(40)}`;

  const app = await db.oAuthApp.create({
    data: {
      name: name.trim(),
      clientId,
      clientSecret,
      redirectUris: redirectUris.map(u => u.trim()).filter(Boolean),
      ownerId: user.id,
    }
  });

  revalidatePath("/settings");
  // Kembalikan secret HANYA satu kali saat baru dibuat
  return { data: { ...app, clientSecret } };
}

/** Hapus OAuth App */
export async function deleteOAuthApp(appId: string) {
  const user = await requireAuth();

  const app = await db.oAuthApp.findFirst({ where: { id: appId, ownerId: user.id } });
  if (!app) return { error: "App not found or access denied." };

  await db.oAuthApp.delete({ where: { id: appId } });

  revalidatePath("/settings");
  return { success: true };
}

/** Update nama dan redirect URIs sebuah app */
export async function updateOAuthApp(appId: string, name: string, redirectUris: string[]) {
  const user = await requireAuth();

  const app = await db.oAuthApp.findFirst({ where: { id: appId, ownerId: user.id } });
  if (!app) return { error: "App not found or access denied." };

  if (!name.trim()) return { error: "App name is required." };

  for (const uri of redirectUris) {
    try {
      const parsed = new URL(uri.trim());
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return { error: `Redirect URI must use http or https: ${uri}` };
      }
    } catch {
      return { error: `Invalid redirect URI format: ${uri}` };
    }
  }

  const updated = await db.oAuthApp.update({
    where: { id: appId },
    data: {
      name: name.trim(),
      redirectUris: redirectUris.map(u => u.trim()).filter(Boolean),
    }
  });

  revalidatePath("/settings");
  return { data: updated };
}


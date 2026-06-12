"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// ============================================================
// HELPER — ambil session + pastikan Station user sudah ada
// ============================================================

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user;
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
  }

  revalidatePath("/station");
  return { data: updated };
}

export async function acceptCollab(messageId: string, sectorId: string) {
  const user = await requireAuth();
  
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
  } catch (e) {
    // If they already joined, just update the message
    await db.chatMessage.update({
      where: { id: messageId },
      data: { type: "COLLAB_ACCEPTED", content: "accepted the sector collaboration" }
    });
  }

  revalidatePath("/station");
  return { success: true };
}

export async function rejectCollab(messageId: string) {
  await requireAuth();
  
  await db.chatMessage.update({
    where: { id: messageId },
    data: { type: "COLLAB_REJECTED", content: "rejected the sector collaboration" }
  });

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

  await db.chatMessage.create({
    data: {
      senderId: user.id,
      receiverId: newOwnerId,
      content: `wants to transfer ownership of sector`,
      type: "OWNERSHIP_TRANSFER_INVITE",
      metadata: JSON.stringify({ sectorId, sectorName: sector.name })
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

  // Validasi sektor milik user
  const sector = await db.sector.findFirst({
    where: { 
      id: sectorId, 
      OR: [
        { station: { userId: user.id } },
        { collaborators: { some: { userId: user.id } } }
      ]
    },
  });
  if (!sector) {
    return { error: "Sector not found or access denied" };
  }

  if (!data.url?.trim()) return { error: "URL is required" };
  if (!data.title?.trim()) return { error: "Title is required" };

  // Validasi URL
  try {
    new URL(data.url.trim());
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

  revalidatePath("/station");
  return { data: beacon };
}

/** Update Suar yang sudah ada */
export async function updateBeacon(
  beaconId: string,
  data: Partial<BeaconFormData>
) {
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

  revalidatePath("/station");
  return { data: updated };
}

/** Hapus sebuah Suar */
export async function deleteBeacon(beaconId: string) {
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

  await db.beacon.delete({ where: { id: beaconId } });

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
    
    // If REJECTED, we could update it back to PENDING. Let's do that.
    const updated = await db.friendship.update({
      where: { id: existing.id },
      data: { status: "PENDING", requesterId: user.id, receiverId }
    });
    return { data: updated };
  }

  const friendship = await db.friendship.create({
    data: { requesterId: user.id, receiverId, status: "PENDING" }
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
  return { data: updated };
}

export async function rejectFriendRequest(friendshipId: string) {
  const user = await requireAuth();
  
  const friendship = await db.friendship.findUnique({ where: { id: friendshipId } });
  if (!friendship || friendship.receiverId !== user.id) return { error: "Request not found" };

  await db.friendship.delete({ where: { id: friendshipId } });
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

  // Check friendship
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
      senderId: user.id,
      receiverId,
      content: content.trim()
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

  await db.friendship.delete({ where: { id: friendship.id } });
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

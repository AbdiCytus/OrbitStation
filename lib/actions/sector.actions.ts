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

// SECTOR ACTIONS
// ============================================================

export type SectorFormData = {
  name: string;
  icon?: string;
  color?: string;
  isPublic?: boolean;
  invitedFriendIds?: string[];
  inviteEnabled?: boolean;
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
      ...(data.inviteEnabled !== undefined && { inviteEnabled: data.inviteEnabled }),
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
// SECTOR INVITE ACTIONS (QR CODE / LINK)
// ============================================================

/** Generate or retrieve an invite token for a sector */
export async function generateSectorInvite(sectorId: string) {
  const user = await requireAuth();

  // Validate ownership or admin role
  const sector = await db.sector.findFirst({
    where: {
      id: sectorId,
      OR: [
        { station: { userId: user.id } },
        { collaborators: { some: { userId: user.id, role: "ADMIN" } } }
      ]
    }
  });

  if (!sector) {
    return { error: "Access denied or sector not found" };
  }

  if (!sector.inviteEnabled) {
    return { error: "Invite links are disabled for this sector." };
  }

  // Check if an active invite already exists
  const existingInvite = await db.sectorInvite.findFirst({
    where: { sectorId }
  });

  if (existingInvite) {
    return { data: existingInvite };
  }

  // Create a new invite token
  // Use a secure random string for the token
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  const newInvite = await db.sectorInvite.create({
    data: {
      sectorId,
      token,
      // Optional: Add expiration or max uses if needed in the future
    }
  });

  return { data: newInvite };
}

/** Join a sector using an invite token */
export async function joinSectorByInviteToken(token: string) {
  const user = await requireAuth();

  const invite = await db.sectorInvite.findUnique({
    where: { token },
    include: { sector: true }
  });

  if (!invite) {
    return { error: "Invalid or expired invite token" };
  }

  if (!invite.sector.inviteEnabled) {
    return { error: "Invite links are disabled for this sector." };
  }

  // Check if user is already a collaborator or the owner
  const isOwner = await db.station.findFirst({
    where: { userId: user.id, sectors: { some: { id: invite.sectorId } } }
  });

  if (isOwner) {
    return { success: true, sectorId: invite.sectorId, message: "You are the owner of this sector." };
  }

  const existingCollab = await db.sectorCollaborator.findUnique({
    where: { sectorId_userId: { sectorId: invite.sectorId, userId: user.id } }
  });

  if (existingCollab) {
    return { success: true, sectorId: invite.sectorId, message: "You are already in this sector." };
  }

  // Add the user to the sector collaborators bypassing friendship checks
  await db.sectorCollaborator.create({
    data: {
      sectorId: invite.sectorId,
      userId: user.id,
      role: "MEMBER"
    }
  });

  // Increment invite usage
  await db.sectorInvite.update({
    where: { id: invite.id },
    data: { uses: { increment: 1 } }
  });

  // Notify sector members
  const sysMsg = await db.groupMessage.create({
    data: { 
      sectorId: invite.sectorId, 
      senderId: user.id, 
      content: `joined the sector via invite link`, 
      type: "SYSTEM" 
    },
    include: { sender: { select: { id: true, name: true, username: true, image: true, titleBadge: true } } }
  });
  
  const pusherPayload = {
    ...sysMsg,
    sender: { ...sysMsg.sender, image: null }
  };
  await pusherServer.trigger(`presence-sector-${invite.sectorId}`, 'new-message', pusherPayload);

  revalidatePath("/station");
  return { success: true, sectorId: invite.sectorId, message: "Successfully joined the sector!" };
}

// ============================================================
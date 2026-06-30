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
      homepageUrl: true,
      createdAt: true,
      // clientSecret TIDAK dikembalikan di sini karena ini adalah daftar (list)
    }
  });
  return apps;
}

/** Buat OAuth App baru, kembalikan clientSecret HANYA di response ini */
export async function createOAuthApp(name: string, redirectUris: string[], homepageUrl: string) {
  const user = await requireAuth();

  if (!name.trim()) return { error: "App name is required." };
  if (!redirectUris.length || !redirectUris[0].trim()) return { error: "At least one redirect URI is required." };

  // 1. Validasi Redirect URIs (Kode asli kamu)
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

  // 2. Validasi Homepage URL (Ditambahkan dengan pola yang sama)
  if (homepageUrl.trim()) {
    try {
      const parsed = new URL(homepageUrl.trim());
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return { error: `Homepage URL must use http or https: ${homepageUrl}` };
      }
    } catch {
      return { error: `Invalid homepage URL format: ${homepageUrl}` };
    }
  }

  const clientId = `orbit_${generateSecret(16)}`;
  const clientSecret = `secret_${generateSecret(40)}`;
  const hashedSecret = await bcrypt.hash(clientSecret, 10);

  const app = await db.oAuthApp.create({
    data: {
      name: name.trim(),
      clientId,
      clientSecret: hashedSecret,
      redirectUris: redirectUris.map(u => u.trim()).filter(Boolean),
      homepageUrl: homepageUrl.trim(),
      ownerId: user.id,
    }
  });

  revalidatePath("/settings");
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
export async function updateOAuthApp(appId: string, name: string, redirectUris: string[], homepageUrl: string) {
  const user = await requireAuth();

  const app = await db.oAuthApp.findFirst({ where: { id: appId, ownerId: user.id } });
  if (!app) return { error: "App not found or access denied." };

  if (!name.trim()) return { error: "App name is required." };
  if (!redirectUris.length || !redirectUris[0].trim()) return { error: "At least one redirect URI is required." };

  // 1. Validasi Redirect URIs (Kode asli kamu)
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

  // 2. Validasi Homepage URL (Ditambahkan dengan pola yang sama)
  if (homepageUrl.trim()) {
    try {
      const parsed = new URL(homepageUrl.trim());
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return { error: `Homepage URL must use http or https: ${homepageUrl}` };
      }
    } catch {
      return { error: `Invalid homepage URL format: ${homepageUrl}` };
    }
  }

  const updated = await db.oAuthApp.update({
    where: { id: appId },
    data: {
      name: name.trim(),
      redirectUris: redirectUris.map(u => u.trim()).filter(Boolean),
      homepageUrl: homepageUrl.trim(),
    }
  });

  revalidatePath("/settings");
  return { data: updated };
}

/** Generate Personal Access Token for the user */
export async function getPersonalToken() {
  const user = await requireAuth();
  
  const jwtSecret = process.env.AUTH_SECRET;
  if (!jwtSecret) return { error: "Server missing AUTH_SECRET" };

  const secret = new TextEncoder().encode(jwtSecret);
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(process.env.NEXTAUTH_URL ?? "https://orbitstation.com")
    .setSubject(user.id!)
    .setExpirationTime("10y") // Token berlaku 10 tahun
    .sign(secret);

  return { token };
}

// ============================================================
// TAG ACTIONS
// ============================================================

export async function createTag(sectorId: string, name: string) {
  const user = await requireAuth();
  if (name.trim().length === 0 || name.trim().length > 20) {
    return { error: "Tag name must be between 1 and 20 characters" };
  }
  
  const isOwner = await db.sector.findFirst({ where: { id: sectorId, station: { userId: user.id } } });
  const collab = await db.sectorCollaborator.findUnique({ where: { sectorId_userId: { sectorId, userId: user.id } } });
  
  if (!isOwner && (!collab || collab.role !== "ADMIN")) {
    return { error: "Unauthorized. Only Owner and Admins can manage tags." };
  }

  try {
    const tag = await db.tag.create({
      data: {
        sectorId,
        name: name.trim(),
      }
    });
    revalidatePath("/station");
    return { data: tag };
  } catch (err: any) {
    if (err.code === "P2002") {
      return { error: "Tag already exists in this sector" };
    }
    return { error: "Failed to create tag" };
  }
}

export async function updateTag(tagId: string, name: string) {
  const user = await requireAuth();
  if (name.trim().length === 0 || name.trim().length > 20) {
    return { error: "Tag name must be between 1 and 20 characters" };
  }
  
  const tag = await db.tag.findUnique({ where: { id: tagId }, include: { sector: { include: { station: true, collaborators: true } } } });
  if (!tag) return { error: "Tag not found" };

  const isOwner = tag.sector.station.userId === user.id;
  const collab = tag.sector.collaborators.find(c => c.userId === user.id);
  if (!isOwner && (!collab || collab.role !== "ADMIN")) {
    return { error: "Unauthorized" };
  }

  try {
    const updated = await db.tag.update({
      where: { id: tagId },
      data: { name: name.trim() }
    });
    revalidatePath("/station");
    return { data: updated };
  } catch (err: any) {
    if (err.code === "P2002") return { error: "Tag name already in use" };
    return { error: "Failed to update tag" };
  }
}

export async function deleteTag(tagId: string) {
  const user = await requireAuth();
  const tag = await db.tag.findUnique({ where: { id: tagId }, include: { sector: { include: { station: true, collaborators: true } } } });
  if (!tag) return { error: "Tag not found" };

  const isOwner = tag.sector.station.userId === user.id;
  const collab = tag.sector.collaborators.find(c => c.userId === user.id);
  if (!isOwner && (!collab || collab.role !== "ADMIN")) {
    return { error: "Unauthorized" };
  }

  await db.tag.delete({ where: { id: tagId } });
  revalidatePath("/station");
  return { success: true };
}

export async function assignTagsToBeacon(beaconId: string, tagIds: string[]) {
  const user = await requireAuth();
  const beacon = await db.beacon.findUnique({ where: { id: beaconId }, include: { sector: { include: { station: true, collaborators: true } } } });
  if (!beacon) return { error: "Beacon not found" };

  const isOwner = beacon.sector.station.userId === user.id;
  const collab = beacon.sector.collaborators.find(c => c.userId === user.id);
  if (!isOwner && (!collab || collab.role !== "ADMIN")) {
    return { error: "Unauthorized" };
  }
  
  if (tagIds.length > 5) {
    return { error: "Maximum 5 tags allowed per beacon" };
  }

  await db.beaconTag.deleteMany({ where: { beaconId } });
  
  if (tagIds.length > 0) {
    await db.beaconTag.createMany({
      data: tagIds.map(tagId => ({ beaconId, tagId }))
    });
  }

  revalidatePath("/station");
  return { success: true };
}

export async function leaveSector(sectorId: string) {
  const user = await requireAuth();

  const sector = await db.sector.findUnique({
    where: { id: sectorId },
    include: { station: true },
  });

  if (!sector) return { error: "Sector not found" };

  if (sector.station.userId === user.id) {
    return { error: "Owner cannot leave their own sector" };
  }

  await db.sectorCollaborator.deleteMany({
    where: { sectorId, userId: user.id },
  });

  revalidatePath("/station");
  return { success: true };
}

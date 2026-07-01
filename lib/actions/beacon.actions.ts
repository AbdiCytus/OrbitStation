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
import { BeaconSchema, UpdateBeaconSchema } from "@/lib/validations";

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
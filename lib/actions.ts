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
      order: newOrder,
    },
  });

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
    },
  });

  revalidatePath("/station");
  return { data: updated };
}

/** Hapus Sektor beserta semua Beacon di dalamnya */
export async function deleteSector(sectorId: string) {
  const user = await requireAuth();

  const sector = await db.sector.findFirst({
    where: { id: sectorId, station: { userId: user.id } },
  });
  if (!sector) {
    return { error: "Sector not found or access denied" };
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
};

/** Tambah Suar (Beacon) baru ke dalam sebuah Sektor */
export async function createBeacon(sectorId: string, data: BeaconFormData) {
  const user = await requireAuth();

  // Validasi sektor milik user
  const sector = await db.sector.findFirst({
    where: { id: sectorId, station: { userId: user.id } },
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
    },
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
    where: { id: beaconId, sector: { station: { userId: user.id } } },
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
    },
  });

  revalidatePath("/station");
  return { data: updated };
}

/** Hapus sebuah Suar */
export async function deleteBeacon(beaconId: string) {
  const user = await requireAuth();

  const beacon = await db.beacon.findFirst({
    where: { id: beaconId, sector: { station: { userId: user.id } } },
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
    data: { visitCount: { increment: 1 } },
  });
  return { success: true };
}

/** Toggle isPinned pada sebuah Beacon */
export async function toggleBeaconPin(beaconId: string) {
  const user = await requireAuth();

  const beacon = await db.beacon.findFirst({
    where: { id: beaconId, sector: { station: { userId: user.id } } },
  });
  if (!beacon) {
    return { error: "Beacon not found or access denied" };
  }

  const updated = await db.beacon.update({
    where: { id: beaconId },
    data: { isPinned: !beacon.isPinned },
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

  // Validasi sektor milik user
  const sector = await db.sector.findFirst({
    where: { id: sectorId, station: { userId: user.id } },
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

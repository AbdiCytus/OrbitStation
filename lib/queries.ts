/**
 * lib/queries.ts
 * Server-side data fetching helpers (READ-ONLY).
 * Import ini HANYA di Server Components atau Server Actions.
 */

import { db } from "@/lib/db";
import { auth } from "@/auth";

// ============================================================
// STATION QUERIES
// ============================================================

/** Ambil Station + semua Sector + Beacon milik user yang sedang login */
export async function getMyStation() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const station = await db.station.findUnique({
    where: { userId: session.user.id },
    include: {
      sectors: {
        orderBy: { order: "asc" },
        include: {
          beacons: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  return station;
}

/** Ambil Station publik milik user lain berdasarkan username */
export async function getPublicStation(username: string) {
  const user = await db.user.findUnique({
    where: { username },
    include: {
      station: {
        where: { isPublic: true },
        include: {
          sectors: {
            where: { isPublic: true },
            orderBy: { order: "asc" },
            include: {
              beacons: {
                where: { isPinned: true },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!user?.station) return null;

  return {
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      bio: user.bio,
      bannerUrl: user.bannerUrl,
      titleBadge: user.titleBadge,
      callsign: user.callsign,
      animationEnabled: user.animationEnabled,
    },
    station: user.station,
  };
}

// ============================================================
// BEACON QUERIES
// ============================================================

/** Ambil detail satu Beacon beserta Sector-nya (untuk modal detail) */
export async function getBeaconDetail(beaconId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  return db.beacon.findFirst({
    where: {
      id: beaconId,
      sector: { station: { userId: session.user.id } },
    },
    include: {
      sector: {
        select: { id: true, name: true, icon: true, color: true },
      },
    },
  });
}

/** Ambil semua Beacon yang di-pin milik user (untuk profil publik) */
export async function getPinnedBeacons(userId: string) {
  return db.beacon.findMany({
    where: {
      isPinned: true,
      sector: { station: { userId } },
    },
    orderBy: { visitCount: "desc" },
    take: 6, // Maksimal 6 beacon yang ditampilkan di profil
    include: {
      sector: { select: { name: true, color: true } },
    },
  });
}

// ============================================================
// USER QUERIES
// ============================================================

/** Ambil profil user yang sedang login (lengkap) */
export async function getMyProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
      bio: true,
      bannerUrl: true,
      titleBadge: true,
      callsign: true,
      animationEnabled: true,
      createdAt: true,
      station: {
        select: {
          isPublic: true,
        },
      },
    },
  });
}

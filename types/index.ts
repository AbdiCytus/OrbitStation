/**
 * types/index.ts
 * Shared TypeScript types untuk seluruh proyek Orbit Station
 */

import type {
  User,
  Station,
  Sector,
  Beacon,
} from "@prisma/client";

// ============================================================
// RE-EXPORT PRISMA TYPES
// ============================================================
export type { User, Station, Sector, Beacon };

// ============================================================
// EXTENDED / COMPOSED TYPES
// ============================================================

/** Beacon dengan relasi Sector (untuk modal detail) */
export type BeaconWithSector = Beacon & {
  sector: Pick<Sector, "id" | "name" | "icon" | "color">;
};

/** Sektor dengan semua Beacon di dalamnya */
export type SectorWithBeacons = Sector & {
  beacons: Beacon[];
};

/** Station lengkap dengan semua Sektor dan Beacon (untuk dasbor) */
export type StationWithSectors = Station & {
  sectors: SectorWithBeacons[];
};

/** Profil publik user (tanpa data sensitif) */
export type PublicUserProfile = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  bio: string | null;
  bannerUrl: string | null;
  titleBadge: string | null;
};

/** Data halaman profil publik (untuk /[username] route) */
export type PublicStationPage = {
  user: PublicUserProfile;
  station: StationWithSectors;
};

// ============================================================
// ACTION RESULT TYPES
// ============================================================

/** Generic result dari Server Action */
export type ActionResult<T = undefined> =
  | { data: T; error?: never }
  | { error: string; data?: never }
  | { success: true; error?: never; data?: never };

// ============================================================
// META SCRAPER TYPES
// ============================================================

/** Hasil dari GET /api/meta */
export type MetaResult = {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  faviconUrl: string | null;
  url: string;
};

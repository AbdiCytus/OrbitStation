"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return { ...session.user, id: session.user.id };
}

export async function requireStation(userId: string) {
  // Cari Station milik user, buat otomatis jika belum ada
  let station = await db.station.findUnique({ where: { userId } });
  if (!station) {
    station = await db.station.create({ data: { userId } });
  }
  return station;
}

// ============================================================
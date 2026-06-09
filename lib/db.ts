import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// ============================================================
// RAW CLIENT — untuk @auth/prisma-adapter (tidak support extended client)
// ============================================================
const globalForPrisma = globalThis as unknown as {
  prismaRaw: PrismaClient | undefined;
  prisma: ReturnType<typeof createExtendedClient> | undefined;
};

function createExtendedClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  }).$extends(withAccelerate());
}

// Raw client (tanpa extension) — dipakai oleh PrismaAdapter
export const prismaRaw =
  globalForPrisma.prismaRaw ?? new PrismaClient();

// Extended client — dipakai untuk semua query di app
export const db =
  globalForPrisma.prisma ?? createExtendedClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaRaw = prismaRaw;
  globalForPrisma.prisma = db;
}

import { PrismaClient } from "@/lib/generated/prisma";
import { withAccelerate } from "@prisma/extension-accelerate";

// Singleton pattern — prevents multiple Prisma instances in dev (HMR)
// Menggunakan Prisma Accelerate untuk koneksi ke Prisma Postgres (console.prisma.io)
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  }).$extends(withAccelerate());
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

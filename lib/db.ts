import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Prisma 7 requires a driver adapter — binary engine was removed.
// We use @prisma/adapter-pg for direct PostgreSQL connections.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createClient() {
  let pool = globalForPrisma.pool;
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    pool.on('error', (err) => {
      console.error('Unexpected error on idle pg client', err);
      // Don't crash the Node.js process, just log it. pg will automatically remove it.
    });
    if (process.env.NODE_ENV !== "production") globalForPrisma.pool = pool;
  }
  
  
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

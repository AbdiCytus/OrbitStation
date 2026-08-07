import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Prisma 7 requires a driver adapter — binary engine was removed.
// We use @prisma/adapter-pg for direct PostgreSQL connections.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createClient(): PrismaClient {
  let pool = globalForPrisma.pool;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL!,
      max: process.env.NODE_ENV === "production" ? 10 : 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    pool.on("error", (err) => {
      console.error("Unexpected error on idle pg client", err);
    });
    globalForPrisma.pool = pool;
  }

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  globalForPrisma.prisma = client;
  return client;
}

export const db = globalForPrisma.prisma ?? createClient();


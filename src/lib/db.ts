import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

export function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 8_000,
    idleTimeoutMillis: 30_000,
    max: 5,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

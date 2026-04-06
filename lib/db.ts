import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const rawUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
const dbUrl = rawUrl.startsWith("file:") ? rawUrl : `file:${rawUrl}`;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrisma() {
  const adapter = new PrismaBetterSqlite3({ url: dbUrl });
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

export const prisma = globalForPrisma.prisma || createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

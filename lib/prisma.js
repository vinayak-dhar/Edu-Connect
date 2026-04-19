import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// The adapter (like PrismaPg) exists to replace Prisma’s built-in Rust query engine with a native JavaScript database driver (like pg).
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });

// creating a new instance of prisma
// globalThis.prisma
export const db = globalThis.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = db;
}

// nextjs has something called hot reloading 
// globalThis.prisma: This global variable ensures that the prisma client instance is
// reused across hot reloads during development. without this, each time your application
// reloads, a new instance of the prisma client would be created, potential leading
// to connection issues.
import { PrismaClient } from "@prisma/client";

// creating a new instance of prisma 
// globalThis.prisma
export const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = db;
}

// nextjs has something called hot reloading 
// globalThis.prisma: This global variable ensures that the prisma client instance is
// reused across hot reloads during development. without this, each time your application
// reloads, a new instance of the prisma client would be created, potential leading
// to connection issues.
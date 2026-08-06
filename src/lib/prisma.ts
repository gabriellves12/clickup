import { PrismaClient } from "@prisma/client";

// Singleton do PrismaClient. Reusado entre invocations no mesmo processo
// (Vercel Fluid Compute / warm functions) — evita reabrir conexão a cada request.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Persistir em todos os ambientes: em serverless, cada worker é reutilizado por
// várias requests. Só um novo processo (cold start) recria a instância.
globalForPrisma.prisma = prisma;

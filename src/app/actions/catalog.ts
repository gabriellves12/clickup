"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireOperationalManager } from "@/lib/current-user";

const initialsFor = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

export async function createClientQuick(name: string, currentTeamSlug: string) {
  await requireOperationalManager();
  const clean = name.trim();
  if (clean.length < 2 || clean.length > 80) throw new Error("Nome de cliente inválido");
  const client = await prisma.client.create({
    data: { name: clean, initials: initialsFor(clean), linkTree: { create: {} } },
    select: { id: true, name: true, initials: true },
  });
  revalidatePath(`/board/${currentTeamSlug}`);
  return client;
}

export async function createProductQuick(input: { clientId: string; name: string; currentTeamSlug: string }) {
  await requireOperationalManager();
  const clean = input.name.trim();
  if (clean.length < 2 || clean.length > 100) throw new Error("Nome de produto inválido");
  const client = await prisma.client.findUnique({ where: { id: input.clientId }, select: { id: true } });
  if (!client) throw new Error("Cliente não encontrado");
  const product = await prisma.product.create({
    data: { clientId: client.id, name: clean },
    select: { id: true, name: true, clientId: true, driveUrl: true, figmaUrl: true, photosUrl: true, observations: true },
  });
  revalidatePath(`/board/${input.currentTeamSlug}`);
  return product;
}

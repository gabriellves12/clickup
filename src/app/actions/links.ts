"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireOperationalManager } from "@/lib/current-user";

export async function createLinkItem(input: {
  clientId: string;
  category: string;
  label: string;
  url?: string;
  observation?: string;
  username?: string;
  secret?: string;
  parentId?: string | null;
  currentTeamSlug?: string;
}) {
  await requireOperationalManager();
  let tree = await prisma.linkTree.findUnique({ where: { clientId: input.clientId } });
  if (!tree) tree = await prisma.linkTree.create({ data: { clientId: input.clientId } });

  const max = await prisma.linkTreeItem.aggregate({
    where: { linkTreeId: tree.id, parentId: input.parentId ?? null },
    _max: { order: true },
  });

  await prisma.linkTreeItem.create({
    data: {
      linkTreeId: tree.id,
      category: input.category,
      label: input.label.trim(),
      url: input.url?.trim() || null,
      observation: input.observation?.trim() || null,
      username: input.username?.trim() || null,
      secret: input.secret?.trim() || null,
      parentId: input.parentId ?? null,
      order: (max._max.order ?? -1) + 1,
    },
  });
  revalidatePath("/clientes");
  if (input.currentTeamSlug) revalidatePath(`/board/${input.currentTeamSlug}`);
}

export async function updateLinkItem(input: {
  id: string;
  label?: string;
  url?: string | null;
  observation?: string | null;
  username?: string | null;
  secret?: string | null;
  category?: string;
  currentTeamSlug?: string;
}) {
  await requireOperationalManager();
  await prisma.linkTreeItem.update({
    where: { id: input.id },
    data: {
      label: input.label,
      url: input.url ?? null,
      observation: input.observation ?? null,
      username: input.username ?? null,
      secret: input.secret ?? null,
      category: input.category,
    },
  });
  revalidatePath("/clientes");
  if (input.currentTeamSlug) revalidatePath(`/board/${input.currentTeamSlug}`);
}

export async function deleteLinkItem(id: string, currentTeamSlug?: string) {
  await requireOperationalManager();
  await prisma.linkTreeItem.delete({ where: { id } });
  revalidatePath("/clientes");
  if (currentTeamSlug) revalidatePath(`/board/${currentTeamSlug}`);
}

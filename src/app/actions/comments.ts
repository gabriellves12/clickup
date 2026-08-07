"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/current-user";

export type CommentLite = {
  id: string;
  body: string;
  mediaUrls: string[];
  createdAt: string; // ISO
  author: { id: string; name: string; initials: string; color: string; avatarUrl: string | null };
};

function parseMedia(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every((x) => typeof x === "string") ? parsed : [];
  } catch { return []; }
}

export async function listComments(cardId: string): Promise<CommentLite[]> {
  const user = await requireCurrentUser();
  const card = await prisma.card.findUnique({ where: { id: cardId }, select: { clientId: true } });
  if (!card) return [];
  // Cliente só vê comentários dos próprios cards.
  if (user.role === "client") {
    if (!user.clientId || user.clientId !== card.clientId) return [];
  }
  const rows = await prisma.comment.findMany({
    where: { cardId },
    include: { author: { select: { id: true, name: true, initials: true, color: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    mediaUrls: parseMedia(r.mediaUrls),
    createdAt: r.createdAt.toISOString(),
    author: r.author,
  }));
}

export async function addComment(input: { cardId: string; body: string; mediaUrls?: string[]; currentTeamSlug?: string }): Promise<CommentLite> {
  const user = await requireCurrentUser();
  const body = input.body.trim();
  if (!body && !(input.mediaUrls && input.mediaUrls.length)) {
    throw new Error("Comentário vazio.");
  }
  const card = await prisma.card.findUnique({ where: { id: input.cardId }, select: { id: true, clientId: true, team: { select: { slug: true } } } });
  if (!card) throw new Error("Card não encontrado.");
  if (user.role === "client") {
    if (!user.clientId || user.clientId !== card.clientId) throw new Error("Sem permissão para comentar.");
  }
  const media = (input.mediaUrls ?? []).map((u) => u.trim()).filter(Boolean);
  const created = await prisma.comment.create({
    data: {
      cardId: card.id,
      authorId: user.id,
      body,
      mediaUrls: JSON.stringify(media),
    },
    include: { author: { select: { id: true, name: true, initials: true, color: true, avatarUrl: true } } },
  });
  const slug = input.currentTeamSlug ?? card.team.slug;
  revalidatePath(`/board/${slug}`);
  return {
    id: created.id,
    body: created.body,
    mediaUrls: parseMedia(created.mediaUrls),
    createdAt: created.createdAt.toISOString(),
    author: created.author,
  };
}

export async function deleteComment(input: { id: string; currentTeamSlug?: string }): Promise<void> {
  const user = await requireCurrentUser();
  const c = await prisma.comment.findUnique({
    where: { id: input.id },
    include: { card: { select: { team: { select: { slug: true } } } } },
  });
  if (!c) return;
  const isAuthor = c.authorId === user.id;
  const isManager = user.role === "admin" || user.role === "manager";
  if (!isAuthor && !isManager) throw new Error("Sem permissão para excluir este comentário.");
  await prisma.comment.delete({ where: { id: input.id } });
  const slug = input.currentTeamSlug ?? c.card.team.slug;
  revalidatePath(`/board/${slug}`);
}

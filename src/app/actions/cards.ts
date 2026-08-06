"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { targetTeamSlugFor } from "@/lib/board-config";
import { requireCurrentUser, requireOperationalManager } from "@/lib/current-user";

type CardInput = {
  id?: string;
  title: string;
  clientId: string;
  responsibleId: string;
  status: string;
  tipoProjeto: string;
  deadline?: string | null; // ISO
  pendenteMaterial?: boolean;
  description?: string | null;
  currentTeamSlug: string; // qual board disparou a criação/edição
  productId?: string | null;
  demandTypeId?: string | null;
  variations?: string[];
  briefing?: string | null;
  copyUrl?: string | null;
  referenceUrl?: string | null;
  attachmentDriveUrl?: string | null;
  externalMaterials?: string | null;
  useExternalMaterials?: boolean;
  startDate?: string | null;
  priority?: string;
};

async function resolveTeamIdFor(tipoProjeto: string, fallbackSlug: string) {
  const slug = targetTeamSlugFor(tipoProjeto);
  const team =
    (await prisma.team.findUnique({ where: { slug } })) ??
    (await prisma.team.findUnique({ where: { slug: fallbackSlug } }));
  if (!team) throw new Error("Time não encontrado");
  return team.id;
}

async function firstAllowedStatusFor(teamId: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new Error("Time não encontrado");
  const { TEAMS } = await import("@/lib/board-config");
  const cfg = TEAMS.find((t) => t.slug === team.slug);
  return cfg?.flow[0]?.key ?? "EM_PRODUCAO";
}

export async function createOrUpdateCard(input: CardInput) {
  await requireOperationalManager();
  const teamId = await resolveTeamIdFor(input.tipoProjeto, input.currentTeamSlug);

  // Se o status enviado não pertencer ao time destino, cai no primeiro do time
  const { TEAMS } = await import("@/lib/board-config");
  const destSlug = targetTeamSlugFor(input.tipoProjeto);
  const flowKeys = TEAMS.find((t) => t.slug === destSlug)?.flow.map((f) => f.key) ?? [];
  const status = flowKeys.includes(input.status)
    ? input.status
    : await firstAllowedStatusFor(teamId);

  const data = {
    title: input.title.trim(),
    clientId: input.clientId,
    responsibleId: input.responsibleId,
    status,
    tipoProjeto: input.tipoProjeto,
    pendenteMaterial: !!input.pendenteMaterial,
    deadline: input.deadline ? new Date(input.deadline) : null,
    description: input.description ?? null,
    productId: input.productId || null,
    demandTypeId: input.demandTypeId || null,
    variation: JSON.stringify(input.variations ?? []),
    briefing: input.briefing?.trim() || null,
    copyUrl: input.copyUrl || null,
    referenceUrl: input.referenceUrl || null,
    attachmentDriveUrl: input.attachmentDriveUrl || null,
    externalMaterials: input.useExternalMaterials ? input.externalMaterials || null : null,
    useExternalMaterials: !!input.useExternalMaterials,
    startDate: input.startDate ? new Date(input.startDate) : null,
    priority: input.priority ?? "NORMAL",
    teamId,
  };

  if (input.id) {
    await prisma.card.update({ where: { id: input.id }, data });
  } else {
    // insere no fim da coluna destino (order = maxOrder + 1000)
    const max = await prisma.card.aggregate({
      where: { teamId, responsibleId: input.responsibleId, status },
      _max: { order: true },
    });
    const order = (max._max.order ?? 0) + 1000;
    await prisma.card.create({ data: { ...data, order } });
  }

  revalidatePath(`/board/${input.currentTeamSlug}`);
  if (destSlug !== input.currentTeamSlug) revalidatePath(`/board/${destSlug}`);
}

export async function deleteCard(id: string, currentTeamSlug: string) {
  await requireOperationalManager();
  await prisma.card.delete({ where: { id } });
  revalidatePath(`/board/${currentTeamSlug}`);
}

// Movimentação (DnD): apenas dentro do mesmo time+pessoa, muda status + reordena
export async function moveCard(params: {
  cardId: string;
  toStatus: string;
  toResponsibleId: string;
  beforeCardId?: string | null;
  afterCardId?: string | null;
  currentTeamSlug: string;
}) {
  const user = await requireCurrentUser();
  if (user.role === "client") throw new Error("Clientes não podem mover tarefas.");
  const card = await prisma.card.findUnique({ where: { id: params.cardId } });
  if (!card) return;

  // Reordenação: order = média entre antes e depois; se não existir, extremo
  let newOrder = card.order;
  const before = params.beforeCardId
    ? await prisma.card.findUnique({ where: { id: params.beforeCardId } })
    : null;
  const after = params.afterCardId
    ? await prisma.card.findUnique({ where: { id: params.afterCardId } })
    : null;

  if (before && after) newOrder = (before.order + after.order) / 2;
  else if (before && !after) newOrder = before.order + 1000;
  else if (!before && after) newOrder = after.order - 1000;
  else {
    const max = await prisma.card.aggregate({
      where: {
        teamId: card.teamId,
        responsibleId: params.toResponsibleId,
        status: params.toStatus,
        id: { not: card.id },
      },
      _max: { order: true },
    });
    newOrder = (max._max.order ?? 0) + 1000;
  }

  await prisma.card.update({
    where: { id: card.id },
    data: {
      status: params.toStatus,
      responsibleId: params.toResponsibleId,
      order: newOrder,
    },
  });

  revalidatePath(`/board/${params.currentTeamSlug}`);
}

export async function togglePendenteMaterial(id: string, currentTeamSlug: string) {
  await requireOperationalManager();
  const c = await prisma.card.findUnique({ where: { id }, select: { pendenteMaterial: true } });
  if (!c) return;
  await prisma.card.update({ where: { id }, data: { pendenteMaterial: !c.pendenteMaterial } });
  revalidatePath(`/board/${currentTeamSlug}`);
}

const clientVisibleStatuses = new Set([
  "PENDENTES", "PARA_PRODUCAO", "EM_PRODUCAO", "APROVACAO", "FINALIZADO",
]);

export async function moveClientCard(params: { cardId: string; toStatus: string }) {
  const user = await requireCurrentUser();
  if (user.role !== "client" || !user.clientId) throw new Error("Acesso restrito ao portal do cliente.");
  if (!clientVisibleStatuses.has(params.toStatus)) throw new Error("Etapa inválida.");

  const card = await prisma.card.findUnique({ where: { id: params.cardId }, select: { id: true, clientId: true } });
  if (!card || card.clientId !== user.clientId) throw new Error("Esta demanda não pertence à sua empresa.");

  const max = await prisma.card.aggregate({
    where: { clientId: user.clientId, clientStatus: params.toStatus, id: { not: card.id } },
    _max: { order: true },
  });
  await prisma.card.update({ where: { id: card.id }, data: { clientStatus: params.toStatus, order: (max._max.order ?? 0) + 1000 } });
  revalidatePath("/portal");
}

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getWebRoutingTeamSlug } from "@/lib/teams";
import { requireCurrentUser, requireOperationalManager } from "@/lib/current-user";
import { PERSON_COLUMN_STATUS } from "@/lib/board-config";

// Roteia por tipo do projeto para o slug do time destino.
// PAGINA vai pro time de web (convenção); qualquer outro fica no time atual.
async function resolveDestSlug(tipoProjeto: string, fallbackSlug: string) {
  if (tipoProjeto === "PAGINA") return getWebRoutingTeamSlug();
  return fallbackSlug;
}

async function statusKeysForTeamSlug(slug: string): Promise<Set<string>> {
  const team = await prisma.team.findUnique({
    where: { slug },
    include: { statuses: { select: { key: true } } },
  });
  return new Set(team?.statuses.map((s) => s.key) ?? []);
}

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

export async function createOrUpdateCard(input: CardInput) {
  await requireOperationalManager();

  const destSlug = await resolveDestSlug(input.tipoProjeto, input.currentTeamSlug);
  const destTeam = await prisma.team.findUnique({ where: { slug: destSlug } });
  if (!destTeam) throw new Error("Quadro destino não encontrado.");
  const teamId = destTeam.id;

  const flowKeys = await statusKeysForTeamSlug(destSlug);
  // Regra: card NOVO sempre nasce na coluna do responsável (PERSON_COLUMN),
  // ignorando qualquer status que o formulário tenha enviado.
  // Edição preserva o status atual se for válido (etapa existente ou PERSON_COLUMN).
  const status = input.id
    ? (input.status === PERSON_COLUMN_STATUS || flowKeys.has(input.status)
        ? input.status
        : PERSON_COLUMN_STATUS)
    : PERSON_COLUMN_STATUS;

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

// Movimentação flat: card vive em UMA coluna. Se toStatus === PERSON_COLUMN,
// vai para a coluna do responsável (toResponsibleId obrigatório). Caso contrário,
// vai para uma coluna de etapa (responsável não muda — server-side ignora troca).
export async function moveCard(params: {
  cardId: string;
  toStatus: string; // PERSON_COLUMN | TeamStatus.key
  toResponsibleId?: string | null; // usado só quando toStatus === PERSON_COLUMN
  beforeCardId?: string | null;
  afterCardId?: string | null;
  currentTeamSlug: string;
}) {
  const user = await requireCurrentUser();
  if (user.role === "client") throw new Error("Clientes não podem mover tarefas.");

  const card = await prisma.card.findUnique({
    where: { id: params.cardId },
    include: { team: { select: { slug: true } } },
  });
  if (!card) return;

  const isPersonColumn = params.toStatus === PERSON_COLUMN_STATUS;
  const isManager = user.role === "admin" || user.role === "manager";
  const isOwnCard = card.responsibleId === user.id;

  // Determina o novo responsável.
  let toResponsibleId = card.responsibleId;
  if (isPersonColumn) {
    if (!params.toResponsibleId) throw new Error("Responsável obrigatório para coluna de pessoa.");
    // Só admin/manager reatribui card entre pessoas. Membro só move para a própria coluna.
    if (!isManager && params.toResponsibleId !== user.id) {
      throw new Error("Sem permissão para atribuir a demanda a outra pessoa.");
    }
    // Membro só pode mover cards que já são dele.
    if (!isManager && !isOwnCard) {
      throw new Error("Sem permissão para mover a demanda de outra pessoa.");
    }
    const destinationMember = await prisma.teamMember.findUnique({
      where: { teamId_personId: { teamId: card.teamId, personId: params.toResponsibleId } },
      select: { personId: true },
    });
    if (!destinationMember) throw new Error("Responsável inválido para este quadro.");
    toResponsibleId = params.toResponsibleId;
  } else {
    // Coluna de etapa: valida que a etapa existe e checa restrição.
    const stage = await prisma.teamStatus.findFirst({
      where: { teamId: card.teamId, key: params.toStatus },
      select: { restrictToManagers: true },
    });
    if (!stage) throw new Error("Etapa inválida para este quadro.");
    if (stage.restrictToManagers && !isManager) {
      throw new Error("Somente admin/gestão podem mover para esta etapa.");
    }
    if (!isManager && !isOwnCard) {
      throw new Error("Sem permissão para mover a demanda de outra pessoa.");
    }
    // Responsável não muda em coluna de etapa.
  }

  // Reordenação dentro da mesma coluna destino.
  const columnWhere = {
    teamId: card.teamId,
    status: params.toStatus,
    ...(isPersonColumn ? { responsibleId: toResponsibleId } : {}),
  };

  let newOrder = card.order;
  const before = params.beforeCardId
    ? await prisma.card.findFirst({ where: { id: params.beforeCardId, ...columnWhere } })
    : null;
  const after = params.afterCardId
    ? await prisma.card.findFirst({ where: { id: params.afterCardId, ...columnWhere } })
    : null;

  if (before && after) newOrder = (before.order + after.order) / 2;
  else if (before && !after) newOrder = before.order + 1000;
  else if (!before && after) newOrder = after.order - 1000;
  else {
    const max = await prisma.card.aggregate({
      where: { ...columnWhere, id: { not: card.id } },
      _max: { order: true },
    });
    newOrder = (max._max.order ?? 0) + 1000;
  }

  await prisma.card.update({
    where: { id: card.id },
    data: {
      status: params.toStatus,
      responsibleId: toResponsibleId,
      order: newOrder,
    },
  });

  revalidatePath(`/board/${card.team.slug}`);
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

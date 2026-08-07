"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function assertEditor() {
  const user = await requireCurrentUser();
  if (user.role !== "admin" && user.role !== "manager") {
    throw new Error("Apenas admin ou gestão podem alterar quadros.");
  }
  return user;
}

const DEFAULT_TEAM_COLUMNS = [
  { key: "EM_PRODUCAO", label: "Em produção", tone: "doing"  },
  { key: "APROVACAO",   label: "Aprovação",   tone: "review" },
  { key: "FINALIZADO",  label: "Finalizado",  tone: "done"   },
];

const DEFAULT_CLIENT_COLUMNS = [
  { key: "PENDENTES",     label: "Pendentes",     tone: "neutral" },
  { key: "PARA_PRODUCAO", label: "Para produção", tone: "info"    },
  { key: "EM_PRODUCAO",   label: "Em produção",   tone: "doing"   },
  { key: "APROVACAO",     label: "Aprovação",     tone: "review"  },
  { key: "FINALIZADO",    label: "Finalizado",    tone: "done"    },
];

// -------- Boards (Team) --------

export async function createBoard(input: {
  name: string;
  kind: "TEAM" | "CLIENT";
  clientId?: string;
}) {
  await assertEditor();
  const name = input.name.trim();
  if (!name) throw new Error("Informe um nome para o quadro.");
  if (input.kind === "CLIENT" && !input.clientId) throw new Error("Selecione o cliente.");

  let base = slugify(input.kind === "CLIENT" ? `cliente-${name}` : name);
  if (!base) base = `quadro-${Date.now()}`;
  let slug = base;
  let attempt = 0;
  while (await prisma.team.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${base}-${attempt}`;
    if (attempt > 20) break;
  }

  const maxOrder = await prisma.team.aggregate({ _max: { order: true } });
  const team = await prisma.team.create({
    data: {
      slug, name, kind: input.kind,
      clientId: input.kind === "CLIENT" ? input.clientId! : null,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  const cols = input.kind === "CLIENT" ? DEFAULT_CLIENT_COLUMNS : DEFAULT_TEAM_COLUMNS;
  await prisma.teamStatus.createMany({
    data: cols.map((col, i) => ({
      teamId: team.id, key: col.key, label: col.label, tone: col.tone, order: (i + 1) * 1000,
    })),
  });

  revalidatePath("/", "layout");
  redirect(`/board/${team.slug}`);
}

export async function renameBoard(input: { id: string; name: string }) {
  await assertEditor();
  const name = input.name.trim();
  if (!name) throw new Error("Informe um nome.");
  const team = await prisma.team.update({ where: { id: input.id }, data: { name } });
  revalidatePath("/", "layout");
  revalidatePath(`/board/${team.slug}`);
}

export async function deleteBoard(id: string) {
  await assertEditor();
  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) return;
  const cardCount = await prisma.card.count({ where: { teamId: id } });
  if (cardCount > 0) throw new Error(`Não é possível excluir: existem ${cardCount} demanda(s) neste quadro.`);
  await prisma.team.delete({ where: { id } });
  revalidatePath("/", "layout");
}

// -------- Colunas (TeamStatus) --------

export async function createColumn(input: { teamId: string; label: string; tone?: string }) {
  await assertEditor();
  const label = input.label.trim();
  if (!label) throw new Error("Informe um nome para a coluna.");

  const team = await prisma.team.findUnique({ where: { id: input.teamId }, select: { slug: true } });
  if (!team) throw new Error("Quadro não encontrado.");

  let base = slugify(label).toUpperCase().replace(/-/g, "_");
  if (!base) base = `COLUNA_${Date.now()}`;
  let key = base;
  let attempt = 0;
  while (await prisma.teamStatus.findUnique({ where: { teamId_key: { teamId: input.teamId, key } } })) {
    attempt += 1;
    key = `${base}_${attempt}`;
    if (attempt > 20) break;
  }

  const max = await prisma.teamStatus.aggregate({ where: { teamId: input.teamId }, _max: { order: true } });
  await prisma.teamStatus.create({
    data: {
      teamId: input.teamId, key, label,
      tone: input.tone ?? "neutral",
      order: (max._max.order ?? 0) + 1000,
    },
  });
  revalidatePath(`/board/${team.slug}`);
}

export async function renameColumn(input: { id: string; label: string }) {
  await assertEditor();
  const label = input.label.trim();
  if (!label) throw new Error("Informe um nome.");
  const status = await prisma.teamStatus.update({
    where: { id: input.id }, data: { label },
    include: { team: { select: { slug: true } } },
  });
  revalidatePath(`/board/${status.team.slug}`);
}

export async function deleteColumn(id: string) {
  await assertEditor();
  const status = await prisma.teamStatus.findUnique({
    where: { id }, include: { team: { select: { slug: true } } },
  });
  if (!status) return;
  const cardCount = await prisma.card.count({
    where: { teamId: status.teamId, status: status.key },
  });
  if (cardCount > 0) throw new Error(`Não é possível excluir: ${cardCount} demanda(s) usam esta coluna.`);
  await prisma.teamStatus.delete({ where: { id } });
  revalidatePath(`/board/${status.team.slug}`);
}

export async function reorderColumn(input: {
  id: string;
  beforeId?: string | null;
  afterId?: string | null;
}) {
  await assertEditor();
  const status = await prisma.teamStatus.findUnique({
    where: { id: input.id }, include: { team: { select: { slug: true } } },
  });
  if (!status) return;

  const [before, after] = await Promise.all([
    input.beforeId ? prisma.teamStatus.findUnique({ where: { id: input.beforeId } }) : null,
    input.afterId ? prisma.teamStatus.findUnique({ where: { id: input.afterId } }) : null,
  ]);

  let newOrder = status.order;
  if (before && after) newOrder = (before.order + after.order) / 2;
  else if (before && !after) newOrder = before.order + 1000;
  else if (!before && after) newOrder = after.order - 1000;

  await prisma.teamStatus.update({ where: { id: input.id }, data: { order: newOrder } });
  revalidatePath(`/board/${status.team.slug}`);
}

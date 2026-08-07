import "server-only";
import { prisma } from "@/lib/prisma";

const DONE_STATUS = "FINALIZADO";

function todayStart() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}

/* ---------------- KPIs globais da tela /clientes ---------------- */
export async function getClientsOverview() {
  const [total, ativos, encerrados, fixos, freelas, cards] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { status: "ATIVO" } }),
    prisma.client.count({ where: { status: "ENCERRADO" } }),
    prisma.client.count({ where: { tipoContrato: "FIXO" } }),
    prisma.client.count({ where: { tipoContrato: "FREELA" } }),
    prisma.card.findMany({ select: { status: true, deadline: true, pendenteMaterial: true } }),
  ]);
  const t0 = todayStart();
  const abertas = cards.filter((c) => c.status !== DONE_STATUS).length;
  const atrasadas = cards.filter((c) =>
    c.status !== DONE_STATUS &&
    (c.pendenteMaterial || (c.deadline && c.deadline < t0))
  ).length;
  return { total, ativos, encerrados, fixos, freelas, abertas, atrasadas };
}

/* ---------------- Lista com agregados por cliente ---------------- */
export type ClientRow = Awaited<ReturnType<typeof getClientsList>>[number];

export async function getClientsList() {
  const clients = await prisma.client.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: {
      cards: {
        include: { responsible: true },
      },
      linkTree: { include: { items: { orderBy: { order: "asc" } } } },
    },
  });
  const t0 = todayStart();
  return clients.map((c) => {
    const openCards = c.cards.filter((x) => x.status !== DONE_STATUS);
    const overdueCards = c.cards.filter((x) =>
      x.status !== DONE_STATUS &&
      (x.pendenteMaterial || (x.deadline && x.deadline < t0))
    );
    const activeResponsibles = uniqPeople(openCards.map((x) => x.responsible));
    return {
      id: c.id,
      name: c.name,
      initials: c.initials,
      tipoContrato: c.tipoContrato as "FIXO" | "FREELA",
      status: c.status as "ATIVO" | "ENCERRADO",
      startDate: c.startDate ? c.startDate.toISOString() : null,
      endDate: c.endDate ? c.endDate.toISOString() : null,
      contractUrl: c.contractUrl,
      contractMonths: c.contractMonths,
      whatsappUrl: c.whatsappUrl,
      openCount: openCards.length,
      overdueCount: overdueCards.length,
      responsibles: activeResponsibles,
      totalCards: c.cards.length,
      links: (c.linkTree?.items ?? []).map((i) => ({
        id: i.id, category: i.category, label: i.label,
        url: i.url, observation: i.observation, username: i.username,
        secret: i.secret, parentId: i.parentId,
        order: i.order,
      })),
    };
  });
}

function uniqPeople<T extends { id: string; name: string; initials: string; color: string }>(list: T[]) {
  const map = new Map<string, T>();
  for (const p of list) if (!map.has(p.id)) map.set(p.id, p);
  return Array.from(map.values());
}

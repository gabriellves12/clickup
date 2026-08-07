import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type TeamKind = "TEAM" | "CLIENT";

export type BoardStatus = {
  key: string;
  label: string;
  order: number;
  tone: string | null;
};

export type BoardSummary = {
  id: string;
  slug: string;
  name: string;
  kind: TeamKind;
  clientId: string | null;
  order: number;
};

export type BoardWithColumns = BoardSummary & {
  statuses: BoardStatus[];
};

// Lista de boards para sidebar. Cache por request via React.cache.
export const listBoards = cache(async (): Promise<BoardSummary[]> => {
  const teams = await prisma.team.findMany({
    orderBy: [{ kind: "asc" }, { order: "asc" }, { name: "asc" }],
    select: { id: true, slug: true, name: true, kind: true, clientId: true, order: true },
  });
  return teams.map((t) => ({
    id: t.id, slug: t.slug, name: t.name,
    kind: (t.kind === "CLIENT" ? "CLIENT" : "TEAM") as TeamKind,
    clientId: t.clientId, order: t.order,
  }));
});

// Board completo com colunas (para a page do quadro).
export const getBoardBySlug = cache(async (slug: string): Promise<BoardWithColumns | null> => {
  const team = await prisma.team.findUnique({
    where: { slug },
    include: {
      statuses: { orderBy: { order: "asc" } },
    },
  });
  if (!team) return null;
  return {
    id: team.id,
    slug: team.slug,
    name: team.name,
    kind: (team.kind === "CLIENT" ? "CLIENT" : "TEAM"),
    clientId: team.clientId,
    order: team.order,
    statuses: team.statuses.map((s) => ({
      key: s.key, label: s.label, order: s.order, tone: s.tone,
    })),
  };
});

// Retorna o slug do primeiro team KIND=TEAM marcado para receber cards do tipo "página".
// Para simplificar, usa convenção: slug === "web-design" quando existir; senão, o primeiro TEAM.
// Substitui a hardcoded targetTeamSlugFor() do antigo board-config.
export const getWebRoutingTeamSlug = cache(async (): Promise<string> => {
  const web = await prisma.team.findFirst({
    where: { kind: "TEAM", slug: "web-design" },
    select: { slug: true },
  });
  if (web) return web.slug;
  const fallback = await prisma.team.findFirst({
    where: { kind: "TEAM" },
    orderBy: { order: "asc" },
    select: { slug: true },
  });
  return fallback?.slug ?? "design";
});

export const getDefaultTeamSlug = cache(async (): Promise<string> => {
  const first = await prisma.team.findFirst({
    where: { kind: "TEAM" },
    orderBy: { order: "asc" },
    select: { slug: true },
  });
  return first?.slug ?? "design";
});

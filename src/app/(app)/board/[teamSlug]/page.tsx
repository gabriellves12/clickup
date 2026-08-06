import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { findTeam } from "@/lib/board-config";
import { BoardClient } from "@/components/board/BoardClient";
import type { BoardData } from "@/components/board/types";
import { requireCurrentUser } from "@/lib/current-user";

export default async function BoardPage({ params }: { params: Promise<{ teamSlug: string }> }) {
  const user = await requireCurrentUser();
  if (user.role === "client") redirect("/portal");
  const { teamSlug } = await params;
  const cfg = findTeam(teamSlug);
  if (!cfg) notFound();

  const team = await prisma.team.findUnique({
    where: { slug: teamSlug },
    include: {
      members: { include: { person: true }, orderBy: { order: "asc" } },
      cards: {
        include: { client: true, responsible: true },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!team) notFound();

  const clients = await prisma.client.findMany({
    include: {
      linkTree: { include: { items: { orderBy: { order: "asc" } } } },
    },
    orderBy: { name: "asc" },
  });
  const allPeople = await prisma.person.findMany({ orderBy: { name: "asc" } });
  const products = await prisma.product.findMany({ orderBy: [{ clientId: "asc" }, { name: "asc" }] });
  const demandTypes = await prisma.demandType.findMany({ orderBy: { order: "asc" } });

  const data: BoardData = {
    team: { id: team.id, slug: team.slug, name: team.name },
    flow: cfg.flow,
    members: team.members.map((m) => ({
      person: {
        id: m.person.id,
        name: m.person.name,
        initials: m.person.initials,
        color: m.person.color,
      },
      order: m.order,
    })),
    cards: team.cards.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      status: c.status,
      tipoProjeto: c.tipoProjeto,
      pendenteMaterial: c.pendenteMaterial,
      deadline: c.deadline ? c.deadline.toISOString() : null,
      order: c.order,
      clientId: c.clientId,
      responsibleId: c.responsibleId,
      productId: c.productId,
      demandTypeId: c.demandTypeId,
      variation: parseStringArray(c.variation),
      briefing: c.briefing,
      copyUrl: c.copyUrl,
      referenceUrl: c.referenceUrl,
      attachmentDriveUrl: c.attachmentDriveUrl,
      externalMaterials: c.externalMaterials,
      useExternalMaterials: c.useExternalMaterials,
      startDate: c.startDate ? c.startDate.toISOString() : null,
      priority: c.priority,
      client: { id: c.client.id, name: c.client.name, initials: c.client.initials },
      responsible: {
        id: c.responsible.id, name: c.responsible.name,
        initials: c.responsible.initials, color: c.responsible.color,
      },
    })),
    clients: clients.map((c) => ({
      id: c.id, name: c.name, initials: c.initials,
      links: (c.linkTree?.items ?? []).map((i) => ({
        id: i.id, category: i.category, label: i.label,
        url: i.url, observation: i.observation, parentId: i.parentId,
        order: i.order,
      })),
    })),
    allPeople: allPeople.map((p) => ({
      id: p.id, name: p.name, initials: p.initials, color: p.color,
    })),
    products: products.map((p) => ({
      id: p.id, name: p.name, clientId: p.clientId, driveUrl: p.driveUrl,
      figmaUrl: p.figmaUrl, photosUrl: p.photosUrl, observations: p.observations,
    })),
    demandTypes: demandTypes.map((d) => ({
      id: d.id, name: d.name, prefix: d.prefix, variationMode: d.variationMode,
      variations: parseStringArray(d.variations), routeToWeb: d.routeToWeb, order: d.order,
    })),
  };

  const boardVersion = team.cards.map((card) => `${card.id}:${card.updatedAt.getTime()}`).join("|");
  return <BoardClient key={boardVersion} data={data} canManage={user.role === "admin" || user.role === "manager"} />;
}

function parseStringArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : [];
  } catch { return []; }
}

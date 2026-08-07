import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { AppShell, type BoardMenuItem } from "@/components/shell/AppShell";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "client") redirect("/portal");

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

  const [teams, totalByTeam, overdueByTeam, clientsForDialog] = await Promise.all([
    prisma.team.findMany({
      orderBy: [{ kind: "asc" }, { order: "asc" }],
      select: { id: true, slug: true, name: true, kind: true, clientId: true },
    }),
    prisma.card.groupBy({ by: ["teamId"], _count: { _all: true } }),
    prisma.card.groupBy({
      by: ["teamId"],
      where: {
        status: { not: "FINALIZADO" },
        OR: [{ pendenteMaterial: true }, { deadline: { lt: todayStart } }],
      },
      _count: { _all: true },
    }),
    prisma.client.findMany({
      where: { status: "ATIVO" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const totalMap = new Map(totalByTeam.map((row) => [row.teamId, row._count._all]));
  const overdueMap = new Map(overdueByTeam.map((row) => [row.teamId, row._count._all]));

  const boards: BoardMenuItem[] = teams.map((team) => ({
    slug: team.slug,
    name: team.name,
    kind: team.kind === "CLIENT" ? "CLIENT" : "TEAM",
    cardsCount: totalMap.get(team.id) ?? 0,
    overdueCount: overdueMap.get(team.id) ?? 0,
  }));

  const canEditBoards = user.role === "admin" || user.role === "manager";

  return (
    <AppShell
      user={user}
      boards={boards}
      canEditBoards={canEditBoards}
      clients={clientsForDialog}
    >
      {children}
    </AppShell>
  );
}

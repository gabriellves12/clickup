import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { AppShell } from "@/components/shell/AppShell";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "client") redirect("/portal");

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

  // Duas queries agregadas em paralelo — sem trazer nenhum Card para memória.
  // Total: 1 query lookup de times + 2 groupBy = 3 queries paralelas com counts feitos em SQL.
  const [teams, totalByTeam, overdueByTeam] = await Promise.all([
    prisma.team.findMany({
      orderBy: { order: "asc" },
      select: { id: true, slug: true, name: true },
    }),
    prisma.card.groupBy({
      by: ["teamId"],
      _count: { _all: true },
    }),
    prisma.card.groupBy({
      by: ["teamId"],
      where: {
        status: { not: "FINALIZADO" },
        OR: [
          { pendenteMaterial: true },
          { deadline: { lt: todayStart } },
        ],
      },
      _count: { _all: true },
    }),
  ]);

  const totalMap = new Map(totalByTeam.map((row) => [row.teamId, row._count._all]));
  const overdueMap = new Map(overdueByTeam.map((row) => [row.teamId, row._count._all]));

  const teamsSummary = teams.map((team) => ({
    slug: team.slug,
    name: team.name,
    cardsCount: totalMap.get(team.id) ?? 0,
    overdueCount: overdueMap.get(team.id) ?? 0,
  }));

  return (
    <AppShell user={user} teamsSummary={teamsSummary}>
      {children}
    </AppShell>
  );
}

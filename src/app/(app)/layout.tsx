import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { AppShell } from "@/components/shell/AppShell";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "client") redirect("/portal");

  const teams = await prisma.team.findMany({
    orderBy: { order: "asc" },
    include: { cards: { select: { deadline: true, status: true, pendenteMaterial: true } } },
  });

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const teamsSummary = teams.map((team) => ({
    slug: team.slug,
    name: team.name,
    cardsCount: team.cards.length,
    overdueCount: team.cards.filter((card) =>
      card.status !== "FINALIZADO" &&
      (card.pendenteMaterial || (!!card.deadline && card.deadline < todayStart))
    ).length,
  }));

  return (
    <AppShell user={user} teamsSummary={teamsSummary}>
      {children}
    </AppShell>
  );
}

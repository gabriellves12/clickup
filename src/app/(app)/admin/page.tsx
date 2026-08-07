import { ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/current-user";
import { AdminControlPanel, type AdminClient, type AdminPerson, type AdminTeam } from "@/components/admin/AdminControlPanel";

type AdminTab = "visao-geral" | "pessoas" | "clientes" | "estrutura";
const tabs = new Set<AdminTab>(["visao-geral", "pessoas", "clientes", "estrutura"]);

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const activeTab: AdminTab = tabs.has(params.tab as AdminTab) ? params.tab as AdminTab : "visao-geral";

  const [people, clients, teams] = await Promise.all([
    prisma.person.findMany({
      include: { client: { select: { name: true } }, _count: { select: { cards: true, teams: true } } },
      orderBy: [{ accessEnabled: "desc" }, { name: "asc" }],
    }),
    prisma.client.findMany({
      include: {
        _count: { select: { cards: true, products: true, users: true, teams: true } },
        users: { where: { role: "client" }, select: { id: true, name: true, email: true, accessEnabled: true }, orderBy: { name: "asc" } },
      },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    }),
    prisma.team.findMany({
      include: { client: { select: { name: true } }, _count: { select: { cards: true, members: true, statuses: true } } },
      orderBy: [{ kind: "asc" }, { order: "asc" }],
    }),
  ]);

  const personData: AdminPerson[] = people.map((person) => ({
    id: person.id, name: person.name, email: person.email, initials: person.initials, role: person.role,
    clientId: person.clientId, clientName: person.client?.name ?? null, accessEnabled: person.accessEnabled,
    cardsCount: person._count.cards, teamsCount: person._count.teams, createdAt: person.createdAt.toISOString(),
  }));
  const clientData: AdminClient[] = clients.map((client) => ({
    id: client.id, name: client.name, initials: client.initials, tipoContrato: client.tipoContrato, status: client.status,
    startDate: client.startDate?.toISOString().slice(0, 10) ?? null, endDate: client.endDate?.toISOString().slice(0, 10) ?? null,
    contractUrl: client.contractUrl, whatsappUrl: client.whatsappUrl, portalUserLimit: client.portalUserLimit,
    cardsCount: client._count.cards, productsCount: client._count.products, teamsCount: client._count.teams,
    users: client.users,
  }));
  const teamData: AdminTeam[] = teams.map((team) => ({
    id: team.id, name: team.name, slug: team.slug, kind: team.kind, clientName: team.client?.name ?? null,
    cardsCount: team._count.cards, membersCount: team._count.members, columnsCount: team._count.statuses,
  }));

  return <main className="min-h-full bg-white">
    <header className="border-b border-[#e8e8e8] px-6 py-7 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <div className="flex items-start gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-[#181818] text-white shadow-[0_5px_14px_rgba(0,0,0,.12)]"><ShieldCheck className="size-[17px]" strokeWidth={1.7} /></span>
          <div><p className="text-[9px] font-medium uppercase tracking-[.14em] text-[#8a8a8a]">Control room</p><h1 className="mt-1 text-[26px] font-semibold tracking-[-.045em] text-[#181818]">Administração</h1><p className="mt-1 text-[11.5px] text-[#777]">Estruture acessos, clientes e ambientes da operação em um único lugar.</p></div>
        </div>
      </div>
    </header>
    <AdminControlPanel activeTab={activeTab} people={personData} clients={clientData} teams={teamData} />
  </main>;
}

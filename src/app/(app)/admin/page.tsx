import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CircleCheck,
  LayoutDashboard,
  PanelsTopLeft,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/current-user";
import { cn } from "@/lib/cn";

type AdminTab = "visao-geral" | "usuarios" | "area-clientes";

const tabs: Array<{ id: AdminTab; label: string; icon: typeof ShieldCheck }> = [
  { id: "visao-geral", label: "Visão geral", icon: LayoutDashboard },
  { id: "usuarios", label: "Usuários", icon: UsersRound },
  { id: "area-clientes", label: "Área dos clientes", icon: PanelsTopLeft },
];

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const activeTab = tabs.some((tab) => tab.id === params.tab) ? params.tab as AdminTab : "visao-geral";

  const [clients, people] = await Promise.all([
    prisma.client.findMany({
      include: { _count: { select: { cards: true, products: true } }, linkTree: { select: { id: true } } },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    }),
    prisma.person.findMany({
      include: { _count: { select: { cards: true, teams: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const activeClients = clients.filter((client) => client.status === "ATIVO");
  const readyPortals = activeClients.filter((client) => client.linkTree || client._count.products > 0);

  return (
    <main className="min-h-full bg-white">
      <header className="border-b border-[#e8e8e8] px-6 pb-0 pt-7 lg:px-10">
        <div className="mx-auto max-w-[1280px]">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[.12em] text-[#8a8a8a]">
                <ShieldCheck className="size-3.5" /> Administração
              </div>
              <h1 className="mt-2 text-[25px] font-semibold tracking-[-.035em]">Painel de Admin</h1>
              <p className="mt-1 max-w-[620px] text-[12px] text-[#777]">
                Gerencie a operação interna e os ambientes que serão compartilhados com cada cliente.
              </p>
            </div>
          </div>

          <nav className="mt-7 flex gap-1 overflow-x-auto" aria-label="Seções do painel administrativo">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={`/admin?tab=${tab.id}`}
                  aria-current={selected ? "page" : undefined}
                  className={cn(
                    "flex h-10 shrink-0 items-center gap-2 border-b-2 px-3 text-[11.5px] font-medium transition-colors",
                    selected
                      ? "border-[#111] text-[#111]"
                      : "border-transparent text-[#777] hover:bg-[#f5f5f5] hover:text-[#222]",
                  )}
                >
                  <Icon className="size-3.5" strokeWidth={1.7} />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-6 py-7 lg:px-10 lg:py-9">
        {activeTab === "visao-geral" && (
          <Overview clients={clients.length} activeClients={activeClients.length} people={people.length} portals={readyPortals.length} />
        )}
        {activeTab === "usuarios" && <UsersTab people={people} />}
        {activeTab === "area-clientes" && <ClientAreasTab clients={clients} readyCount={readyPortals.length} />}
      </div>
    </main>
  );
}

function Overview({ clients, activeClients, people, portals }: { clients: number; activeClients: number; people: number; portals: number }) {
  const stats = [
    { label: "Clientes cadastrados", value: clients, detail: `${activeClients} ativos`, icon: Building2 },
    { label: "Pessoas na equipe", value: people, detail: "Acessos internos", icon: UsersRound },
    { label: "Áreas preparadas", value: portals, detail: "Com conteúdo disponível", icon: PanelsTopLeft },
  ];
  return <section><h2 className="text-[15px] font-semibold tracking-[-.02em]">Visão geral da operação</h2><div className="mt-4 grid gap-3 md:grid-cols-3">{stats.map(({ label, value, detail, icon: Icon }) => <article key={label} className="rounded-lg border border-[#e5e5e5] p-5"><div className="flex items-center justify-between"><Icon className="size-4 text-[#777]" strokeWidth={1.6} /><span className="text-[26px] font-semibold tabular tracking-[-.04em]">{value}</span></div><p className="mt-8 text-[11.5px] font-medium">{label}</p><p className="mt-1 text-[10px] text-[#999]">{detail}</p></article>)}</div></section>;
}

function UsersTab({ people }: { people: Array<{ id: string; name: string; email: string; initials: string; role: string; _count: { cards: number; teams: number } }> }) {
  const roleLabel: Record<string, string> = { admin: "Administrador", manager: "Gestão", member: "Colaborador", client: "Cliente" };
  return <section><div><h2 className="text-[15px] font-semibold tracking-[-.02em]">Usuários e acessos</h2><p className="mt-1 text-[11px] text-[#888]">Pessoas com acesso interno ou a um portal de cliente.</p></div><div className="mt-5 overflow-hidden rounded-lg border border-[#e5e5e5]">{people.map((person) => <div key={person.id} className="flex items-center gap-3 border-b border-[#ededed] px-4 py-3.5 last:border-0 hover:bg-[#fafafa]"><span className="grid size-8 place-items-center rounded-full bg-[#111] text-[10px] font-medium text-white">{person.initials}</span><div className="min-w-0 flex-1"><p className="truncate text-[11.5px] font-medium">{person.name}</p><p className="truncate text-[10px] text-[#888]">{person.email}</p></div><span className="rounded bg-[#f0f0f0] px-2 py-1 text-[9px] font-medium text-[#666]">{roleLabel[person.role] ?? person.role}</span><span className="hidden w-28 text-right text-[9.5px] text-[#999] sm:block">{person.role === "client" ? "Portal isolado" : `${person._count.teams} times · ${person._count.cards} tarefas`}</span></div>)}</div></section>;
}

type ClientWithPortalData = {
  id: string; name: string; initials: string; status: string;
  linkTree: { id: string } | null;
  _count: { cards: number; products: number };
};

function ClientAreasTab({ clients, readyCount }: { clients: ClientWithPortalData[]; readyCount: number }) {
  return <section>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-[15px] font-semibold tracking-[-.02em]">Área dos clientes</h2><p className="mt-1 max-w-[620px] text-[11px] leading-5 text-[#888]">Gerencie o ambiente individual que cada cliente receberá para acompanhar demandas, arquivos e aprovações.</p></div><div className="flex items-center gap-2 text-[10px] text-[#777]"><CircleCheck className="size-3.5" />{readyCount} áreas com conteúdo preparado</div></div>
    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {clients.map((client) => {
        const ready = Boolean(client.linkTree || client._count.products > 0);
        return <article key={client.id} className="group rounded-lg border border-[#e4e4e4] bg-white p-4 transition-[border-color,box-shadow] hover:border-[#c8c8c8] hover:shadow-e2">
          <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-md border border-[#e3e3e3] bg-[#f8f8f8] text-[10px] font-semibold">{client.initials}</span><div className="min-w-0 flex-1"><h3 className="truncate text-[12px] font-medium">{client.name}</h3><div className="mt-1 flex items-center gap-1.5 text-[9.5px] text-[#888]"><span className={cn("size-1.5 rounded-full", client.status === "ATIVO" ? "bg-[#333]" : "bg-[#bbb]")} />{client.status === "ATIVO" ? "Cliente ativo" : "Contrato encerrado"}</div></div><span className={cn("rounded px-2 py-1 text-[8.5px] font-medium uppercase tracking-[.06em]", ready ? "bg-[#eaeaea] text-[#444]" : "border border-[#e5e5e5] text-[#999]")}>{ready ? "Preparada" : "Configurar"}</span></div>
          <div className="mt-5 grid grid-cols-2 border-y border-[#ededed] py-3"><div><span className="block text-[16px] font-semibold tabular">{client._count.cards}</span><span className="text-[9px] text-[#999]">Demandas</span></div><div className="border-l border-[#ededed] pl-4"><span className="block text-[16px] font-semibold tabular">{client._count.products}</span><span className="text-[9px] text-[#999]">Produtos</span></div></div>
          <Link href="/clientes" className="mt-3 flex h-8 items-center justify-between rounded-md px-2 text-[10.5px] font-medium text-[#555] hover:bg-[#f3f3f3] hover:text-[#111]">Gerenciar informações <ArrowUpRight className="size-3.5" /></Link>
        </article>;
      })}
    </div>
  </section>;
}

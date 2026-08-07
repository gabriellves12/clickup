"use client";

import * as React from "react";
import {
  ArrowUpRight, CalendarDays, Check, ChevronDown, CircleDollarSign,
  Columns3, Filter, LayoutDashboard, MoreHorizontal, Plus, Search,
  Sparkles, Target, UsersRound,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/primitives";

type View = "pipeline" | "overview";
type Lead = {
  id: string;
  name: string;
  company: string;
  value: string;
  source: string;
  initials: string;
  avatarKey: string;
  age: string;
  note?: string;
};

const stages: { id: string; title: string; caption: string; leads: Lead[] }[] = [
  {
    id: "new", title: "Novos leads", caption: "Primeiro contato", leads: [
      { id: "1", name: "Marina Costa", company: "Costa Arquitetura", value: "R$ 4.800", source: "Indicação", initials: "MC", avatarKey: "av-1", age: "há 18 min", note: "Quer campanha de lançamento." },
      { id: "2", name: "Rafael Moraes", company: "Estúdio Vértice", value: "R$ 2.400", source: "Instagram", initials: "RM", avatarKey: "av-2", age: "há 2 h" },
      { id: "3", name: "Ana Beatriz", company: "Aurora Beauty", value: "R$ 6.000", source: "Site", initials: "AB", avatarKey: "av-3", age: "ontem" },
    ],
  },
  {
    id: "qualified", title: "Qualificados", caption: "Diagnóstico agendado", leads: [
      { id: "4", name: "Caio Nunes", company: "Nunes & Filhos", value: "R$ 8.500", source: "Indicação", initials: "CN", avatarKey: "av-4", age: "há 1 d", note: "Reunião de briefing às 14h." },
      { id: "5", name: "Clara Lima", company: "Clara Store", value: "R$ 3.200", source: "Evento", initials: "CL", avatarKey: "av-5", age: "há 2 d" },
    ],
  },
  {
    id: "proposal", title: "Proposta enviada", caption: "Em decisão", leads: [
      { id: "6", name: "Diego Pires", company: "Viva Solar", value: "R$ 12.000", source: "Site", initials: "DP", avatarKey: "av-1", age: "há 3 d", note: "Aguardando retorno do financeiro." },
      { id: "7", name: "Júlia Martins", company: "Maison 12", value: "R$ 5.900", source: "Instagram", initials: "JM", avatarKey: "av-2", age: "há 4 d" },
    ],
  },
  {
    id: "closing", title: "Fechamento", caption: "Contrato em curso", leads: [
      { id: "8", name: "Henrique Alves", company: "Atlas Contábil", value: "R$ 9.600", source: "Indicação", initials: "HA", avatarKey: "av-3", age: "há 5 d", note: "Aprovação final prevista para hoje." },
    ],
  },
];

const metrics = [
  { label: "Clientes fixos", value: "14", change: "Base ativa", detail: "Parcerias recorrentes", icon: UsersRound, tone: "dark" as const },
  { label: "Projetos freelancers ativos", value: "7", change: "Em andamento", detail: "Demandas fora da base fixa", icon: Target, tone: "light" as const },
  { label: "Próximas ações follow-up", value: "0", change: "Sem pendências", detail: "Cadências para retomar", icon: CalendarDays, tone: "light" as const },
  { label: "Propostas em fechamento", value: "0", change: "Em decisão", detail: "Propostas enviadas", icon: Sparkles, tone: "light" as const },
  { label: "Valores a fechar", value: "R$ 0", change: "Neste ciclo", detail: "Receita em negociação", icon: CircleDollarSign, tone: "light" as const },
  { label: "Projetos pausados", value: "0", change: "Sem bloqueios", detail: "Aguardando retomada", icon: MoreHorizontal, tone: "light" as const },
  { label: "Parcerias encerradas", value: "10", change: "Histórico", detail: "Ciclos concluídos", icon: Check, tone: "light" as const },
];

const monthData = [38, 48, 32, 61, 52, 77, 64, 91, 79, 88, 104, 86];
const months = ["Set", "Out", "Nov", "Dez", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago"];

export function CrmWorkspace() {
  const [view, setView] = React.useState<View>("pipeline");
  const [search, setSearch] = React.useState("");
  const [showOnlyPriority, setShowOnlyPriority] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [isLeadFormOpen, setLeadFormOpen] = React.useState(false);
  const query = search.trim().toLocaleLowerCase("pt-BR");
  const visibleStages = stages.map((stage) => ({
    ...stage,
    leads: stage.leads.filter((lead) => {
      const matches = !query || `${lead.name} ${lead.company} ${lead.source}`.toLocaleLowerCase("pt-BR").includes(query);
      return matches && (!showOnlyPriority || Boolean(lead.note));
    }),
  }));

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#fafafa] text-[#1a1a1a] scrollbar-clean">
      <header className="sticky top-0 z-20 border-b border-[#ebebeb] bg-white/95 px-5 py-4 backdrop-blur lg:px-8">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-[#999]">Admin · Comercial</p>
              <h1 className="mt-1 text-[25px] font-semibold tracking-[-.045em]">CRM</h1>
            </div>
            <span className="hidden h-9 w-px bg-[#ebebeb] sm:block" />
            <p className="hidden max-w-[250px] text-[11px] leading-4 text-[#777] lg:block">Um funil vivo para transformar conversas em novas parcerias.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLeadFormOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-accent px-3.5 text-[11px] font-medium text-[var(--accent-fg)] shadow-[0_1px_2px_rgba(0,0,0,.14)] transition-colors hover:bg-accent-2"
            >
              <Plus className="size-3.5" /> Novo lead
            </button>
            <button type="button" className="grid size-9 place-items-center rounded-md border border-[#e6e6e6] bg-white text-[#666] transition-colors hover:text-[#1a1a1a]" aria-label="Mais opções">
              <MoreHorizontal className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-5 pb-8 pt-5 lg:px-8">
        <div className="flex flex-col justify-between gap-3 border-b border-[#ebebeb] pb-3 sm:flex-row sm:items-center">
          <div className="inline-flex w-fit rounded-lg bg-[#eee] p-1">
            <ViewButton active={view === "pipeline"} onClick={() => setView("pipeline")} icon={Columns3}>Kanban de leads</ViewButton>
            <ViewButton active={view === "overview"} onClick={() => setView("overview")} icon={LayoutDashboard}>Visão de oportunidades</ViewButton>
          </div>
          <p className="text-[10px] text-[#999]">Atualizado agora · <span className="font-medium text-[#555]">Agosto 2026</span></p>
        </div>

        {view === "pipeline" ? (
          <section className="pt-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-[#777]"><span className="font-semibold text-[#1f1f1f]">8 oportunidades</span> em acompanhamento · R$ 52,4 mil em negociação</p>
              <div className="flex items-center gap-2">
                <label className="flex h-8 w-full items-center gap-2 rounded-md border border-[#e6e6e6] bg-white px-2.5 text-[#888] sm:w-[218px]">
                  <Search className="size-3.5" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar lead ou empresa" className="w-full bg-transparent text-[10.5px] text-[#333] outline-none placeholder:text-[#aaa]" />
                </label>
                <button
                  type="button"
                  onClick={() => setShowOnlyPriority((value) => !value)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[10.5px] transition-colors",
                    showOnlyPriority ? "border-accent bg-accent text-[var(--accent-fg)]" : "border-[#e6e6e6] bg-white text-[#555] hover:text-[#1a1a1a]",
                  )}
                >
                  <Filter className="size-3.5" /> Prioridade
                </button>
              </div>
            </div>

            <div className="grid min-w-[920px] grid-cols-4 gap-3 xl:min-w-0">
              {visibleStages.map((stage) => (
                <div key={stage.id} className="rounded-lg border border-[#e6e6e6] bg-[#f5f5f5]/70 p-2.5">
                  <div className="mb-3 flex items-start justify-between px-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-[#1a1a1a]" />
                        <h2 className="text-[11px] font-semibold tracking-[-.015em]">{stage.title}</h2>
                        <span className="grid size-4 place-items-center rounded bg-white text-[8.5px] font-medium text-[#777]">{stage.leads.length}</span>
                      </div>
                      <p className="mt-1 pl-4 text-[9px] text-[#999]">{stage.caption}</p>
                    </div>
                    <button type="button" className="text-[#999] hover:text-[#1a1a1a]" aria-label={`Opções em ${stage.title}`}><MoreHorizontal className="size-4" /></button>
                  </div>
                  <div className="grid gap-2">
                    {stage.leads.map((lead) => <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />)}
                    {stage.leads.length === 0 && <p className="rounded-md border border-dashed border-[#d9d9d9] py-7 text-center text-[9.5px] text-[#999]">Nenhum lead encontrado</p>}
                    <button type="button" onClick={() => setLeadFormOpen(true)} className="flex h-8 items-center gap-1.5 rounded-md px-2 text-[10px] text-[#888] transition-colors hover:bg-white hover:text-[#1a1a1a]"><Plus className="size-3.5" /> Adicionar oportunidade</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : <OpportunityDashboard />}
      </div>

      {selectedLead && <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />}
      {isLeadFormOpen && <NewLeadDialog onClose={() => setLeadFormOpen(false)} />}
    </main>
  );
}

function ViewButton({ active, icon: Icon, children, onClick }: { active: boolean; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[10.5px] font-medium transition-all",
        active ? "bg-white text-[#1a1a1a] shadow-[0_1px_2px_rgba(0,0,0,.09)]" : "text-[#777] hover:text-[#1a1a1a]",
      )}
    >
      <Icon className="size-3.5" />{children}
    </button>
  );
}

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-md border border-[#e6e6e6] bg-white p-3 text-left shadow-[0_1px_1px_rgba(0,0,0,.025)] transition-all hover:-translate-y-px hover:border-[#c8c8c8] hover:shadow-[0_5px_12px_rgba(0,0,0,.06)]"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[9px] text-[#999]">{lead.age}</span>
        <MoreHorizontal className="size-3.5 text-[#bbb] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <Avatar initials={lead.initials} colorKey={lead.avatarKey} size="sm" className="border-0" />
        <div className="min-w-0">
          <h3 className="truncate text-[11px] font-semibold tracking-[-.015em] text-[#282826]">{lead.name}</h3>
          <p className="truncate text-[9.5px] text-[#8a8a8a]">{lead.company}</p>
        </div>
      </div>
      {lead.note && (
        <p className="mt-3 border-l-2 border-[#1a1a1a] pl-2 text-[9.5px] leading-4 text-[#666]">{lead.note}</p>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-[#f2f2f2] pt-2.5">
        <span className="text-[10px] font-semibold tabular text-[#1f1f1f]">{lead.value}</span>
        <span className="rounded-full bg-[#f2f2f2] px-1.5 py-0.5 text-[8.5px] font-medium text-[#777]">{lead.source}</span>
      </div>
    </button>
  );
}

function OpportunityDashboard() {
  const funnel = [
    { label: "Novos leads",       count: 24, rate: 100 },
    { label: "Qualificados",      count: 15, rate: 63  },
    { label: "Proposta enviada",  count: 9,  rate: 38  },
    { label: "Vendas fechadas",   count: 7,  rate: 29  },
  ];
  const sales = [
    { name: "Núcleo Orla",    value: "R$ 8.500", date: "Hoje",   initials: "NO", avatarKey: "av-1" },
    { name: "Fluxo Imóveis",  value: "R$ 6.000", date: "06 Ago", initials: "FI", avatarKey: "av-2" },
    { name: "Ateliê Nara",    value: "R$ 4.200", date: "03 Ago", initials: "AN", avatarKey: "av-3" },
  ];

  return (
    <section className="space-y-4 pt-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        <DonutPanel
          title="Visão geral"
          subtitle="Distribuição de projetos e parcerias"
          total="49"
          segments={[{ label: "Clientes fixos", value: 14, shade: "#1a1a1a" }, { label: "Freelancers", value: 7, shade: "#515151" }, { label: "Encerrados", value: 10, shade: "#838383" }, { label: "Projetos concluídos", value: 18, shade: "#b1b1b1" }]}
        />
        <DonutPanel
          title="Fixos / freelancers em atividade"
          subtitle="Composição da operação atual"
          total="21"
          segments={[{ label: "Fixos", value: 11, shade: "#1a1a1a" }, { label: "Freelancers", value: 10, shade: "#999999" }]}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <RankingPanel title="Principais indicadores" subtitle="Projetos em atividade por cliente" values={[{ label: "Evelin Braga", value: 5 }, { label: "João Benigal", value: 2 }, { label: "Filipe Jorge", value: 2 }, { label: "André M. (PA)", value: 1 }, { label: "Zanelli", value: 1 }, { label: "Gabriel Sales", value: 1 }]} />
        <RankingPanel title="Valores indicadores" subtitle="Receita estimada por parceria" money values={[{ label: "Filipe Jorge", value: 9200 }, { label: "Evelin Braga", value: 6400 }, { label: "João Menna", value: 5800 }, { label: "João Benigal", value: 5200 }, { label: "Gabriel Sales", value: 4700 }, { label: "Zanelli", value: 4300 }]} />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_.9fr]">
        <section className="rounded-lg border border-[#e6e6e6] bg-white">
          <div className="flex items-start justify-between border-b border-[#ececec] p-4">
            <div>
              <h2 className="text-[12px] font-semibold">Receita de novas vendas</h2>
              <p className="mt-1 text-[10px] text-[#888]">Contratos fechados nos últimos 12 meses</p>
            </div>
            <button type="button" className="inline-flex items-center gap-1 rounded-md border border-[#e6e6e6] px-2 py-1 text-[9.5px] text-[#666]">Últimos 12 meses <ChevronDown className="size-3" /></button>
          </div>
          <div className="p-5">
            <div className="flex h-[216px] items-end gap-2">
              {monthData.map((value, index) => (
                <div key={months[index]} className="group flex h-full min-w-0 flex-1 flex-col justify-end">
                  <div className="relative flex flex-1 items-end">
                    <div
                      className={cn(
                        "w-full rounded-t-[3px] transition-all",
                        index === 10 ? "bg-[#1a1a1a] group-hover:bg-[#000]" : "bg-[#d4d4d4] group-hover:bg-[#a3a3a3]",
                      )}
                      style={{ height: `${value}%` }}
                    >
                      <span className="absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[8px] text-white group-hover:block">R$ {(value * 220).toLocaleString("pt-BR")}</span>
                    </div>
                  </div>
                  <span className={cn("mt-2 text-center text-[8.5px]", index === 10 ? "font-semibold text-[#1a1a1a]" : "text-[#999]")}>{months[index]}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#ececec] pt-3">
              <p className="text-[10px] text-[#777]">Acumulado no período <b className="ml-1 text-[#252523]">R$ 153.600</b></p>
              <span className="inline-flex items-center gap-1 text-[9px] font-medium text-[#333]"><ArrowUpRight className="size-3" /> 24% vs. período anterior</span>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#1a1a1a] bg-[#1a1a1a] p-5 text-white">
          <p className="text-[9px] font-medium uppercase tracking-[.16em] text-white/60">Meta do mês</p>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[28px] font-semibold tracking-[-.06em]">R$ 18,7k</p>
              <p className="mt-1 text-[10px] text-white/60">de R$ 25 mil planejados</p>
            </div>
            <span className="rounded-full bg-white/15 px-2 py-1 text-[9px] font-semibold text-white">75%</span>
          </div>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-3/4 rounded-full bg-white" />
          </div>
          <div className="mt-7 border-t border-white/10 pt-4">
            <p className="text-[10px] font-medium">Próximo melhor passo</p>
            <p className="mt-1.5 text-[10px] leading-4 text-white/65">Há <b className="font-medium text-white">R$ 27,5 mil</b> em propostas para retomar nesta semana.</p>
            <button type="button" className="mt-4 inline-flex items-center gap-1 text-[10px] font-medium text-white/75 hover:text-white">Ver oportunidades <ArrowUpRight className="size-3" /></button>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_.9fr]">
        <section className="rounded-lg border border-[#e6e6e6] bg-white">
          <div className="flex items-center justify-between border-b border-[#ececec] p-4">
            <div>
              <h2 className="text-[12px] font-semibold">Conversão por etapa</h2>
              <p className="mt-1 text-[10px] text-[#888]">Do primeiro contato ao contrato</p>
            </div>
            <span className="text-[10px] text-[#777]">24 oportunidades</span>
          </div>
          <div className="space-y-4 p-5">
            {funnel.map((item, index) => (
              <div key={item.label} className="grid grid-cols-[126px_1fr_50px] items-center gap-3">
                <span className="text-[10px] text-[#555]">{item.label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-[#efefef]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.rate}%`,
                      background: `hsl(0 0% ${Math.max(12, 30 + index * 16)}%)`,
                    }}
                  />
                </div>
                <span className="text-right text-[10px] tabular text-[#555]">{item.count} <em className="not-italic text-[#999]">· {item.rate}%</em></span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-[#e6e6e6] bg-white">
          <div className="flex items-center justify-between border-b border-[#ececec] p-4">
            <div>
              <h2 className="text-[12px] font-semibold">Vendas recentes</h2>
              <p className="mt-1 text-[10px] text-[#888]">Novas parcerias confirmadas</p>
            </div>
            <button type="button" className="text-[10px] font-medium text-[#1a1a1a] hover:text-black">Ver todas</button>
          </div>
          <div className="divide-y divide-[#f2f2f2]">
            {sales.map((sale) => (
              <div key={sale.name} className="flex items-center gap-3 px-4 py-3.5">
                <Avatar initials={sale.initials} colorKey={sale.avatarKey} size="sm" className="border-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] font-medium">{sale.name}</p>
                  <p className="mt-0.5 text-[9px] text-[#999]">Contrato ativado · {sale.date}</p>
                </div>
                <b className="text-[10.5px] tabular">{sale.value}</b>
                <Check className="size-3.5 text-[#555]" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function MetricCard({ label, value, change, detail, icon: Icon, tone }: (typeof metrics)[number]) {
  const palette = tone === "dark"
    ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
    : "bg-white text-[#1a1a1a] border-[#e6e6e6]";
  return (
    <section className={cn("relative overflow-hidden rounded-lg border p-4", palette)}>
      <Icon className="absolute right-3 top-3 size-4 opacity-40" />
      <p className="text-[9.5px] font-medium uppercase tracking-[.11em] opacity-70">{label}</p>
      <p className="mt-3 text-[24px] font-semibold tracking-[-.055em] tabular">{value}</p>
      <div className={cn("mt-3 flex items-center justify-between gap-2 border-t pt-2.5", tone === "dark" ? "border-white/15" : "border-[#efefef]")}>
        <span className="text-[9.5px] font-medium">{change}</span>
        <span className="truncate text-[9px] opacity-65">{detail}</span>
      </div>
    </section>
  );
}

function DonutPanel({ title, subtitle, total, segments }: { title: string; subtitle: string; total: string; segments: { label: string; value: number; shade: string }[] }) {
  const sum = segments.reduce((value, segment) => value + segment.value, 0);
  const gradient = segments.reduce<{ cursor: number; parts: string[] }>((state, segment) => {
    const next = state.cursor + (segment.value / sum) * 100;
    return { cursor: next, parts: [...state.parts, `${segment.shade} ${state.cursor}% ${next}%`] };
  }, { cursor: 0, parts: [] }).parts.join(", ");
  return <section className="rounded-lg border border-[#e6e6e6] bg-white"><div className="border-b border-[#ececec] px-4 py-3.5"><h2 className="text-[12px] font-semibold">{title}</h2><p className="mt-1 text-[10px] text-[#888]">{subtitle}</p></div><div className="flex flex-col items-center gap-5 p-5 sm:flex-row sm:justify-center"><div className="relative grid size-[142px] place-items-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}><div className="grid size-[88px] place-items-center rounded-full bg-white text-center"><b className="text-[25px] font-semibold tracking-[-.06em] tabular">{total}</b><span className="-mt-1 text-[8px] uppercase tracking-[.1em] text-[#999]">Total</span></div></div><div className="grid min-w-[180px] gap-2">{segments.map((segment) => <div key={segment.label} className="flex items-center justify-between gap-4 text-[10px]"><span className="inline-flex items-center gap-2 text-[#666]"><i className="size-2 rounded-full" style={{ background: segment.shade }} />{segment.label}</span><b className="tabular text-[#333]">{segment.value}</b></div>)}</div></div></section>;
}

function RankingPanel({ title, subtitle, values, money = false }: { title: string; subtitle: string; values: { label: string; value: number }[]; money?: boolean }) {
  const max = Math.max(...values.map((item) => item.value), 1);
  const format = (value: number) => money ? `R$ ${value.toLocaleString("pt-BR")}` : String(value);
  return <section className="rounded-lg border border-[#e6e6e6] bg-white"><div className="border-b border-[#ececec] px-4 py-3.5"><h2 className="text-[12px] font-semibold">{title}</h2><p className="mt-1 text-[10px] text-[#888]">{subtitle}</p></div><div className="grid gap-3 p-5">{values.map((item, index) => <div key={item.label} className="grid grid-cols-[105px_1fr_58px] items-center gap-3"><span className="truncate text-[9.5px] text-[#666]">{item.label}</span><div className="h-5 overflow-hidden rounded-sm bg-[#f1f1f1]"><div className="h-full rounded-sm bg-[#1a1a1a]" style={{ width: `${Math.max((item.value / max) * 100, 4)}%`, opacity: 1 - index * 0.1 }} /></div><b className="text-right text-[9.5px] tabular text-[#333]">{format(item.value)}</b></div>)}</div></section>;
}

function LeadDrawer({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/20 p-3 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes de ${lead.name}`}
      onMouseDown={onClose}
    >
      <aside
        className="h-full w-full max-w-[390px] rounded-lg bg-white shadow-[0_14px_44px_rgba(0,0,0,.2)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#ececec] p-4">
          <p className="text-[10px] font-medium uppercase tracking-[.13em] text-[#888]">Oportunidade</p>
          <button type="button" onClick={onClose} className="grid size-7 place-items-center rounded-md text-[#777] hover:bg-[#f2f2f2]">×</button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3">
            <Avatar initials={lead.initials} colorKey={lead.avatarKey} size="md" className="border-0" />
            <div>
              <h2 className="text-[17px] font-semibold tracking-[-.04em]">{lead.name}</h2>
              <p className="mt-0.5 text-[10.5px] text-[#888]">{lead.company}</p>
            </div>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-[#e6e6e6] bg-[#e6e6e6]">
            <Info label="Potencial" value={lead.value} />
            <Info label="Origem" value={lead.source} />
            <Info label="Etapa" value="Em negociação" />
            <Info label="Último contato" value={lead.age} />
          </div>
          <div className="mt-6">
            <p className="text-[9px] font-semibold uppercase tracking-[.13em] text-[#888]">Próxima ação</p>
            <div className="mt-2 flex items-start gap-2 rounded-md bg-[#f5f5f5] p-3 text-[10.5px] leading-4 text-[#555]">
              <CalendarDays className="mt-0.5 size-3.5 shrink-0" />
              {lead.note ?? "Registrar um próximo contato para manter essa oportunidade em movimento."}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-7 inline-flex h-9 w-full items-center justify-center rounded-md bg-accent text-[10.5px] font-medium text-[var(--accent-fg)] hover:bg-accent-2"
          >
            Editar oportunidade
          </button>
        </div>
      </aside>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-3">
      <p className="text-[8.5px] uppercase tracking-[.1em] text-[#999]">{label}</p>
      <p className="mt-1 text-[10.5px] font-medium text-[#333]">{value}</p>
    </div>
  );
}

function NewLeadDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/25 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label="Novo lead"
      onMouseDown={onClose}
    >
      <form
        className="w-full max-w-[410px] rounded-lg bg-white p-5 shadow-[0_16px_48px_rgba(0,0,0,.22)]"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => { event.preventDefault(); onClose(); }}
      >
        <p className="text-[9px] font-medium uppercase tracking-[.15em] text-[#888]">CRM</p>
        <h2 className="mt-1 text-[19px] font-semibold tracking-[-.04em]">Adicionar novo lead</h2>
        <div className="mt-5 grid gap-3">
          <FormField label="Nome" placeholder="Nome do contato" />
          <FormField label="Empresa" placeholder="Nome da empresa" />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Potencial" placeholder="R$ 0,00" />
            <FormField label="Origem" placeholder="Ex: Indicação" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-8 rounded-md px-3 text-[10.5px] text-[#666] hover:bg-[#f2f2f2]">Cancelar</button>
          <button type="submit" className="h-8 rounded-md bg-accent px-3 text-[10.5px] font-medium text-[var(--accent-fg)] hover:bg-accent-2">Criar oportunidade</button>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="grid gap-1.5 text-[10px] font-medium text-[#666]">
      {label}
      <input placeholder={placeholder} className="h-8 rounded-md border border-[#e6e6e6] px-2.5 text-[10.5px] outline-none placeholder:text-[#bbb] focus:border-accent" />
    </label>
  );
}

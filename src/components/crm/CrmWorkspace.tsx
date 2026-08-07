"use client";

import * as React from "react";
import {
  ArrowUpRight, CalendarDays, Check, ChevronDown, CircleDollarSign,
  Columns3, Filter, LayoutDashboard, MoreHorizontal, Plus, Search,
  Sparkles, Target, UsersRound,
} from "lucide-react";
import { cn } from "@/lib/cn";

type View = "pipeline" | "overview";
type Lead = {
  id: string;
  name: string;
  company: string;
  value: string;
  source: string;
  initials: string;
  avatar: string;
  age: string;
  note?: string;
};

const stages: { id: string; title: string; caption: string; accent: string; leads: Lead[] }[] = [
  {
    id: "new", title: "Novos leads", caption: "Primeiro contato", accent: "bg-[#171717]", leads: [
      { id: "1", name: "Marina Costa", company: "Costa Arquitetura", value: "R$ 4.800", source: "Indicação", initials: "MC", avatar: "bg-[#d9e8e5] text-[#206252]", age: "há 18 min", note: "Quer campanha de lançamento." },
      { id: "2", name: "Rafael Moraes", company: "Estúdio Vértice", value: "R$ 2.400", source: "Instagram", initials: "RM", avatar: "bg-[#e7e2d7] text-[#765b26]", age: "há 2 h" },
      { id: "3", name: "Ana Beatriz", company: "Aurora Beauty", value: "R$ 6.000", source: "Site", initials: "AB", avatar: "bg-[#e7e1ed] text-[#63457a]", age: "ontem" },
    ],
  },
  {
    id: "qualified", title: "Qualificados", caption: "Diagnóstico agendado", accent: "bg-[#3c735f]", leads: [
      { id: "4", name: "Caio Nunes", company: "Nunes & Filhos", value: "R$ 8.500", source: "Indicação", initials: "CN", avatar: "bg-[#dce8f5] text-[#255980]", age: "há 1 d", note: "Reunião de briefing às 14h." },
      { id: "5", name: "Clara Lima", company: "Clara Store", value: "R$ 3.200", source: "Evento", initials: "CL", avatar: "bg-[#f1dfdc] text-[#8b453a]", age: "há 2 d" },
    ],
  },
  {
    id: "proposal", title: "Proposta enviada", caption: "Em decisão", accent: "bg-[#b06d25]", leads: [
      { id: "6", name: "Diego Pires", company: "Viva Solar", value: "R$ 12.000", source: "Site", initials: "DP", avatar: "bg-[#d9e8e5] text-[#206252]", age: "há 3 d", note: "Aguardando retorno do financeiro." },
      { id: "7", name: "Júlia Martins", company: "Maison 12", value: "R$ 5.900", source: "Instagram", initials: "JM", avatar: "bg-[#e7e1ed] text-[#63457a]", age: "há 4 d" },
    ],
  },
  {
    id: "closing", title: "Fechamento", caption: "Contrato em curso", accent: "bg-[#6c526d]", leads: [
      { id: "8", name: "Henrique Alves", company: "Atlas Contábil", value: "R$ 9.600", source: "Indicação", initials: "HA", avatar: "bg-[#dce8f5] text-[#255980]", age: "há 5 d", note: "Aprovação final prevista para hoje." },
    ],
  },
];

const metrics = [
  { label: "Pipeline aberto", value: "R$ 52,4 mil", change: "+12,5%", detail: "8 oportunidades ativas", icon: CircleDollarSign, tone: "dark" },
  { label: "Oportunidades", value: "24", change: "+4 esta semana", detail: "Ticket médio R$ 5,8 mil", icon: Target, tone: "green" },
  { label: "Novas vendas", value: "R$ 18,7 mil", change: "+28,1%", detail: "3 contratos neste mês", icon: Sparkles, tone: "amber" },
  { label: "Conversão", value: "31,2%", change: "+3,8 p.p.", detail: "Meta mensal: 30%", icon: UsersRound, tone: "violet" },
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
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#f5f5f3] text-[#1b1b1a] scrollbar-clean">
      <header className="sticky top-0 z-20 border-b border-[#dededb] bg-[#fbfbf9]/95 px-5 py-4 backdrop-blur lg:px-8">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-[#7c7c78]">Admin · Comercial</p>
              <h1 className="mt-1 text-[25px] font-semibold tracking-[-.045em]">CRM</h1>
            </div>
            <span className="hidden h-9 w-px bg-[#dededb] sm:block" />
            <p className="hidden max-w-[250px] text-[11px] leading-4 text-[#777773] lg:block">Um funil vivo para transformar conversas em novas parcerias.</p>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setLeadFormOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#1c1c1a] px-3.5 text-[11px] font-medium text-white shadow-[0_2px_5px_rgba(0,0,0,.12)] transition-transform hover:-translate-y-px">
              <Plus className="size-3.5" /> Novo lead
            </button>
            <button type="button" className="grid size-9 place-items-center rounded-md border border-[#dfdfdc] bg-white text-[#6b6b67] transition-colors hover:text-[#171717]" aria-label="Mais opções">
              <MoreHorizontal className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-5 pb-8 pt-5 lg:px-8">
        <div className="flex flex-col justify-between gap-3 border-b border-[#dededb] pb-3 sm:flex-row sm:items-center">
          <div className="inline-flex w-fit rounded-lg bg-[#eaeae7] p-1">
            <ViewButton active={view === "pipeline"} onClick={() => setView("pipeline")} icon={Columns3}>Kanban de leads</ViewButton>
            <ViewButton active={view === "overview"} onClick={() => setView("overview")} icon={LayoutDashboard}>Visão de oportunidades</ViewButton>
          </div>
          <p className="text-[10px] text-[#898984]">Atualizado agora · <span className="font-medium text-[#4f4f4b]">Agosto 2026</span></p>
        </div>

        {view === "pipeline" ? (
          <section className="pt-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-[#72726e]"><span className="font-semibold text-[#20201e]">8 oportunidades</span> em acompanhamento · R$ 52,4 mil em negociação</p>
              <div className="flex items-center gap-2">
                <label className="flex h-8 w-full items-center gap-2 rounded-md border border-[#dededb] bg-white px-2.5 text-[#888883] sm:w-[218px]">
                  <Search className="size-3.5" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar lead ou empresa" className="w-full bg-transparent text-[10.5px] text-[#333] outline-none placeholder:text-[#9b9b96]" />
                </label>
                <button type="button" onClick={() => setShowOnlyPriority((value) => !value)} className={cn("inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[10.5px] transition-colors", showOnlyPriority ? "border-[#1d1d1b] bg-[#1d1d1b] text-white" : "border-[#dededb] bg-white text-[#5f5f5a]") }>
                  <Filter className="size-3.5" /> Prioridade
                </button>
              </div>
            </div>

            <div className="grid min-w-[920px] grid-cols-4 gap-3 xl:min-w-0">
              {visibleStages.map((stage) => (
                <div key={stage.id} className="rounded-lg border border-[#dfdfdc] bg-[#ededeb]/70 p-2.5">
                  <div className="mb-3 flex items-start justify-between px-1">
                    <div>
                      <div className="flex items-center gap-2"><span className={cn("size-2 rounded-full", stage.accent)} /><h2 className="text-[11px] font-semibold tracking-[-.015em]">{stage.title}</h2><span className="grid size-4 place-items-center rounded bg-white text-[8.5px] font-medium text-[#777772]">{stage.leads.length}</span></div>
                      <p className="mt-1 pl-4 text-[9px] text-[#8a8a85]">{stage.caption}</p>
                    </div>
                    <button type="button" className="text-[#969690] hover:text-[#262624]" aria-label={`Opções em ${stage.title}`}><MoreHorizontal className="size-4" /></button>
                  </div>
                  <div className="grid gap-2">
                    {stage.leads.map((lead) => <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />)}
                    {stage.leads.length === 0 && <p className="rounded-md border border-dashed border-[#d4d4d0] py-7 text-center text-[9.5px] text-[#969690]">Nenhum lead encontrado</p>}
                    <button type="button" onClick={() => setLeadFormOpen(true)} className="flex h-8 items-center gap-1.5 rounded-md px-2 text-[10px] text-[#888883] transition-colors hover:bg-white hover:text-[#20201e]"><Plus className="size-3.5" /> Adicionar oportunidade</button>
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
  return <button type="button" onClick={onClick} className={cn("inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[10.5px] font-medium transition-all", active ? "bg-white text-[#1f1f1d] shadow-[0_1px_2px_rgba(0,0,0,.09)]" : "text-[#797975] hover:text-[#333330]")}><Icon className="size-3.5" />{children}</button>;
}

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="group w-full rounded-md border border-[#e0e0dd] bg-white p-3 text-left shadow-[0_1px_1px_rgba(0,0,0,.025)] transition-all hover:-translate-y-px hover:border-[#c9c9c4] hover:shadow-[0_5px_12px_rgba(0,0,0,.06)]">
    <div className="flex items-start justify-between gap-2"><span className="text-[9px] text-[#969690]">{lead.age}</span><MoreHorizontal className="size-3.5 text-[#aaa9a4] opacity-0 transition-opacity group-hover:opacity-100" /></div>
    <div className="mt-1.5 flex items-center gap-2"><span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-[8px] font-semibold", lead.avatar)}>{lead.initials}</span><div className="min-w-0"><h3 className="truncate text-[11px] font-semibold tracking-[-.015em] text-[#282826]">{lead.name}</h3><p className="truncate text-[9.5px] text-[#898984]">{lead.company}</p></div></div>
    {lead.note && <p className="mt-3 border-l-2 border-[#d6a364] pl-2 text-[9.5px] leading-4 text-[#696963]">{lead.note}</p>}
    <div className="mt-3 flex items-center justify-between border-t border-[#efefed] pt-2.5"><span className="text-[10px] font-semibold tabular text-[#292927]">{lead.value}</span><span className="rounded-full bg-[#f1f1ee] px-1.5 py-0.5 text-[8.5px] font-medium text-[#777772]">{lead.source}</span></div>
  </button>;
}

function OpportunityDashboard() {
  return <section className="space-y-4 pt-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</div>
    <div className="grid gap-4 xl:grid-cols-[1.55fr_.9fr]">
      <section className="rounded-lg border border-[#dfdfdc] bg-white">
        <div className="flex items-start justify-between border-b border-[#e7e7e3] p-4"><div><h2 className="text-[12px] font-semibold">Receita de novas vendas</h2><p className="mt-1 text-[10px] text-[#85857f]">Contratos fechados nos últimos 12 meses</p></div><button type="button" className="inline-flex items-center gap-1 rounded-md border border-[#e1e1de] px-2 py-1 text-[9.5px] text-[#656560]">Últimos 12 meses <ChevronDown className="size-3" /></button></div>
        <div className="p-5"><div className="flex h-[216px] items-end gap-2">{monthData.map((value, index) => <div key={months[index]} className="group flex h-full min-w-0 flex-1 flex-col justify-end"><div className="relative flex flex-1 items-end"><div className={cn("w-full rounded-t-[3px] transition-all group-hover:bg-[#436e5e]", index === 10 ? "bg-[#1f4e40]" : "bg-[#9eb9ae]")} style={{ height: `${value}%` }}><span className="absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#1e1e1c] px-1.5 py-0.5 text-[8px] text-white group-hover:block">R$ {(value * 220).toLocaleString("pt-BR")}</span></div></div><span className={cn("mt-2 text-center text-[8.5px]", index === 10 ? "font-semibold text-[#1f1f1d]" : "text-[#989892]")}>{months[index]}</span></div>)}</div><div className="mt-4 flex items-center justify-between border-t border-[#ededeb] pt-3"><p className="text-[10px] text-[#777772]">Acumulado no período <b className="ml-1 text-[#252523]">R$ 153.600</b></p><span className="inline-flex items-center gap-1 text-[9px] font-medium text-[#34705a]"><ArrowUpRight className="size-3" /> 24% vs. período anterior</span></div></div>
      </section>
      <section className="rounded-lg border border-[#dfdfdc] bg-[#20211f] p-5 text-white"><p className="text-[9px] font-medium uppercase tracking-[.16em] text-[#b8beb8]">Meta do mês</p><div className="mt-4 flex items-end justify-between"><div><p className="text-[28px] font-semibold tracking-[-.06em]">R$ 18,7k</p><p className="mt-1 text-[10px] text-[#b7bbb5]">de R$ 25 mil planejados</p></div><span className="rounded-full bg-[#9dc8b2] px-2 py-1 text-[9px] font-semibold text-[#163a2c]">75%</span></div><div className="mt-6 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full w-3/4 rounded-full bg-[#9dc8b2]" /></div><div className="mt-7 border-t border-white/10 pt-4"><p className="text-[10px] font-medium">Próximo melhor passo</p><p className="mt-1.5 text-[10px] leading-4 text-[#b7bbb5]">Há <b className="font-medium text-white">R$ 27,5 mil</b> em propostas para retomar nesta semana.</p><button type="button" className="mt-4 inline-flex items-center gap-1 text-[10px] font-medium text-[#b5ddc4] hover:text-white">Ver oportunidades <ArrowUpRight className="size-3" /></button></div></section>
    </div>
    <div className="grid gap-4 xl:grid-cols-[1fr_.9fr]">
      <section className="rounded-lg border border-[#dfdfdc] bg-white"><div className="flex items-center justify-between border-b border-[#e7e7e3] p-4"><div><h2 className="text-[12px] font-semibold">Conversão por etapa</h2><p className="mt-1 text-[10px] text-[#85857f]">Do primeiro contato ao contrato</p></div><span className="text-[10px] text-[#777772]">24 oportunidades</span></div><div className="space-y-4 p-5">{[{ label: "Novos leads", count: 24, rate: 100, color: "bg-[#1e1e1c]" }, { label: "Qualificados", count: 15, rate: 63, color: "bg-[#4b7b68]" }, { label: "Proposta enviada", count: 9, rate: 38, color: "bg-[#c58840]" }, { label: "Vendas fechadas", count: 7, rate: 29, color: "bg-[#745c76]" }].map((item) => <div key={item.label} className="grid grid-cols-[126px_1fr_50px] items-center gap-3"><span className="text-[10px] text-[#656560]">{item.label}</span><div className="h-2 overflow-hidden rounded-full bg-[#eeeeeb]"><div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.rate}%` }} /></div><span className="text-right text-[10px] tabular text-[#555550]">{item.count} <em className="not-italic text-[#9b9b96]">· {item.rate}%</em></span></div>)}</div></section>
      <section className="rounded-lg border border-[#dfdfdc] bg-white"><div className="flex items-center justify-between border-b border-[#e7e7e3] p-4"><div><h2 className="text-[12px] font-semibold">Vendas recentes</h2><p className="mt-1 text-[10px] text-[#85857f]">Novas parcerias confirmadas</p></div><button type="button" className="text-[10px] font-medium text-[#3c735f] hover:text-[#1f513f]">Ver todas</button></div><div className="divide-y divide-[#efefec]">{[{ name: "Núcleo Orla", value: "R$ 8.500", date: "Hoje", initials: "NO", color: "bg-[#d9e8e5] text-[#206252]" }, { name: "Fluxo Imóveis", value: "R$ 6.000", date: "06 Ago", initials: "FI", color: "bg-[#e7e2d7] text-[#765b26]" }, { name: "Ateliê Nara", value: "R$ 4.200", date: "03 Ago", initials: "AN", color: "bg-[#e7e1ed] text-[#63457a]" }].map((sale) => <div key={sale.name} className="flex items-center gap-3 px-4 py-3.5"><span className={cn("grid size-7 place-items-center rounded-full text-[8px] font-semibold", sale.color)}>{sale.initials}</span><div className="min-w-0 flex-1"><p className="text-[10.5px] font-medium">{sale.name}</p><p className="mt-0.5 text-[9px] text-[#92928d]">Contrato ativado · {sale.date}</p></div><b className="text-[10.5px] tabular">{sale.value}</b><Check className="size-3.5 text-[#47846d]" /></div>)}</div></section>
    </div>
  </section>;
}

function MetricCard({ label, value, change, detail, icon: Icon, tone }: (typeof metrics)[number]) {
  const palette = { dark: "bg-[#242523] text-white", green: "bg-[#e2eee8] text-[#224d3c]", amber: "bg-[#f4eadb] text-[#79501d]", violet: "bg-[#ece5ee] text-[#5c4160]" }[tone];
  return <section className={cn("relative overflow-hidden rounded-lg p-4", palette)}><Icon className="absolute right-3 top-3 size-4 opacity-35" /><p className="text-[9.5px] font-medium uppercase tracking-[.11em] opacity-70">{label}</p><p className="mt-3 text-[24px] font-semibold tracking-[-.055em] tabular">{value}</p><div className="mt-3 flex items-center justify-between gap-2 border-t border-current/10 pt-2.5"><span className="text-[9.5px] font-medium">{change}</span><span className="truncate text-[9px] opacity-65">{detail}</span></div></section>;
}

function LeadDrawer({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex justify-end bg-black/20 p-3 backdrop-blur-[1px]" role="dialog" aria-modal="true" aria-label={`Detalhes de ${lead.name}`} onMouseDown={onClose}><aside className="h-full w-full max-w-[390px] rounded-lg bg-white shadow-[0_14px_44px_rgba(0,0,0,.2)]" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-[#e8e8e5] p-4"><p className="text-[10px] font-medium uppercase tracking-[.13em] text-[#80807a]">Oportunidade</p><button type="button" onClick={onClose} className="grid size-7 place-items-center rounded-md text-[#777] hover:bg-[#f1f1ee]">×</button></div><div className="p-5"><div className="flex items-center gap-3"><span className={cn("grid size-11 place-items-center rounded-full text-[12px] font-semibold", lead.avatar)}>{lead.initials}</span><div><h2 className="text-[17px] font-semibold tracking-[-.04em]">{lead.name}</h2><p className="mt-0.5 text-[10.5px] text-[#85857f]">{lead.company}</p></div></div><div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-[#e5e5e1] bg-[#e5e5e1]"><Info label="Potencial" value={lead.value} /><Info label="Origem" value={lead.source} /><Info label="Etapa" value="Em negociação" /><Info label="Último contato" value={lead.age} /></div><div className="mt-6"><p className="text-[9px] font-semibold uppercase tracking-[.13em] text-[#8b8b85]">Próxima ação</p><div className="mt-2 flex items-start gap-2 rounded-md bg-[#f4f0e9] p-3 text-[10.5px] leading-4 text-[#5e5649]"><CalendarDays className="mt-0.5 size-3.5 shrink-0" />{lead.note ?? "Registrar um próximo contato para manter essa oportunidade em movimento."}</div></div><button type="button" onClick={onClose} className="mt-7 inline-flex h-9 w-full items-center justify-center rounded-md bg-[#1d1d1b] text-[10.5px] font-medium text-white">Editar oportunidade</button></div></aside></div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="bg-white p-3"><p className="text-[8.5px] uppercase tracking-[.1em] text-[#91918b]">{label}</p><p className="mt-1 text-[10.5px] font-medium text-[#33332f]">{value}</p></div>; }

function NewLeadDialog({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/25 p-4 backdrop-blur-[1px]" role="dialog" aria-modal="true" aria-label="Novo lead" onMouseDown={onClose}><form className="w-full max-w-[410px] rounded-lg bg-white p-5 shadow-[0_16px_48px_rgba(0,0,0,.22)]" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); onClose(); }}><p className="text-[9px] font-medium uppercase tracking-[.15em] text-[#7e7e78]">CRM</p><h2 className="mt-1 text-[19px] font-semibold tracking-[-.04em]">Adicionar novo lead</h2><div className="mt-5 grid gap-3"><FormField label="Nome" placeholder="Nome do contato" /><FormField label="Empresa" placeholder="Nome da empresa" /><div className="grid grid-cols-2 gap-3"><FormField label="Potencial" placeholder="R$ 0,00" /><FormField label="Origem" placeholder="Ex: Indicação" /></div></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="h-8 rounded-md px-3 text-[10.5px] text-[#666] hover:bg-[#f2f2ef]">Cancelar</button><button type="submit" className="h-8 rounded-md bg-[#1e1e1c] px-3 text-[10.5px] font-medium text-white">Criar oportunidade</button></div></form></div>;
}

function FormField({ label, placeholder }: { label: string; placeholder: string }) { return <label className="grid gap-1.5 text-[10px] font-medium text-[#62625d]">{label}<input placeholder={placeholder} className="h-8 rounded-md border border-[#dfdfda] px-2.5 text-[10.5px] outline-none placeholder:text-[#aaa9a3] focus:border-[#5b5b56]" /></label>; }

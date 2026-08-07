import Link from "next/link";
import {
  AlertTriangle, ArrowUpRight, Blocks, CheckCircle2, Clock3, Gauge,
  Layers3, TimerReset, UsersRound, LineChart,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/current-user";
import { cn } from "@/lib/cn";
import { parsePeriod } from "./period";
import { FilterBar } from "./FilterBar";

const DAY = 86_400_000;
const finishedStatus = "FINALIZADO";
const approvalStatuses = new Set(["APROVACAO_INTERNA", "APROVACAO_CLIENTE"]);
const flowOrder = ["EM_PRODUCAO", "IMPLEMENTACAO", "OTIMIZACAO", "PROPAGACAO_DNS", "APROVACAO_INTERNA", "APROVACAO_CLIENTE", "ALTERACAO", "FINALIZADO"];
const flowLabels: Record<string, string> = {
  EM_PRODUCAO: "Em produção", IMPLEMENTACAO: "Implementação", OTIMIZACAO: "Otimização",
  PROPAGACAO_DNS: "Propagação DNS", APROVACAO_INTERNA: "Aprovação interna",
  APROVACAO_CLIENTE: "Aprovação cliente", ALTERACAO: "Alteração", FINALIZADO: "Finalizado",
};

type Tone = "ok" | "warn" | "bad" | "neutral";

const monthLabels = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export default async function DashboardPage({
  searchParams,
}: { searchParams: Promise<{ period?: string; ref?: string }> }) {
  await requireAdmin();

  const params = await searchParams;
  const range = parsePeriod(params);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Cards do período (para KPIs e listas) — filtrados por createdAt
  // + todos os cards do ano para o gráfico mensal
  const yearStart = new Date(range.ref.getFullYear(), 0, 1);
  const yearEnd = new Date(range.ref.getFullYear() + 1, 0, 1);

  const [periodCards, yearCards] = await Promise.all([
    prisma.card.findMany({
      where: { createdAt: { gte: range.start, lt: range.end } },
      include: { client: true, responsible: true, team: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.card.findMany({
      where: {
        OR: [
          { createdAt: { gte: yearStart, lt: yearEnd } },
          { updatedAt: { gte: yearStart, lt: yearEnd }, status: finishedStatus },
        ],
      },
      select: { createdAt: true, updatedAt: true, status: true },
    }),
  ]);

  // ---------- Agregações do período ----------
  const open: typeof periodCards = [];
  const finished: typeof periodCards = [];
  const overdue: typeof periodCards = [];
  const approvals: typeof periodCards = [];
  const blocked: typeof periodCards = [];
  const wip: typeof periodCards = [];
  const flowCounts = new Map<string, number>();
  const peopleStats = new Map<string, { person: (typeof periodCards)[number]["responsible"]; open: number; overdue: number; done: number }>();
  const clientsStats = new Map<string, { client: (typeof periodCards)[number]["client"]; total: number; open: number; overdue: number; approval: number; blocked: number }>();

  for (const card of periodCards) {
    const isFinished = card.status === finishedStatus;
    const isOverdue = !isFinished && Boolean(card.deadline && card.deadline < today);
    const isApproval = !isFinished && approvalStatuses.has(card.status);
    const isBlocked = !isFinished && card.pendenteMaterial;

    (isFinished ? finished : open).push(card);
    if (isOverdue) overdue.push(card);
    if (isApproval) approvals.push(card);
    if (isBlocked) blocked.push(card);
    if (!isFinished && ["EM_PRODUCAO", "IMPLEMENTACAO", "OTIMIZACAO"].includes(card.status)) wip.push(card);
    flowCounts.set(card.status, (flowCounts.get(card.status) ?? 0) + 1);

    const person = peopleStats.get(card.responsibleId) ?? { person: card.responsible, open: 0, overdue: 0, done: 0 };
    if (isFinished) person.done += 1; else person.open += 1;
    if (isOverdue) person.overdue += 1;
    peopleStats.set(card.responsibleId, person);

    const client = clientsStats.get(card.clientId) ?? { client: card.client, total: 0, open: 0, overdue: 0, approval: 0, blocked: 0 };
    client.total += 1;
    if (!isFinished) client.open += 1;
    if (isOverdue) client.overdue += 1;
    if (isApproval) client.approval += 1;
    if (isBlocked) client.blocked += 1;
    clientsStats.set(card.clientId, client);
  }

  const finishedWithDeadline = finished.filter((c) => c.deadline);
  const onTime = finishedWithDeadline.filter((c) => c.updatedAt <= c.deadline!).length;
  const onTimeRate = finishedWithDeadline.length ? Math.round((onTime / finishedWithDeadline.length) * 100) : 0;
  const averageCycle = finished.length
    ? finished.reduce((s, c) => s + Math.max(0, c.updatedAt.getTime() - c.createdAt.getTime()), 0) / finished.length / DAY
    : 0;

  const flow = flowOrder
    .map((status) => ({ status, label: flowLabels[status], count: flowCounts.get(status) ?? 0 }))
    .filter((item) => item.count > 0);
  const maxFlow = Math.max(1, ...flow.map((item) => item.count));

  const people = [...peopleStats.values()]
    .map(({ person, ...stats }) => ({ ...person, ...stats }))
    .sort((a, b) => b.open - a.open);
  const maxPersonLoad = Math.max(1, ...people.map((p) => p.open));

  const clientStats = [...clientsStats.values()]
    .map(({ client, ...stats }) => ({ ...client, ...stats }))
    .sort((a, b) => b.open - a.open);

  const critical = [...overdue]
    .sort((a, b) => (a.deadline?.getTime() ?? 0) - (b.deadline?.getTime() ?? 0))
    .slice(0, 6);

  // ---------- Chart mensal (12 meses do ano da referência) ----------
  const monthlyBuckets = Array.from({ length: 12 }, () => ({ created: 0, finished: 0 }));
  for (const c of yearCards) {
    if (c.createdAt >= yearStart && c.createdAt < yearEnd) {
      monthlyBuckets[c.createdAt.getMonth()].created += 1;
    }
    if (c.status === finishedStatus && c.updatedAt >= yearStart && c.updatedAt < yearEnd) {
      monthlyBuckets[c.updatedAt.getMonth()].finished += 1;
    }
  }
  const maxMonthly = Math.max(1, ...monthlyBuckets.flatMap((b) => [b.created, b.finished]));
  const currentMonthIdx = today.getFullYear() === range.ref.getFullYear() ? today.getMonth() : -1;

  // ---------- KPIs com semáforo ----------
  const onTimeTone: Tone = finishedWithDeadline.length === 0
    ? "neutral"
    : onTimeRate >= 85 ? "ok" : onTimeRate >= 65 ? "warn" : "bad";

  const overdueTone: Tone = overdue.length === 0 ? "ok" : overdue.length <= 3 ? "warn" : "bad";
  const blockedTone: Tone = blocked.length === 0 ? "ok" : blocked.length <= 2 ? "warn" : "bad";
  const cycleTone: Tone = finished.length === 0 ? "neutral" : averageCycle <= 5 ? "ok" : averageCycle <= 10 ? "warn" : "bad";
  const approvalsTone: Tone = approvals.length === 0 ? "neutral" : approvals.length <= 5 ? "ok" : approvals.length <= 10 ? "warn" : "bad";

  const kpis = [
    { label: "Entregas no prazo", value: `${onTimeRate}%`, detail: `${onTime} de ${finishedWithDeadline.length} entregas`, icon: CheckCircle2, tone: onTimeTone },
    { label: "Demandas atrasadas", value: overdue.length, detail: `${open.length} tarefas em aberto`, icon: AlertTriangle, tone: overdueTone },
    { label: "Tempo médio", value: `${averageCycle.toFixed(1)}d`, detail: "Criação até finalização", icon: Clock3, tone: cycleTone },
    { label: "Trabalho em andamento", value: wip.length, detail: "Produção e implementação", icon: Layers3, tone: "neutral" as Tone },
    { label: "Aguardando aprovação", value: approvals.length, detail: "Interna ou cliente", icon: TimerReset, tone: approvalsTone },
    { label: "Materiais pendentes", value: blocked.length, detail: "Demandas bloqueadas", icon: Blocks, tone: blockedTone },
  ];

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#f7f7f7]">
      <header className="border-b border-[#e5e5e5] bg-white px-6 py-5 lg:px-9">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[.15em] text-[#999]">Admin · Inteligência operacional</p>
              <h1 className="mt-2 text-[24px] font-semibold tracking-[-.035em]">Dashboard de Dados</h1>
              <p className="mt-1 text-[11px] text-[#888]">Filtre por dia, semana, mês ou ano — exporte um CSV para análise.</p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-[9px] uppercase tracking-[.1em] text-[#aaa]">Atualizado em</p>
              <p className="mt-1 text-[11px] font-medium tabular">
                {now.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          <FilterBar range={range} />
        </div>
      </header>

      <div className="mx-auto max-w-[1480px] space-y-4 p-5 lg:p-7">
        {/* KPIs */}
        <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
          {kpis.map(({ label, value, detail, icon: Icon, tone }) => <KpiCard key={label} label={label} value={value} detail={detail} Icon={Icon} tone={tone} />)}
        </section>

        {/* Gráfico anual em barras por mês */}
        <Panel title={`Volume por mês — ${range.ref.getFullYear()}`} subtitle="Demandas criadas × finalizadas ao longo do ano" icon={LineChart}>
          <div className="p-5">
            <div className="flex h-[220px] items-end gap-2">
              {monthlyBuckets.map((bucket, idx) => {
                const isCurrent = idx === currentMonthIdx;
                const isSelected = range.kind === "month" && range.ref.getMonth() === idx;
                return (
                  <Link
                    key={idx}
                    href={`/dashboard?period=month&ref=${range.ref.getFullYear()}-${String(idx + 1).padStart(2, "0")}-01`}
                    scroll={false}
                    className={cn(
                      "group flex h-full min-w-0 flex-1 flex-col justify-end rounded-md px-1 pt-2 transition-colors no-underline hover:no-underline hover:bg-[#f4f4f4]",
                      isSelected && "bg-[#f0f0f0]",
                    )}
                    aria-label={`Ver ${monthLabels[idx]} ${range.ref.getFullYear()}`}
                  >
                    <div className="flex flex-1 items-end justify-center gap-1">
                      <div
                        title={`${bucket.created} criadas`}
                        className={cn("w-[38%] min-w-[6px] rounded-t-sm transition-colors", isSelected ? "bg-[#111]" : "bg-[#222] group-hover:bg-[#111]")}
                        style={{ height: `${(bucket.created / maxMonthly) * 100}%` }}
                      />
                      <div
                        title={`${bucket.finished} finalizadas`}
                        className="w-[38%] min-w-[6px] rounded-t-sm bg-[color:var(--success)] opacity-70 group-hover:opacity-100 transition-opacity"
                        style={{ height: `${(bucket.finished / maxMonthly) * 100}%` }}
                      />
                    </div>
                    <span className={cn(
                      "mt-2 truncate text-center text-[9px] tabular",
                      isSelected ? "font-semibold text-[#111]" : "text-[#888]",
                      isCurrent && "text-[#111]",
                    )}>
                      {monthLabels[idx]}
                    </span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-end gap-4 border-t border-[#eee] pt-3 text-[10px] text-[#666]">
              <span className="inline-flex items-center gap-1.5"><i className="size-2 bg-[#222]" /> Criadas</span>
              <span className="inline-flex items-center gap-1.5"><i className="size-2 bg-[color:var(--success)] opacity-70" /> Finalizadas</span>
              <span className="text-[#aaa]">Clique num mês para filtrar</span>
            </div>
          </div>
        </Panel>

        {/* Fluxo operacional */}
        <section className="grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
          <Panel title="Fluxo operacional" subtitle="Distribuição atual das demandas" icon={Gauge}>
            <div className="space-y-3 p-4">
              {flow.length === 0 && <p className="p-8 text-center text-[10px] text-[#999]">Sem demandas criadas neste período.</p>}
              {flow.map((item) => {
                const isFin = item.status === finishedStatus;
                const isCritical = item.status === "ALTERACAO";
                const barClass = isFin
                  ? "bg-[color:var(--success)]/70"
                  : isCritical
                    ? "bg-[color:var(--warning)]"
                    : "bg-[#222]";
                return (
                  <div key={item.status} className="grid grid-cols-[128px_1fr_28px] items-center gap-3">
                    <span className="truncate text-[10px] text-[#666]">{item.label}</span>
                    <div className="h-5 overflow-hidden rounded-sm bg-[#f0f0f0]">
                      <div className={cn("h-full transition-all", barClass)} style={{ width: `${Math.max(item.count ? 6 : 0, (item.count / maxFlow) * 100)}%` }} />
                    </div>
                    <b className="text-right text-[10.5px] tabular">{item.count}</b>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Capacidade da equipe" subtitle="Tarefas abertas por responsável" icon={UsersRound}>
            {people.length === 0 && <p className="p-8 text-center text-[10px] text-[#999]">Sem responsáveis atribuídos neste período.</p>}
            <div className="divide-y divide-[#ededed]">
              {people.map((person) => {
                const overdueTone: Tone = person.overdue === 0 ? "ok" : person.overdue <= 2 ? "warn" : "bad";
                return (
                  <div key={person.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#222] text-[8px] font-medium text-white">{person.initials}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <b className="truncate text-[11px] font-medium">{person.name}</b>
                        <span className="text-[9.5px] tabular text-[#777]">{person.open} abertas</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#eee]">
                        <div className="h-full rounded-full bg-[#333]" style={{ width: `${(person.open / maxPersonLoad) * 100}%` }} />
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <b className={cn("block text-[10.5px] tabular", toneToText(overdueTone))}>{person.overdue}</b>
                      <span className="text-[8.5px] text-[#999]">atrasadas</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </section>

        {/* Saúde clientes */}
        <Panel title="Saúde dos clientes" subtitle="Volume, atraso e dependências" icon={UsersRound}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead className="border-b border-[#e8e8e8] bg-[#fafafa] text-[8.5px] uppercase tracking-[.07em] text-[#999]">
                <tr>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-3 py-3 text-right font-medium">Abertas</th>
                  <th className="px-3 py-3 text-right font-medium">Atrasadas</th>
                  <th className="px-3 py-3 text-right font-medium">Aprovação</th>
                  <th className="px-4 py-3 text-right font-medium">Bloqueadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ededed]">
                {clientStats.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[10.5px] text-[#999]">Nenhum cliente com atividade no período.</td></tr>
                )}
                {clientStats.map((client) => {
                  const overdueTone: Tone = client.overdue === 0 ? "ok" : client.overdue <= 2 ? "warn" : "bad";
                  const blockedTone: Tone = client.blocked === 0 ? "ok" : client.blocked <= 1 ? "warn" : "bad";
                  return (
                    <tr key={client.id} className="text-[10.5px] hover:bg-[#fafafa]">
                      <td className="px-4 py-3">
                        <span className="mr-2 inline-grid size-5 place-items-center rounded bg-[#eee] text-[7px] font-semibold">{client.initials}</span>
                        <b className="font-medium">{client.name}</b>
                      </td>
                      <td className="px-3 py-3 text-right tabular">{client.open}</td>
                      <td className={cn("px-3 py-3 text-right tabular", toneToText(overdueTone))}>{client.overdue}</td>
                      <td className="px-3 py-3 text-right tabular">{client.approval}</td>
                      <td className={cn("px-4 py-3 text-right tabular", toneToText(blockedTone))}>{client.blocked}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Demandas críticas */}
        <Panel title="Demandas críticas" subtitle="Atrasadas que exigem atenção imediata" icon={AlertTriangle}>
          {critical.length ? (
            <div className="grid gap-px bg-[#ededed] md:grid-cols-2 xl:grid-cols-3">
              {critical.map((card) => (
                <Link key={card.id} href={`/board/${card.team.slug}`} className="group flex items-center gap-3 bg-white p-4 hover:bg-[#fafafa]">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md border border-[#ddd] bg-[#f7f7f7] text-[8px] font-semibold">{card.client.initials}</span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[11px] font-medium">{card.title}</b>
                    <small className="mt-1 block text-[9px] text-[color:var(--danger)]">
                      {card.client.name} · {daysLate(card.deadline!, today)} dias em atraso
                    </small>
                  </span>
                  <ArrowUpRight className="size-3.5 text-[#aaa] group-hover:text-[#222]" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="p-8 text-center text-[10.5px] text-[#999]">Nenhuma demanda atrasada no período.</p>
          )}
        </Panel>

        <p className="px-1 pb-2 text-[9px] leading-4 text-[#999]">
          Tempo médio e entregas no prazo usam <code>createdAt</code>, <code>updatedAt</code> e o prazo atual das demandas do período selecionado.
        </p>
      </div>
    </main>
  );
}

/* ------------------------------ pieces ------------------------------ */

function KpiCard({
  label, value, detail, Icon, tone,
}: {
  label: string;
  value: string | number;
  detail: string;
  Icon: typeof CheckCircle2;
  tone: Tone;
}) {
  const dot = tone === "ok" ? "bg-[color:var(--success)]"
            : tone === "warn" ? "bg-[color:var(--warning)]"
            : tone === "bad" ? "bg-[color:var(--danger)]"
            : "bg-[#ddd]";
  const ring = tone === "ok" ? "before:bg-[color:var(--success)]"
             : tone === "warn" ? "before:bg-[color:var(--warning)]"
             : tone === "bad" ? "before:bg-[color:var(--danger)]"
             : "before:bg-transparent";
  return (
    <article
      className={cn(
        "relative rounded-lg border border-[#e2e2e2] bg-white p-4 overflow-hidden",
        "before:absolute before:inset-y-0 before:left-0 before:w-[3px]",
        ring,
      )}
    >
      <div className="flex items-center justify-between">
        <Icon className="size-3.5 text-[#666]" strokeWidth={1.6} />
        <span className={cn("inline-block size-2 rounded-full", dot)} aria-hidden />
      </div>
      <strong className="mt-6 block text-[24px] font-semibold tabular tracking-[-.035em]">{value}</strong>
      <p className="mt-1 text-[10.5px] font-medium text-[#333]">{label}</p>
      <p className="mt-0.5 text-[9.5px] text-[#999]">{detail}</p>
    </article>
  );
}

function toneToText(tone: Tone): string {
  if (tone === "ok") return "text-[color:var(--success)]";
  if (tone === "warn") return "text-[color:var(--warning)]";
  if (tone === "bad") return "text-[color:var(--danger)]";
  return "text-[#333]";
}

function Panel({ title, subtitle, icon: Icon, children }: {
  title: string; subtitle: string; icon: typeof Gauge; children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#e2e2e2] bg-white">
      <header className="flex h-12 items-center gap-2.5 border-b border-[#e9e9e9] px-4">
        <Icon className="size-3.5 text-[#777]" strokeWidth={1.6} />
        <div>
          <h2 className="text-[11px] font-semibold">{title}</h2>
          <p className="text-[9px] text-[#999]">{subtitle}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function daysLate(deadline: Date, today: Date) {
  return Math.max(1, Math.floor((today.getTime() - deadline.getTime()) / DAY));
}

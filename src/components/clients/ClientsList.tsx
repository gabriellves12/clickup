"use client";

import * as React from "react";
import { Avatar, Badge } from "@/components/ui/primitives";
import { ClientQuickView } from "./ClientQuickView";
import { cn } from "@/lib/cn";
import type { ClientRow } from "@/lib/clients-data";

type Filters = {
  status: "TODOS" | "ATIVO" | "ENCERRADO";
  tipos: Array<"FIXO" | "FREELA">;
  query: string;
};

const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
function formatDate(iso: string | null) {
  if (!iso) return "—";
  return fmt.format(new Date(iso));
}

export function ClientsList({ clients, canViewCredentials }: { clients: ClientRow[]; canViewCredentials: boolean }) {
  const [filters, setFilters] = React.useState<Filters>({ status: "ATIVO", tipos: [], query: "" });
  const [openId, setOpenId] = React.useState<string | null>(null);
  const opened = openId ? clients.find((c) => c.id === openId) ?? null : null;

  const filtered = React.useMemo(() => {
    return clients.filter((c) => {
      if (filters.status !== "TODOS" && c.status !== filters.status) return false;
      if (filters.tipos.length && !filters.tipos.includes(c.tipoContrato)) return false;
      if (filters.query && !c.name.toLowerCase().includes(filters.query.toLowerCase())) return false;
      return true;
    });
  }, [clients, filters]);

  const counts = React.useMemo(() => ({
    TODOS: clients.length,
    ATIVO: clients.filter((c) => c.status === "ATIVO").length,
    ENCERRADO: clients.filter((c) => c.status === "ENCERRADO").length,
  }), [clients]);

  return (
    <div className="grid gap-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex bg-surface-2 rounded-full p-1 gap-0.5">
          {(["ATIVO","ENCERRADO","TODOS"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilters({ ...filters, status: s })}
              className={cn(
                "h-8 px-3.5 rounded-full text-[12.5px] font-medium tracking-tight inline-flex items-center gap-1.5 transition-colors",
                filters.status === s ? "bg-text text-[var(--accent-fg)]" : "text-text-2 hover:text-text",
              )}
            >
              {s === "TODOS" ? "Todos" : s === "ATIVO" ? "Ativos" : "Encerrados"}
              <span className={cn(
                "text-[10px] tabular font-semibold rounded-full px-1.5 py-[1px]",
                filters.status === s ? "bg-white/22 text-[var(--accent-fg)]" : "bg-surface text-text-3",
              )}>
                {counts[s]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {(["FIXO","FREELA"] as const).map((t) => {
            const on = filters.tipos.includes(t);
            return (
              <button
                key={t}
                onClick={() => setFilters({
                  ...filters,
                  tipos: on ? filters.tipos.filter((x) => x !== t) : [...filters.tipos, t],
                })}
                className={cn(
                  "h-8 px-3 rounded-full text-[12px] font-medium tracking-tight border transition-colors",
                  on
                    ? "bg-text/6 text-text border-border-strong"
                    : "bg-transparent text-text-3 border-border hover:text-text hover:border-border-strong",
                )}
              >
                {t === "FIXO" ? "Fixo" : "Freela"}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center h-8 px-3 rounded-md bg-surface-2 text-[12px] text-text-2 min-w-[220px]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-3.5 mr-2 text-text-3">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            placeholder="Buscar cliente"
            className="bg-transparent outline-none flex-1 text-[12.5px] placeholder:text-text-3"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="border border-border rounded-xl overflow-hidden bg-surface">
        <div className="overflow-x-auto scrollbar-clean">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-[0.08em] text-text-3 bg-surface-2">
                <th className="font-medium px-4 py-3">Cliente</th>
                <th className="font-medium px-3 py-3">Contrato</th>
                <th className="font-medium px-3 py-3">Status</th>
                <th className="font-medium px-3 py-3">Responsáveis</th>
                <th className="font-medium px-3 py-3 text-right tabular">Em aberto</th>
                <th className="font-medium px-3 py-3 text-right tabular">Atrasadas</th>
                <th className="font-medium px-4 py-3">Início</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-3 text-[12.5px]">
                    Nenhum cliente para os filtros atuais.
                  </td>
                </tr>
              )}
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setOpenId(c.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenId(c.id); } }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Abrir detalhes de ${c.name}`}
                  className="border-t border-hairline hover:bg-surface-2/60 transition-colors cursor-pointer focus:outline-none focus:bg-surface-2/60"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar size="md" initials={c.initials} colorKey="av-5" className="border-0" />
                      <div>
                        <div className="text-[13px] font-medium tracking-tight text-text">{c.name}</div>
                        <div className="text-[10.5px] text-text-3">{c.totalCards} tasks no histórico</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <ContratoBadge value={c.tipoContrato} />
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge value={c.status} />
                  </td>
                  <td className="px-3 py-3">
                    <StackedAvatars people={c.responsibles} />
                  </td>
                  <td className="px-3 py-3 text-right tabular text-[13px]">{c.openCount}</td>
                  <td className="px-3 py-3 text-right tabular text-[13px]">
                    {c.overdueCount > 0
                      ? <span className="text-danger font-medium">{c.overdueCount}</span>
                      : <span className="text-text-3">0</span>}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-text-2 tabular">{formatDate(c.startDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ClientQuickView
        client={opened}
        open={!!opened}
        onOpenChange={(v) => { if (!v) setOpenId(null); }}
        canViewCredentials={canViewCredentials}
      />
    </div>
  );
}

function ContratoBadge({ value }: { value: "FIXO" | "FREELA" }) {
  return (
    <Badge
      className={cn(
        "border !bg-transparent",
        value === "FIXO"
          ? "text-text border-border-strong"
          : "text-text-2 border-border",
      )}
    >
      {value === "FIXO" ? "Fixo" : "Freela"}
    </Badge>
  );
}

function StatusBadge({ value }: { value: "ATIVO" | "ENCERRADO" }) {
  if (value === "ATIVO") {
    return (
      <span className="inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full text-[11px] font-medium bg-success/15 text-success">
        <span className="size-1.5 rounded-full bg-current" /> Ativo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full text-[11px] font-medium bg-surface-2 text-text-3">
      <span className="size-1.5 rounded-full bg-current" /> Encerrado
    </span>
  );
}

function StackedAvatars({ people }: { people: { id: string; initials: string; color: string; name: string }[] }) {
  if (people.length === 0) return <span className="text-[11.5px] text-text-3">—</span>;
  const show = people.slice(0, 4);
  const rest = people.length - show.length;
  return (
    <div className="inline-flex items-center">
      {show.map((p) => (
        <span key={p.id} title={p.name} className="-ml-1.5 first:ml-0">
          <Avatar size="sm" initials={p.initials} colorKey={p.color} />
        </span>
      ))}
      {rest > 0 && (
        <span className="-ml-1.5 grid place-items-center size-[22px] rounded-full bg-surface-2 border-[1.5px] border-surface text-[10px] font-semibold text-text-2">
          +{rest}
        </span>
      )}
    </div>
  );
}

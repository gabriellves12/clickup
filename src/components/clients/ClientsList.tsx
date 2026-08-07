"use client";

import * as React from "react";
import { Avatar, Badge } from "@/components/ui/primitives";
import { ClientQuickView } from "./ClientQuickView";
import { CategoryIcon } from "@/components/icons";
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

export function ClientsList({ clients, canViewCredentials, canManageLinks, canViewWhatsapp }: { clients: ClientRow[]; canViewCredentials: boolean; canManageLinks: boolean; canViewWhatsapp: boolean }) {
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

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface py-14 text-center text-[12.5px] text-text-3">Nenhum cliente para os filtros atuais.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((client) => <ClientCard key={client.id} client={client} onOpen={() => setOpenId(client.id)} />)}
        </div>
      )}

      <ClientQuickView
        client={opened}
        open={!!opened}
        onOpenChange={(v) => { if (!v) setOpenId(null); }}
        canViewCredentials={canViewCredentials}
        canManageLinks={canManageLinks}
        canViewWhatsapp={canViewWhatsapp}
      />
    </div>
  );
}

const resourceSlots = [
  { category: "figma", label: "Figma" },
  { category: "drive", label: "Drive" },
  { category: "photos", label: "Fotos" },
  { category: "product", label: "Produtos" },
] as const;

function ClientCard({ client, onOpen }: { client: ClientRow; onOpen: () => void }) {
  const count = (category: string) => client.links.filter((link) => link.category === category).length;
  const wordpress = count("wordpress");
  const otherAccesses = client.links.filter((link) => ["cloudflare", "hosting", "custom"].includes(link.category)).length;

  return (
    <button type="button" onClick={onOpen} className="group flex min-h-[278px] flex-col rounded-xl border border-border bg-surface p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,.02)] transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[0_10px_24px_rgba(20,30,48,.08)] focus:outline-none focus:ring-2 focus:ring-text/20">
      <div className="flex items-start gap-3">
        <Avatar size="lg" initials={client.initials} colorKey="av-5" className="!size-11 border-0 text-[13px]" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2"><h2 className="truncate text-[14px] font-semibold tracking-tight text-text">{client.name}</h2><StatusBadge value={client.status} /></div>
          <div className="mt-1 flex items-center gap-2"><ContratoBadge value={client.tipoContrato} /><span className="text-[9.5px] text-text-3">Desde {formatDate(client.startDate)}</span></div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {resourceSlots.map(({ category, label }) => {
          const total = count(category);
          return <div key={category} className={cn("rounded-md border px-1.5 py-2", total ? "border-border bg-surface-2 text-text" : "border-hairline bg-surface text-text-3")}><CategoryIcon category={category} className="size-3.5" /><span className="mt-1.5 block text-[9px] font-medium leading-none">{label}</span><span className="mt-1 block text-[10px] font-semibold tabular">{total}</span></div>;
        })}
      </div>

      <div className={cn("mt-3 flex items-center gap-2 rounded-lg border px-2.5 py-2", wordpress ? "border-[#d7e3f0] bg-[#f4f8fc] text-[#405d80]" : "border-hairline bg-surface-2/50 text-text-3")}>
        <span className={cn("grid size-6 place-items-center rounded-md", wordpress ? "bg-[#e3edf7]" : "bg-surface")}><CategoryIcon category="wordpress" className="size-3.5" /></span>
        <span className="flex-1 text-[10px] font-medium">WordPress</span>
        <span className="text-[10px] font-semibold tabular">{wordpress ? `${wordpress} acesso${wordpress === 1 ? "" : "s"}` : "Sem acesso"}</span>
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <div><div className="text-[9px] text-text-3">Responsáveis</div><div className="mt-1"><StackedAvatars people={client.responsibles} /></div></div>
        <div className="text-right"><span className="block text-[10px] font-semibold tabular text-text">{client.openCount} em aberto</span><span className={cn("mt-1 block text-[9px]", client.overdueCount ? "font-medium text-danger" : "text-text-3")}>{client.overdueCount ? `${client.overdueCount} atrasada${client.overdueCount === 1 ? "" : "s"}` : `${otherAccesses} outros acessos`}</span></div>
      </div>
    </button>
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

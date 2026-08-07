"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { CardLite, FlowColumnDef } from "./types";

type SortKey = "title" | "client" | "responsible" | "stage" | "deadline";
type SortDir = "asc" | "desc";

function stageColors(tone: string | null | undefined) {
  switch (tone) {
    case "doing":  return "bg-accent/12 text-accent";
    case "review": return "bg-[color:var(--warning)]/15 text-[color:var(--warning)]";
    case "done":   return "bg-[color:var(--success)]/15 text-[color:var(--success)]";
    case "warn":   return "bg-[color:var(--warning)]/15 text-[color:var(--warning)]";
    case "info":   return "bg-[color:var(--info)]/15 text-[color:var(--info)]";
    default:       return "bg-[#eee] text-[#666]";
  }
}

function deadlineText(iso: string | null): { label: string; tone: "muted" | "today" | "overdue" | "soon" } {
  if (!iso) return { label: "Sem prazo", tone: "muted" };
  const date = new Date(iso);
  const now = new Date();
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diff = Math.round((day - today) / 86400000);
  const short = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  if (diff < 0) return { label: `Atrasado (${short})`, tone: "overdue" };
  if (diff === 0) return { label: "Hoje", tone: "today" };
  if (diff === 1) return { label: "Amanhã", tone: "soon" };
  return { label: short, tone: "muted" };
}

export function BoardListView({
  cards, flow, onOpen,
}: { cards: CardLite[]; flow: FlowColumnDef[]; onOpen: (id: string) => void }) {
  const [sortKey, setSortKey] = React.useState<SortKey>("deadline");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");
  const stageMap = React.useMemo(
    () => new Map(flow.map((s) => [s.key, s])),
    [flow],
  );

  const sorted = React.useMemo(() => {
    const list = [...cards];
    const factor = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      switch (sortKey) {
        case "title":       return a.title.localeCompare(b.title) * factor;
        case "client":      return a.client.name.localeCompare(b.client.name) * factor;
        case "responsible": return a.responsible.name.localeCompare(b.responsible.name) * factor;
        case "stage": {
          const oa = stageMap.get(a.status)?.order ?? 9999;
          const ob = stageMap.get(b.status)?.order ?? 9999;
          return (oa - ob) * factor;
        }
        case "deadline": {
          const da = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
          const db = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
          return (da - db) * factor;
        }
      }
    });
    return list;
  }, [cards, sortKey, sortDir, stageMap]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  return (
    <div className="h-full min-h-0 overflow-auto rounded-lg border border-[#e7e7e7] bg-white">
      <table className="w-full text-left text-[12px]">
        <thead className="sticky top-0 z-[1] bg-[#fafafa] border-b border-[#e8e8e8] text-[10px] uppercase tracking-[.06em] text-[#888]">
          <tr>
            <Th onClick={() => toggleSort("title")}       active={sortKey === "title"}       dir={sortDir} className="pl-4 pr-3">Demanda</Th>
            <Th onClick={() => toggleSort("client")}      active={sortKey === "client"}      dir={sortDir}>Cliente</Th>
            <Th onClick={() => toggleSort("responsible")} active={sortKey === "responsible"} dir={sortDir}>Responsável</Th>
            <Th onClick={() => toggleSort("stage")}       active={sortKey === "stage"}       dir={sortDir}>Etapa</Th>
            <Th onClick={() => toggleSort("deadline")}    active={sortKey === "deadline"}    dir={sortDir} className="pr-4">Prazo</Th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr><td colSpan={5} className="p-10 text-center text-[11px] text-text-3">Nenhuma demanda para os filtros atuais.</td></tr>
          )}
          {sorted.map((c) => {
            const stage = stageMap.get(c.status);
            const dl = deadlineText(c.deadline);
            return (
              <tr
                key={c.id}
                onClick={() => onOpen(c.id)}
                className="border-b border-[#f2f2f2] hover:bg-[#fafafa] cursor-pointer transition-colors"
              >
                <td className="pl-4 pr-3 py-2.5 max-w-[380px]">
                  <span className="block text-[12px] font-medium tracking-tight text-[#252525] truncate">
                    {c.title}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="text-[11px] text-[#555] truncate">{c.client.name}</span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5">
                    <Avatar size="sm" initials={c.responsible.initials} colorKey={c.responsible.color} className="border-0" />
                    <span className="text-[11px] text-[#555] truncate">{c.responsible.name}</span>
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={cn(
                    "inline-flex items-center h-5 px-1.5 rounded text-[9.5px] font-semibold uppercase tracking-[.04em]",
                    stageColors(stage?.tone),
                  )}>
                    {stage?.label ?? c.status}
                  </span>
                </td>
                <td className="pr-4 pl-3 py-2.5">
                  <span className={cn(
                    "inline-flex items-center gap-1 text-[10.5px] tabular",
                    dl.tone === "overdue" ? "text-[color:var(--danger-strong)] font-semibold"
                      : dl.tone === "today" ? "text-[color:var(--warning)]"
                      : dl.tone === "soon" ? "text-[#333]"
                      : "text-[#8a8a8a]",
                  )}>
                    <CalendarDays className="size-3" />
                    {dl.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children, onClick, active, dir, className,
}: { children: React.ReactNode; onClick: () => void; active: boolean; dir: SortDir; className?: string }) {
  return (
    <th className={cn("py-2.5 px-3 font-medium select-none", className)}>
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1 hover:text-[#333] transition-colors">
        {children}
        {active && <span aria-hidden className="text-[9px]">{dir === "asc" ? "↑" : "↓"}</span>}
      </button>
    </th>
  );
}

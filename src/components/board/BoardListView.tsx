"use client";

import * as React from "react";
import { AlertTriangle, CalendarDays } from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { PERSON_COLUMN_STATUS } from "@/lib/board-config";
import type { CardLite, FlowColumnDef, PersonLite } from "./types";

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

function deadlineText(iso: string | null, todayStart: Date): { label: string; tone: "muted" | "today" | "overdue" | "soon" } {
  if (!iso) return { label: "Sem prazo", tone: "muted" };
  const date = new Date(iso);
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const today = todayStart.getTime();
  const diff = Math.round((day - today) / 86400000);
  const short = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  if (diff < 0) return { label: `Atrasado (${short})`, tone: "overdue" };
  if (diff === 0) return { label: "Hoje", tone: "today" };
  if (diff === 1) return { label: "Amanhã", tone: "soon" };
  return { label: short, tone: "muted" };
}

function isPending(card: CardLite, todayStart: Date): boolean {
  if (card.status === "FINALIZADO") return false;
  if (card.pendenteMaterial) return true;
  if (!card.deadline) return false;
  return new Date(card.deadline) < todayStart;
}

type Group = {
  key: string;
  label: string;
  cards: CardLite[];
  isPending?: boolean;
  person?: PersonLite;
};

export function BoardListView({
  cards, flow, members, onOpen,
}: {
  cards: CardLite[];
  flow: FlowColumnDef[];
  members: PersonLite[];
  onOpen: (id: string) => void;
}) {
  const todayStart = React.useMemo(() => {
    const t = new Date(); t.setHours(0, 0, 0, 0); return t;
  }, []);

  const stageMap = React.useMemo(() => new Map(flow.map((s) => [s.key, s])), [flow]);

  const groups: Group[] = React.useMemo(() => {
    // Pendentes (lens — não excludente)
    const pendingCards = cards
      .filter((c) => isPending(c, todayStart))
      .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""));

    // Por pessoa (usa a ordem dos membros do board)
    const byPerson = new Map<string, CardLite[]>();
    for (const m of members) byPerson.set(m.id, []);
    for (const c of cards) {
      if (!byPerson.has(c.responsibleId)) byPerson.set(c.responsibleId, []);
      byPerson.get(c.responsibleId)!.push(c);
    }
    for (const [, list] of byPerson) {
      list.sort((a, b) => {
        // agrupa PERSON_COLUMN primeiro, depois por order de etapa, depois por deadline
        const aStage = a.status === PERSON_COLUMN_STATUS ? -1 : (stageMap.get(a.status)?.order ?? 9999);
        const bStage = b.status === PERSON_COLUMN_STATUS ? -1 : (stageMap.get(b.status)?.order ?? 9999);
        if (aStage !== bStage) return aStage - bStage;
        return (a.deadline ?? "").localeCompare(b.deadline ?? "");
      });
    }

    const personGroups: Group[] = members
      .map((p) => ({ key: `p::${p.id}`, label: p.name, person: p, cards: byPerson.get(p.id) ?? [] }))
      .filter((g) => g.cards.length > 0);

    return [
      { key: "pending", label: "Material Pendente", cards: pendingCards, isPending: true },
      ...personGroups,
    ];
  }, [cards, members, todayStart, stageMap]);

  const total = cards.length;
  const visibleGroups = groups.filter((g) => g.cards.length > 0);

  return (
    <div className="h-full min-h-0 overflow-auto rounded-lg border border-[#e7e7e7] bg-white scrollbar-clean">
      {total === 0 && (
        <div className="p-10 text-center text-[11px] text-text-3">Nenhuma demanda para os filtros atuais.</div>
      )}

      {visibleGroups.map((group, idx) => (
        <section key={group.key} className={cn("border-b border-[#f0f0f0] last:border-b-0", idx === 0 && "rounded-t-lg overflow-hidden")}>
          <header
            className={cn(
              "sticky top-0 z-[1] flex items-center gap-2 px-4 h-10 border-b",
              group.isPending
                ? "bg-[color:var(--danger-strong)]/8 border-[color:var(--danger-strong)]/25"
                : "bg-[#fafafa] border-[#eee]",
            )}
          >
            {group.isPending ? (
              <AlertTriangle className="size-3.5 text-[color:var(--danger-strong)]" strokeWidth={2} />
            ) : group.person ? (
              <Avatar size="sm" initials={group.person.initials} colorKey={group.person.color} className="border-0" />
            ) : null}
            <span
              className={cn(
                "text-[10.5px] font-semibold uppercase tracking-[.08em]",
                group.isPending ? "text-[color:var(--danger-strong)]" : "text-[#333]",
              )}
            >
              {group.label}
            </span>
            <span className="grid place-items-center min-w-5 h-5 px-1.5 rounded bg-white border border-[#e6e6e6] text-[9.5px] tabular text-[#666]">
              {group.cards.length}
            </span>
          </header>

          <table className="w-full text-left text-[12px]">
            <tbody>
              {group.cards.map((c) => {
                const stage = stageMap.get(c.status);
                const dl = deadlineText(c.deadline, todayStart);
                const pending = group.isPending || isPending(c, todayStart);
                return (
                  <tr
                    key={`${group.key}-${c.id}`}
                    onClick={() => onOpen(c.id)}
                    className={cn(
                      "border-b border-[#f5f5f5] last:border-b-0 hover:bg-[#fafafa] cursor-pointer transition-colors",
                      pending && group.isPending && "border-l-2 border-l-[color:var(--danger-strong)]",
                    )}
                  >
                    <td className="pl-4 pr-3 py-2.5 max-w-[420px]">
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
                      {c.status === PERSON_COLUMN_STATUS ? (
                        <span className="inline-flex items-center h-5 px-1.5 rounded text-[9.5px] font-semibold uppercase tracking-[.04em] bg-[#f0f0f0] text-[#666]">
                          Coluna da pessoa
                        </span>
                      ) : (
                        <span className={cn(
                          "inline-flex items-center h-5 px-1.5 rounded text-[9.5px] font-semibold uppercase tracking-[.04em]",
                          stageColors(stage?.tone),
                        )}>
                          {stage?.label ?? c.status}
                        </span>
                      )}
                    </td>
                    <td className="pr-4 pl-3 py-2.5 w-[180px]">
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
        </section>
      ))}
    </div>
  );
}

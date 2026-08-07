"use client";

import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Calendar, Check, ChevronDown, User, X } from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { FlowColumnDef, PersonLite } from "./types";

export type DatePreset = "all" | "today" | "week" | "month" | "overdue" | "no-deadline";

export type BoardFiltersState = {
  onlyMe: boolean;
  personIds: string[];  // vazio = todos
  statusKeys: string[]; // vazio = todos
  date: DatePreset;
};

export const emptyFilters: BoardFiltersState = {
  onlyMe: false, personIds: [], statusKeys: [], date: "all",
};

export function hasAnyFilter(f: BoardFiltersState): boolean {
  return f.onlyMe || f.personIds.length > 0 || f.statusKeys.length > 0 || f.date !== "all";
}

const DATE_LABELS: Record<DatePreset, string> = {
  all: "Data",
  today: "Hoje",
  week: "Esta semana",
  month: "Este mês",
  overdue: "Atrasadas",
  "no-deadline": "Sem prazo",
};

type Props = {
  filters: BoardFiltersState;
  onChange: (next: BoardFiltersState) => void;
  people: PersonLite[];
  flow: FlowColumnDef[];
  matchedCount: number;
  totalCount: number;
  currentUserIsResponsible: boolean;
};

export function BoardFilters({
  filters, onChange, people, flow, matchedCount, totalCount, currentUserIsResponsible,
}: Props) {
  const set = <K extends keyof BoardFiltersState>(key: K, value: BoardFiltersState[K]) =>
    onChange({ ...filters, [key]: value });

  const togglePerson = (id: string) => set("personIds",
    filters.personIds.includes(id) ? filters.personIds.filter((x) => x !== id) : [...filters.personIds, id]);
  const toggleStatus = (key: string) => set("statusKeys",
    filters.statusKeys.includes(key) ? filters.statusKeys.filter((x) => x !== key) : [...filters.statusKeys, key]);

  const isDirty = hasAnyFilter(filters);
  const dateLabel = filters.date === "all" ? "Data" : DATE_LABELS[filters.date];

  return (
    <div className="px-6 py-2.5 flex flex-wrap items-center gap-2 border-b border-[#f2f2f2] bg-[#fafafa]">
      {/* Somente eu */}
      <button
        type="button"
        onClick={() => set("onlyMe", !filters.onlyMe)}
        disabled={!currentUserIsResponsible && !filters.onlyMe}
        title={!currentUserIsResponsible ? "Você não é responsável por tarefas neste quadro" : undefined}
        className={cn(
          "inline-flex items-center gap-1.5 h-8 pl-2 pr-3 rounded-full text-[11.5px] font-medium transition-colors border",
          filters.onlyMe
            ? "bg-[#171717] text-white border-transparent"
            : "bg-white text-[#555] border-[#e0e0e0] hover:border-[#c0c0c0] hover:text-[#111]",
          !currentUserIsResponsible && !filters.onlyMe && "opacity-40 cursor-not-allowed",
        )}
      >
        <User className="size-3.5" />
        Somente eu
      </button>

      {/* Pessoa */}
      <FilterDropdown
        label={filters.personIds.length ? `${filters.personIds.length} pessoa${filters.personIds.length > 1 ? "s" : ""}` : "Pessoa"}
        active={filters.personIds.length > 0}
      >
        <div className="max-h-[280px] overflow-y-auto">
          {people.map((p) => {
            const on = filters.personIds.includes(p.id);
            return (
              <FilterItem key={p.id} onSelect={() => togglePerson(p.id)} checked={on}>
                <Avatar size="sm" initials={p.initials} colorKey={p.color} className="border-0" />
                <span className="text-[11.5px] text-text truncate">{p.name}</span>
              </FilterItem>
            );
          })}
          {people.length === 0 && (
            <div className="p-3 text-center text-[11px] text-text-3">Sem pessoas no quadro.</div>
          )}
        </div>
        {filters.personIds.length > 0 && (
          <ClearRow onClick={() => set("personIds", [])} />
        )}
      </FilterDropdown>

      {/* Status */}
      <FilterDropdown
        label={filters.statusKeys.length ? `${filters.statusKeys.length} status` : "Status"}
        active={filters.statusKeys.length > 0}
      >
        <div className="max-h-[280px] overflow-y-auto">
          {flow.map((s) => {
            const on = filters.statusKeys.includes(s.key);
            return (
              <FilterItem key={s.key} onSelect={() => toggleStatus(s.key)} checked={on}>
                <span className={cn("size-2 rounded-full", toneDot(s.tone))} aria-hidden />
                <span className="text-[11.5px] text-text truncate">{s.label}</span>
              </FilterItem>
            );
          })}
        </div>
        {filters.statusKeys.length > 0 && <ClearRow onClick={() => set("statusKeys", [])} />}
      </FilterDropdown>

      {/* Data */}
      <FilterDropdown
        label={dateLabel}
        icon={<Calendar className="size-3.5" />}
        active={filters.date !== "all"}
      >
        {(["all", "today", "week", "month", "overdue", "no-deadline"] as DatePreset[]).map((preset) => (
          <FilterItem key={preset} onSelect={() => set("date", preset)} checked={filters.date === preset}>
            <span className="text-[11.5px] text-text">
              {preset === "all" ? "Qualquer data" : DATE_LABELS[preset]}
            </span>
          </FilterItem>
        ))}
      </FilterDropdown>

      {/* Contador + limpar */}
      <div className="ml-auto flex items-center gap-2">
        <span className="text-[11px] text-text-3 tabular">
          {isDirty ? `${matchedCount} de ${totalCount}` : `${totalCount} demandas`}
        </span>
        {isDirty && (
          <button
            type="button"
            onClick={() => onChange(emptyFilters)}
            className="inline-flex items-center gap-1 h-7 px-2 rounded text-[10.5px] text-text-3 hover:text-text hover:bg-[#eee] transition-colors"
          >
            <X className="size-3" /> Limpar
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------- pieces ------------------------- */

function FilterDropdown({
  label, icon, active, children,
}: { label: string; icon?: React.ReactNode; active: boolean; children: React.ReactNode }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 h-8 pl-2.5 pr-2 rounded-full text-[11.5px] font-medium transition-colors border",
            active
              ? "bg-[#eef4ff] text-[#0b3d91] border-[#c9dcff]"
              : "bg-white text-[#555] border-[#e0e0e0] hover:border-[#c0c0c0] hover:text-[#111]",
          )}
        >
          {icon}
          {label}
          <ChevronDown className="size-3" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[220px] rounded-md border border-border bg-surface p-1 shadow-e3"
          style={{ animation: "contentShow 140ms cubic-bezier(.2,0,0,1)" }}
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function FilterItem({
  children, onSelect, checked,
}: { children: React.ReactNode; onSelect: () => void; checked?: boolean }) {
  return (
    <DropdownMenu.Item
      onSelect={(e: Event) => { e.preventDefault(); onSelect(); }}
      className="flex items-center gap-2 h-8 px-2 rounded outline-none cursor-default hover:bg-surface-2"
    >
      <span className={cn(
        "grid place-items-center size-4 rounded-sm border transition-colors",
        checked ? "bg-[#171717] border-[#171717] text-white" : "border-[#d0d0d0] bg-white",
      )}>
        {checked && <Check className="size-3" strokeWidth={2.5} />}
      </span>
      {children}
    </DropdownMenu.Item>
  );
}

function ClearRow({ onClick }: { onClick: () => void }) {
  return (
    <>
      <DropdownMenu.Separator className="my-1 h-px bg-hairline" />
      <DropdownMenu.Item
        onSelect={(e: Event) => { e.preventDefault(); onClick(); }}
        className="flex items-center gap-2 h-7 px-2 rounded text-[10.5px] text-text-3 hover:text-text hover:bg-surface-2 outline-none cursor-default"
      >
        <X className="size-3" /> Limpar seleção
      </DropdownMenu.Item>
    </>
  );
}

function toneDot(tone: string | null | undefined): string {
  switch (tone) {
    case "doing":  return "bg-accent";
    case "review": return "bg-[color:var(--warning)]";
    case "done":   return "bg-[color:var(--success)]";
    case "warn":   return "bg-[color:var(--warning)]";
    case "info":   return "bg-[color:var(--info)]";
    default:       return "bg-[#bbb]";
  }
}

/* ------------------------- Filter logic (shared with BoardClient) ------------------------- */

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function matchesDate(deadline: string | null, preset: DatePreset, today: Date): boolean {
  if (preset === "all") return true;
  if (preset === "no-deadline") return !deadline;
  if (!deadline) return false;
  const d = new Date(deadline);
  if (preset === "today") return isSameDay(d, today);
  if (preset === "overdue") return d < today;
  if (preset === "week") {
    const start = new Date(today); start.setDate(today.getDate() - today.getDay());
    const end = new Date(start); end.setDate(start.getDate() + 7);
    return d >= start && d < end;
  }
  if (preset === "month") {
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
  }
  return true;
}

"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays } from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { CardLite } from "./types";

function friendlyDeadline(iso: string | null): { label: string; tone: "muted" | "today" | "overdue" | "soon" } {
  if (!iso) return { label: "Sem prazo", tone: "muted" };
  const date = new Date(iso);
  const now = new Date();
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diff = Math.round((day - today) / 86400000);
  const short = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  if (diff < 0) return { label: `Atrasado (${short})`, tone: "overdue" };
  if (diff === 0) return { label: "Hoje", tone: "today" };
  if (diff === 1) return { label: "Amanhã", tone: "soon" };
  if (diff <= 3) return { label: short, tone: "soon" };
  return { label: short, tone: "muted" };
}

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

function deadlineColors(tone: "muted" | "today" | "overdue" | "soon") {
  switch (tone) {
    case "overdue": return "text-[color:var(--danger-strong)] font-semibold";
    case "today":   return "text-[color:var(--warning)]";
    case "soon":    return "text-[#444]";
    default:        return "text-[#8a8a8a]";
  }
}

export function TaskCard({
  card, isDone, stageLabel, stageTone, onOpen,
}: {
  card: CardLite;
  isDone?: boolean;
  stageLabel?: string;
  stageTone?: string | null;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id, data: { card } });
  const deadline = friendlyDeadline(card.deadline);

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      {...attributes}
      {...listeners}
      onDoubleClick={() => onOpen(card.id)}
      className={cn(
        "group bg-white border border-[#e6e6e6] rounded-lg p-3 grid gap-2 cursor-grab active:cursor-grabbing select-none",
        "hover:border-[#c8c8c8] hover:shadow-e1 transition-[border-color,box-shadow]",
        isDone && "opacity-60",
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => event.key === "Enter" && onOpen(card.id)}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {stageLabel && (
          <span className={cn(
            "inline-flex items-center h-5 px-1.5 rounded text-[9.5px] font-semibold uppercase tracking-[.04em] shrink-0",
            stageColors(stageTone),
          )}>
            {stageLabel}
          </span>
        )}
        <span className="text-[9.5px] uppercase tracking-[.04em] text-[#999] truncate">
          {card.client.name}
        </span>
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onOpen(card.id); }}
        className={cn(
          "block w-full text-left text-[12.5px] leading-[1.35] font-medium tracking-[-.01em] text-[#252525]",
          isDone && "line-through text-[#777]",
        )}
      >
        {card.title}
      </button>

      <div className="flex items-center gap-2 pt-1.5 border-t border-[#f2f2f2]">
        <Avatar size="sm" initials={card.responsible.initials} colorKey={card.responsible.color} className="border-0" />
        <span className="text-[9.5px] text-[#888] truncate flex-1">{card.responsible.name}</span>
        <span className={cn("inline-flex items-center gap-1 text-[10px] tabular", deadlineColors(deadline.tone))}>
          <CalendarDays className="size-3" />
          {deadline.label}
        </span>
      </div>
    </article>
  );
}

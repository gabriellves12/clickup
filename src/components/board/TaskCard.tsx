"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays } from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { colorForClient, colorForPriority } from "@/lib/kanban-colors";
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

function deadlineColors(tone: "muted" | "today" | "overdue" | "soon") {
  switch (tone) {
    case "overdue": return "bg-[#fee2e2] text-[#991b1b]";
    case "today":   return "bg-[#fef3c7] text-[#854d0e]";
    case "soon":    return "bg-[#e0e7ff] text-[#3730a3]";
    default:        return "bg-[#f0f0f0] text-[#555]";
  }
}

export function TaskCard({
  card, isDone, onOpen,
}: {
  card: CardLite;
  isDone?: boolean;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id, data: { card } });
  const deadline = friendlyDeadline(card.deadline);
  const clientColor = colorForClient(card.client.id);
  const priority = colorForPriority(card.priority);

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      {...attributes}
      {...listeners}
      onDoubleClick={() => onOpen(card.id)}
      className={cn(
        "group bg-white border border-[#e6e6e6] rounded-lg p-2.5 grid gap-2 cursor-grab active:cursor-grabbing select-none",
        "hover:border-[#c8c8c8] hover:shadow-e1 transition-[border-color,box-shadow]",
        isDone && "opacity-60",
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => event.key === "Enter" && onOpen(card.id)}
    >
      {/* Etiqueta cliente (com cor) */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className="inline-flex items-center h-5 px-2 rounded-full text-[9.5px] font-semibold uppercase tracking-[.04em] truncate max-w-full"
          style={{ backgroundColor: clientColor.bg, color: clientColor.text }}
          title={card.client.name}
        >
          {card.client.name}
        </span>
      </div>

      {/* Nome */}
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

      {/* Responsável + Data de entrega */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 min-w-0">
          <Avatar size="sm" initials={card.responsible.initials} colorKey={card.responsible.color} className="border-0" />
          <span className="text-[10px] text-[#666] truncate">{card.responsible.name}</span>
        </span>
        <span className="flex-1" />
        <span className={cn("inline-flex items-center gap-1 h-5 px-1.5 rounded text-[9.5px] font-medium tabular", deadlineColors(deadline.tone))}>
          <CalendarDays className="size-3" />
          {deadline.label}
        </span>
      </div>

      {/* Prioridade */}
      {card.priority && card.priority !== "NORMAL" && (
        <div className="flex items-center">
          <span
            className="inline-flex items-center h-5 px-2 rounded-full text-[9.5px] font-semibold uppercase tracking-[.04em]"
            style={{ backgroundColor: priority.bg, color: priority.text }}
          >
            {priority.label}
          </span>
        </div>
      )}
    </article>
  );
}

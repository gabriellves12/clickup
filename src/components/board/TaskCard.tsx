"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, CircleDot, List, Tag, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { CardLite } from "./types";

const tagPalettes = [
  "bg-[#f4d8ff] text-[#6f267f]", "bg-[#dcecff] text-[#285a85]", "bg-[#dff4e7] text-[#2f6b49]",
  "bg-[#fff0cc] text-[#755a18]", "bg-[#f8dfe5] text-[#7c3446]", "bg-[#e6e2ff] text-[#4f4686]",
];
const clientTag = (name: string) => tagPalettes[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % tagPalettes.length];

function friendlyDeadline(iso: string | null) {
  if (!iso) return "Sem prazo";
  const date = new Date(iso); const now = new Date();
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diff = Math.round((day - today) / 86400000);
  const label = diff === 0 ? "Hoje" : diff === 1 ? "Amanhã" : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return `${label}, ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

export function TaskCard({ card, isDone, statusLabel, teamName = "Design", onOpen }: { card: CardLite; isDone?: boolean; statusLabel?: string; teamName?: string; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id, data: { card } });
  return <article ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? .4 : 1 }} {...attributes} {...listeners} onDoubleClick={() => onOpen(card.id)} className={cn("group bg-white border border-[#e2e2e2] rounded-lg p-3.5 cursor-grab active:cursor-grabbing select-none hover:border-[#c8c8c8] hover:shadow-e2 transition-[border-color,box-shadow]", isDone && "opacity-60")} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && onOpen(card.id)}>
    <button type="button" onClick={(event) => { event.stopPropagation(); onOpen(card.id); }} className={cn("block w-full text-left text-[13px] leading-[1.35] font-semibold tracking-[-.01em] text-[#252525]", isDone && "line-through text-[#777]")}>{card.title}</button>
    <p className="mt-1 text-[10.5px] text-[#919191]">Em {teamName.replace("Time ", "")}</p>
    <div className="mt-4 grid gap-2.5 text-[#858585]">
      <List className="size-3.5" />
      <div className="flex items-center gap-2"><UserRound className="size-3.5" /><Avatar size="sm" initials={card.responsible.initials} colorKey={card.responsible.color} className="border-0" /></div>
      <div className="flex items-center gap-2"><CalendarDays className="size-3.5" /><span className="text-[11px] text-[#3e3e3e]">{friendlyDeadline(card.deadline)}</span></div>
      <div className="flex items-center gap-2"><CircleDot className="size-3.5" /><span className="text-[10.5px] font-medium uppercase tracking-[.035em] text-[#444]">{statusLabel ?? card.status}</span></div>
      <div className="flex items-center gap-2"><Tag className="size-3.5" /><span className={cn("rounded-full px-2.5 py-1 text-[10.5px] font-medium", clientTag(card.client.name))}>{card.client.name.toLowerCase()}</span></div>
    </div>
  </article>;
}

"use client";

import * as React from "react";
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, Circle, GripVertical } from "lucide-react";
import { moveClientCard } from "@/app/actions/cards";
import { cn } from "@/lib/cn";

export type ClientPortalCard = {
  id: string; title: string; status: string; deadline: string | null; order: number;
  teamName: string; responsibleName: string; responsibleInitials: string;
};

export function ClientBoard({ initialCards, statuses, labels }: { initialCards: ClientPortalCard[]; statuses: string[]; labels: Record<string, string> }) {
  const [cards, setCards] = React.useState(initialCards);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const activeCard = cards.find((card) => card.id === activeId);

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const cardId = String(event.active.id);
    const toStatus = event.over ? String(event.over.id).replace("status::", "") : null;
    const current = cards.find((card) => card.id === cardId);
    if (!current || !toStatus || current.status === toStatus || !statuses.includes(toStatus)) return;
    const previous = cards;
    setCards((items) => items.map((card) => card.id === cardId ? { ...card, status: toStatus } : card));
    setPendingId(cardId);
    try { await moveClientCard({ cardId, toStatus }); }
    catch { setCards(previous); }
    finally { setPendingId(null); }
  }

  return <DndContext sensors={sensors} onDragStart={(event) => setActiveId(String(event.active.id))} onDragCancel={() => setActiveId(null)} onDragEnd={handleDragEnd}>
    <div className="mx-auto flex min-w-max max-w-[1440px] gap-3">
      {statuses.map((status) => <ClientColumn key={status} status={status} label={labels[status] ?? status} cards={cards.filter((card) => card.status === status).sort((a, b) => a.order - b.order)} pendingId={pendingId} />)}
    </div>
    <DragOverlay dropAnimation={null}>{activeCard ? <div className="w-[258px] rotate-1"><ClientCard card={activeCard} overlay /></div> : null}</DragOverlay>
  </DndContext>;
}

function ClientColumn({ status, label, cards, pendingId }: { status: string; label: string; cards: ClientPortalCard[]; pendingId: string | null }) {
  const { setNodeRef, isOver } = useDroppable({ id: `status::${status}` });
  return <div ref={setNodeRef} className={cn("w-[274px] shrink-0 rounded-lg border border-[#e4e4e4] bg-[#f2f2f2] transition-colors", isOver && "border-[#999] bg-[#eaeaea]") }>
    <header className="flex h-11 items-center gap-2 border-b border-[#e3e3e3] px-3"><Circle className="size-2.5 text-[#666]" /><h2 className="text-[10px] font-semibold uppercase tracking-[.06em]">{label}</h2><span className="ml-auto rounded bg-[#e4e4e4] px-1.5 py-0.5 text-[9px] tabular text-[#666]">{cards.length}</span></header>
    <div className="grid min-h-24 gap-2 p-2">{cards.map((card) => <ClientCard key={card.id} card={card} pending={pendingId === card.id} />)}{cards.length === 0 && <p className="rounded-md border border-dashed border-[#d8d8d8] px-3 py-6 text-center text-[9.5px] text-[#999]">Solte uma demanda aqui</p>}</div>
  </div>;
}

function ClientCard({ card, pending = false, overlay = false }: { card: ClientPortalCard; pending?: boolean; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id, disabled: overlay });
  return <article ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform) }} {...attributes} {...listeners} className={cn("group cursor-grab rounded-md border border-[#dedede] bg-white p-3.5 shadow-sm transition-[opacity,border-color] active:cursor-grabbing hover:border-[#bbb]", (isDragging || pending) && "opacity-45", overlay && "cursor-grabbing opacity-100 shadow-lg") }>
    <div className="flex items-center gap-2"><span className="text-[9px] uppercase tracking-[.05em] text-[#999]">{card.teamName.replace("Time ", "")}</span><GripVertical className="ml-auto size-3.5 text-[#bbb] group-hover:text-[#777]" /></div>
    <h3 className="mt-1.5 text-[12px] font-medium leading-[1.4]">{card.title}</h3>
    <div className="mt-4 flex items-center gap-2 border-t border-[#eee] pt-3"><span className="grid size-5 place-items-center rounded-full bg-[#222] text-[7.5px] font-medium text-white">{card.responsibleInitials}</span><span className="truncate text-[9px] text-[#777]">{card.responsibleName}</span>{card.deadline && <span className="ml-auto flex items-center gap-1 text-[8.5px] tabular text-[#888]"><CalendarDays className="size-3" />{new Date(card.deadline).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>}</div>
  </article>;
}

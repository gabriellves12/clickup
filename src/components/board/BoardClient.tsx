"use client";

import * as React from "react";
import {
  DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors,
  closestCenter, DragOverlay, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useTransition } from "react";
import { moveCard } from "@/app/actions/cards";
import { FlowColumn } from "./FlowColumn";
import { TaskCard } from "./TaskCard";
import { Avatar, Badge, Button } from "@/components/ui/primitives";
import { IcAlert, IcPlus } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { BoardData, CardLite } from "./types";
import { CardDialog } from "@/components/dialogs/CardDialog";

const personColumnKey = (personId: string) => `person::${personId}`;

export function BoardClient({ data, canManage }: { data: BoardData; canManage: boolean }) {
  const [cards, setCards] = React.useState<CardLite[]>(data.cards);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [, startTransition] = useTransition();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [openCardId, setOpenCardId] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState<
    | { open: false }
    | { open: true; status?: string; responsibleId?: string }
  >({ open: false });

  const overdueOrPending = React.useMemo(
    () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return (
      cards
        .filter((c) => {
          if (c.status === "FINALIZADO") return false;
          if (c.pendenteMaterial) return true;
          if (!c.deadline) return false;
          return new Date(c.deadline) < todayStart;
        })
        .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""))
      );
    },
    [cards],
  );

  const cardsByPerson = React.useMemo(() => {
    const map = new Map<string, CardLite[]>();
    for (const member of data.members) map.set(member.person.id, []);
    for (const c of cards) {
      if (!map.has(c.responsibleId)) map.set(c.responsibleId, []);
      map.get(c.responsibleId)!.push(c);
    }
    for (const [, arr] of map) arr.sort((a, b) => a.order - b.order);
    return map;
  }, [cards, data.members]);

  const activeCard = activeId ? cards.find((c) => c.id === activeId) : null;

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)); }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeCard = cards.find((c) => c.id === active.id);
    if (!activeCard) return;

    let toStatus = activeCard.status;
    let toResponsibleId = activeCard.responsibleId;
    let overCard: CardLite | undefined;

    if (over.data.current?.type === "column") {
      const [, personId] = String(over.id).split("::");
      toResponsibleId = personId;
    } else {
      overCard = cards.find((c) => c.id === over.id);
      if (overCard) { toStatus = overCard.status; toResponsibleId = overCard.responsibleId; }
    }
    setCards((prev) => {
      const withoutActive = prev.filter((c) => c.id !== activeCard.id);
      const targetList = withoutActive
        .filter((c) => c.responsibleId === toResponsibleId)
        .sort((a, b) => a.order - b.order);
      const insertAt = overCard ? targetList.findIndex((c) => c.id === overCard!.id) : targetList.length;
      const before = insertAt > 0 ? targetList[insertAt - 1] : null;
      const after  = insertAt >= 0 && insertAt < targetList.length ? targetList[insertAt] : null;
      const newOrder = before && after ? (before.order + after.order) / 2
        : before ? before.order + 1000
        : after ? after.order - 1000
        : 1000;
      return withoutActive.concat({
        ...activeCard, status: toStatus, responsibleId: toResponsibleId, order: newOrder,
      });
    });

    startTransition(async () => {
      try {
        const list = cards
          .filter((c) => c.responsibleId === toResponsibleId && c.id !== activeCard.id)
          .sort((a, b) => a.order - b.order);
        const idx = overCard ? list.findIndex((c) => c.id === overCard!.id) : list.length;
        await moveCard({
          cardId: activeCard.id,
          toStatus, toResponsibleId,
          beforeCardId: idx > 0 ? list[idx - 1].id : null,
          afterCardId:  idx >= 0 && idx < list.length ? list[idx].id : null,
          currentTeamSlug: data.team.slug,
        });
      } catch (err) { console.error(err); }
    });
  }

  const editingCard = openCardId ? cards.find((c) => c.id === openCardId) ?? null : null;

  return (
    <>
      <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4 border-b border-[#f2f2f2]">
        <div className="min-w-0">
          <h1 className="text-[18px] font-semibold tracking-[-0.025em] text-text truncate">{data.team.name}</h1>
          <p className="text-[11px] text-text-3 mt-1">
            {data.members.length} pessoas · {cards.length} demandas
            {overdueOrPending.length > 0 && (
              <> · <span className="text-danger font-medium">{overdueOrPending.length} pendentes</span></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="md" disabled>Filtros</Button>
          {canManage && <Button variant="primary" size="md" onClick={() => setCreating({ open: true })}>
            <IcPlus className="size-3.5" /> Nova demanda
          </Button>}
        </div>
      </div>

      <div className="p-4 flex-1 min-h-0 overflow-hidden bg-[#fafafa]">
        <div className="h-full flex gap-3">
          <DndContext id="board-dnd" sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
            {/* Coluna especial */}
            <div className="w-[248px] shrink-0 bg-white border border-[#e7e7e7] rounded-lg p-2 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 px-2 py-1.5 shrink-0">
                <IcAlert className="size-3.5 text-danger" />
                <span className="text-[12px] font-semibold tracking-tight text-text">Materiais Pendentes</span>
                <Badge tone={overdueOrPending.length ? "danger" : "neutral"} className="ml-auto">
                  {overdueOrPending.length}
                </Badge>
              </div>
              <div className="grid gap-2 p-1 overflow-y-auto scrollbar-clean">
                {overdueOrPending.length === 0 && (
                  <div className="text-[12px] text-text-3 border border-dashed border-border rounded-lg p-4 text-center">
                    Sem pendências. Tudo em dia.
                  </div>
                )}
                {overdueOrPending.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setOpenCardId(c.id)}
                    className={cn(
                      "text-left grid gap-1.5 bg-white border border-[#dedede] rounded-md p-3",
                      "shadow-[inset_2px_0_0_#777] hover:border-[#bbb]",
                    )}
                  >
                    <span className="text-[10.5px] uppercase tracking-[0.02em] text-text-3">
                      {c.client.name}
                    </span>
                    <span className="text-[13px] font-medium tracking-tight text-text">{c.title}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-danger font-medium">
                        {c.deadline ? overdueLabel(c.deadline) : c.pendenteMaterial ? "material pendente" : ""}
                      </span>
                      <span className="flex-1" />
                      <Avatar size="sm" initials={c.responsible.initials} colorKey={c.responsible.color} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <section className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden scrollbar-clean">
              <div className="h-full flex gap-3 min-w-max pr-2">
                {data.members.map(({ person }) => {
                  const list = cardsByPerson.get(person.id) ?? [];
                  return <div key={person.id} className="w-[270px] h-full shrink-0 rounded-lg border border-[#e7e7e7] bg-[#f7f7f7] flex flex-col overflow-hidden">
                    <header className="h-11 shrink-0 px-3 flex items-center gap-2 border-b border-[#e8e8e8] bg-[#fafafa]">
                      <Avatar size="sm" initials={person.initials} colorKey={person.color} className="border-0" />
                      <span className="text-[11px] font-semibold uppercase tracking-[.055em] text-[#333]">{person.name}</span>
                      <span className="ml-auto min-w-5 h-5 px-1.5 rounded bg-[#e9e9e9] grid place-items-center text-[9.5px] tabular text-[#666]">{list.length}</span>
                    </header>
                    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-clean p-1.5">
                      <FlowColumn id={personColumnKey(person.id)} cards={list} flow={data.flow} teamName={data.team.name} onOpen={(id) => setOpenCardId(id)} onAdd={canManage ? () => setCreating({ open: true, status: data.flow[0]?.key, responsibleId: person.id }) : undefined} />
                    </div>
                  </div>;
                })}
                {data.flow.map((status) => {
                  const statusCards = cards.filter((card) => card.status === status.key).sort((a, b) => a.order - b.order);
                  return <div key={status.key} className="w-[270px] h-full shrink-0 rounded-lg border border-[#e7e7e7] bg-[#f7f7f7] flex flex-col overflow-hidden">
                    <header className="h-11 shrink-0 px-3 flex items-center gap-2 border-b border-[#e8e8e8] bg-[#fafafa]">
                      <span className="size-2 rounded-full border border-[#777] bg-white" />
                      <span className="text-[10.5px] font-semibold uppercase tracking-[.055em] text-[#333]">{status.label}</span>
                      <span className="ml-auto min-w-5 h-5 px-1.5 rounded bg-[#e9e9e9] grid place-items-center text-[9.5px] tabular text-[#666]">{statusCards.length}</span>
                    </header>
                    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-clean p-2 grid content-start gap-2">
                      {statusCards.map((card) => <StatusViewCard key={card.id} card={card} onOpen={() => setOpenCardId(card.id)} />)}
                      {statusCards.length === 0 && <div className="rounded-md border border-dashed border-[#dedede] px-3 py-5 text-center text-[10.5px] text-[#999]">Nenhuma demanda</div>}
                      {canManage && <button type="button" onClick={() => setCreating({ open: true, status: status.key })} className="h-8 rounded-md text-left px-2 text-[10.5px] text-[#777] hover:bg-[#ededed]"><IcPlus className="inline size-3 mr-1.5" />Adicionar tarefa</button>}
                    </div>
                  </div>;
                })}
              </div>
            </section>

            <DragOverlay dropAnimation={null}>
              {activeCard ? <div className="rotate-1"><TaskCard card={activeCard} onOpen={() => {}} /></div> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      <CardDialog
        key={`${editingCard?.id ?? "new"}-${creating.open ? "open" : "closed"}`}
        open={!!editingCard || creating.open}
        onOpenChange={(v) => { if (!v) { setOpenCardId(null); setCreating({ open: false }); } }}
        editing={editingCard ?? undefined}
        defaults={editingCard ? undefined : {
          status: creating.open ? creating.status : undefined,
          responsibleId: creating.open ? creating.responsibleId : undefined,
        }}
        clients={data.clients}
        products={data.products}
        demandTypes={data.demandTypes}
        people={data.allPeople}
        currentTeamSlug={data.team.slug}
        flow={data.flow}
        readOnly={!canManage}
      />
    </>
  );
}

function StatusViewCard({ card, onOpen }: { card: CardLite; onOpen: () => void }) {
  const deadline = card.deadline
    ? new Date(card.deadline).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    : null;
  return <button type="button" onClick={onOpen} className="w-full text-left rounded-md border border-[#e4e4e4] bg-white p-3 hover:border-[#c8c8c8] hover:shadow-e1 transition-[border-color,box-shadow]">
    <span className="block text-[9.5px] uppercase tracking-[.04em] text-[#888] truncate">{card.client.name}</span>
    <b className="block mt-1 text-[12px] leading-[1.35] font-medium text-[#222]">{card.title}</b>
    <span className="mt-3 flex items-center gap-2">
      <Avatar size="sm" initials={card.responsible.initials} colorKey={card.responsible.color} className="border-0" />
      <span className="text-[9.5px] text-[#777] truncate">{card.responsible.name}</span>
      {deadline && <span className="ml-auto text-[9.5px] tabular text-[#888]">{deadline}</span>}
    </span>
  </button>;
}

function overdueLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.floor((t0.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  return `atrasado ${diff}d`;
}

"use client";

import * as React from "react";
import {
  DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors,
  closestCenter, DragOverlay, useDroppable,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { moveCard } from "@/app/actions/cards";
import { TaskCard } from "./TaskCard";
import { EditableBoardTitle } from "./EditableBoardTitle";
import { BoardListView } from "./BoardListView";
import { ViewSwitcher, type BoardView } from "./ViewSwitcher";
import { FiltersPopover } from "./FiltersPopover";
import { StageManager } from "./StageManager";
import { emptyFilters, matchesDate, type BoardFiltersState } from "./BoardFilters";
import { Avatar, Badge, Button } from "@/components/ui/primitives";
import { IcPlus } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { BoardData, CardLite } from "./types";
import { CardDialog } from "@/components/dialogs/CardDialog";

const personLaneKey = (personId: string) => `lane::${personId}`;
const parseLane = (id: string) => id.split("::")[1];

export function BoardClient({
  data, canManage, currentUserId,
}: { data: BoardData; canManage: boolean; currentUserId: string }) {
  const [cards, setCards] = React.useState<CardLite[]>(data.cards);
  React.useEffect(() => setCards(data.cards), [data.cards]);

  const [view, setView] = React.useState<BoardView>("board");
  const [filters, setFilters] = React.useState<BoardFiltersState>(emptyFilters);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [openCardId, setOpenCardId] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState<
    | { open: false }
    | { open: true; status?: string; responsibleId?: string }
  >({ open: false });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [, startTransition] = useTransition();

  const currentUserIsResponsible = React.useMemo(
    () => cards.some((c) => c.responsibleId === currentUserId),
    [cards, currentUserId],
  );

  const todayStart = React.useMemo(() => {
    const t = new Date(); t.setHours(0, 0, 0, 0); return t;
  }, []);

  const flow = React.useMemo(() => [...data.flow].sort((a, b) => a.order - b.order), [data.flow]);
  const stageMap = React.useMemo(() => new Map(flow.map((s) => [s.key, s])), [flow]);

  // ------------ Filtros ------------
  const effectivePersonIds = React.useMemo(() => {
    if (filters.onlyMe) return new Set([currentUserId]);
    if (filters.personIds.length) return new Set(filters.personIds);
    return null;
  }, [filters.onlyMe, filters.personIds, currentUserId]);

  const effectiveStatusKeys = React.useMemo(() => (
    filters.statusKeys.length ? new Set(filters.statusKeys) : null
  ), [filters.statusKeys]);

  const filteredCards = React.useMemo(() => cards.filter((c) => {
    if (effectivePersonIds && !effectivePersonIds.has(c.responsibleId)) return false;
    if (effectiveStatusKeys && !effectiveStatusKeys.has(c.status)) return false;
    if (!matchesDate(c.deadline, filters.date, todayStart)) return false;
    return true;
  }), [cards, effectivePersonIds, effectiveStatusKeys, filters.date, todayStart]);

  const visibleMembers = React.useMemo(() => {
    if (filters.onlyMe) {
      const mine = data.members.find((m) => m.person.id === currentUserId);
      return mine ? [mine] : [];
    }
    if (filters.personIds.length) {
      const set = new Set(filters.personIds);
      return data.members.filter((m) => set.has(m.person.id));
    }
    return data.members;
  }, [data.members, filters.onlyMe, filters.personIds, currentUserId]);

  // ------------ Materiais Pendentes (independente de filtros) ------------
  const overdueOrPending = React.useMemo(() => cards
    .filter((c) => {
      if (c.status === "FINALIZADO") return false;
      if (c.pendenteMaterial) return true;
      if (!c.deadline) return false;
      return new Date(c.deadline) < todayStart;
    })
    .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? "")),
  [cards, todayStart]);

  // ------------ Cards por pessoa ------------
  const cardsByPerson = React.useMemo(() => {
    const map = new Map<string, CardLite[]>();
    for (const m of visibleMembers) map.set(m.person.id, []);
    for (const c of filteredCards) {
      if (!map.has(c.responsibleId)) continue; // pessoa não visível
      map.get(c.responsibleId)!.push(c);
    }
    for (const [, arr] of map) arr.sort((a, b) => a.order - b.order);
    return map;
  }, [filteredCards, visibleMembers]);

  const activeCard = activeId ? cards.find((c) => c.id === activeId) : null;

  // ------------ Drag & Drop (reordena dentro da raia, mantém pessoa) ------------
  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)); }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeCard = cards.find((c) => c.id === active.id);
    if (!activeCard) return;

    let overCard: CardLite | undefined;
    let toResponsibleId = activeCard.responsibleId;

    if (over.data.current?.type === "lane") {
      toResponsibleId = parseLane(String(over.id));
    } else {
      overCard = cards.find((c) => c.id === over.id);
      if (overCard) toResponsibleId = overCard.responsibleId;
    }

    // Regra: DnD só reordena dentro da mesma raia (mesma pessoa). Não muda status.
    if (toResponsibleId !== activeCard.responsibleId) return;

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
      return withoutActive.concat({ ...activeCard, responsibleId: toResponsibleId, order: newOrder });
    });

    startTransition(async () => {
      try {
        const list = cards
          .filter((c) => c.responsibleId === toResponsibleId && c.id !== activeCard.id)
          .sort((a, b) => a.order - b.order);
        const idx = overCard ? list.findIndex((c) => c.id === overCard!.id) : list.length;
        await moveCard({
          cardId: activeCard.id,
          toStatus: activeCard.status,
          toResponsibleId,
          beforeCardId: idx > 0 ? list[idx - 1].id : null,
          afterCardId:  idx >= 0 && idx < list.length ? list[idx].id : null,
          currentTeamSlug: data.team.slug,
        });
      } catch (err) { console.error(err); }
    });
  }

  const editingCard = openCardId ? cards.find((c) => c.id === openCardId) ?? null : null;
  const peopleForFilters = React.useMemo(() => data.members.map((m) => m.person), [data.members]);

  return (
    <>
      {/* ------------ Header ------------ */}
      <div className="px-6 pt-5 pb-3 border-b border-[#f2f2f2]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <EditableBoardTitle boardId={data.team.id} name={data.team.name} canEdit={canManage} />
            <p className="text-[11px] text-text-3 mt-1">
              {data.members.length} pessoas · {cards.length} demandas · {flow.length} etapas
              {overdueOrPending.length > 0 && (
                <> · <span className="font-medium" style={{ color: "var(--danger-strong)" }}>{overdueOrPending.length} pendentes</span></>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canManage && (
              <Button variant="primary" size="md" onClick={() => setCreating({ open: true })}>
                <IcPlus className="size-3.5" /> Nova demanda
              </Button>
            )}
          </div>
        </div>

        {/* Abas de controle */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <ViewSwitcher value={view} onChange={setView} />
          <FiltersPopover
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters(emptyFilters)}
            people={peopleForFilters}
            flow={flow}
            matchedCount={filteredCards.length}
            totalCount={cards.length}
            currentUserIsResponsible={currentUserIsResponsible}
          />
          {canManage && <StageManager teamId={data.team.id} flow={flow} />}
          <span className="ml-auto text-[10.5px] text-text-3 tabular">
            {filteredCards.length !== cards.length ? `${filteredCards.length} de ${cards.length}` : `${cards.length} demandas`}
          </span>
        </div>
      </div>

      {/* ------------ Corpo ------------ */}
      <div className="p-4 flex-1 min-h-0 overflow-hidden bg-[#fafafa]">
        <div className="h-full flex gap-3">
          <PendingColumn cards={overdueOrPending} onOpen={setOpenCardId} />

          {view === "board" ? (
            <DndContext id="board-dnd" sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
              <section className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden scrollbar-clean">
                <div className="h-full flex gap-3 min-w-max pr-2">
                  {visibleMembers.map(({ person }) => {
                    const list = cardsByPerson.get(person.id) ?? [];
                    return (
                      <PersonColumn
                        key={person.id}
                        person={person}
                        cards={list}
                        stageMap={stageMap}
                        onOpen={setOpenCardId}
                        onAdd={canManage ? () => setCreating({ open: true, responsibleId: person.id }) : undefined}
                      />
                    );
                  })}
                  {visibleMembers.length === 0 && (
                    <div className="w-full grid place-items-center text-[12px] text-text-3">
                      {data.members.length === 0
                        ? "Nenhuma pessoa vinculada a este quadro ainda."
                        : "Nenhuma raia visível para os filtros atuais."}
                    </div>
                  )}
                </div>
              </section>

              <DragOverlay dropAnimation={null}>
                {activeCard ? (
                  <div className="rotate-1">
                    <TaskCard
                      card={activeCard}
                      stageLabel={stageMap.get(activeCard.status)?.label}
                      stageTone={stageMap.get(activeCard.status)?.tone}
                      onOpen={() => {}}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="flex-1 min-w-0">
              <BoardListView cards={filteredCards} flow={flow} onOpen={setOpenCardId} />
            </div>
          )}
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

/* ------------------------- PersonColumn (Trello-style) ------------------------- */

function PersonColumn({
  person, cards, stageMap, onOpen, onAdd,
}: {
  person: { id: string; name: string; initials: string; color: string };
  cards: CardLite[];
  stageMap: Map<string, { label: string; tone: string | null }>;
  onOpen: (id: string) => void;
  onAdd?: () => void;
}) {
  const laneId = personLaneKey(person.id);
  const { setNodeRef, isOver } = useDroppable({ id: laneId, data: { type: "lane" } });
  const items = React.useMemo(() => cards.map((c) => c.id), [cards]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-[280px] h-full shrink-0 rounded-lg border border-[#e7e7e7] bg-[#f7f7f7] flex flex-col overflow-hidden",
        isOver && "outline outline-2 outline-accent/40",
      )}
    >
      <header className="h-11 shrink-0 px-3 flex items-center gap-2 border-b border-[#e8e8e8] bg-white">
        <Avatar size="sm" initials={person.initials} colorKey={person.color} className="border-0" />
        <span className="text-[11.5px] font-semibold text-[#333] truncate">{person.name}</span>
        <span className="ml-auto min-w-5 h-5 px-1.5 rounded bg-[#eee] grid place-items-center text-[9.5px] tabular text-[#666]">
          {cards.length}
        </span>
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-clean p-2 grid gap-2 content-start">
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {cards.map((c) => (
            <TaskCard
              key={c.id}
              card={c}
              isDone={c.status === "FINALIZADO"}
              stageLabel={stageMap.get(c.status)?.label}
              stageTone={stageMap.get(c.status)?.tone}
              onOpen={onOpen}
            />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div className="rounded-md border border-dashed border-[#dedede] p-4 text-center text-[10.5px] text-[#999]">
            Sem demandas
          </div>
        )}
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="h-8 rounded-md text-left px-2 text-[10.5px] text-[#888] hover:text-[#333] hover:bg-white transition-colors"
          >
            + Adicionar demanda
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------- Pending column (topo vermelho) ------------------------- */

function PendingColumn({ cards, onOpen }: { cards: CardLite[]; onOpen: (id: string) => void }) {
  return (
    <div className="w-[268px] shrink-0 bg-white border border-[#e7e7e7] rounded-lg overflow-hidden flex flex-col">
      <header className="px-3 py-2.5 flex items-center gap-2 text-white shrink-0" style={{ background: "var(--danger-strong)" }}>
        <AlertTriangle className="size-3.5" strokeWidth={1.8} />
        <span className="text-[11.5px] font-semibold tracking-tight">Materiais Pendentes</span>
        <Badge className="ml-auto !bg-white/20 !text-white !border-transparent">
          {cards.length}
        </Badge>
      </header>
      <div className="grid gap-2 p-2 overflow-y-auto scrollbar-clean">
        {cards.length === 0 && (
          <div className="text-[11px] text-text-3 border border-dashed border-border rounded-md p-4 text-center">
            Sem pendências. Tudo em dia.
          </div>
        )}
        {cards.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onOpen(c.id)}
            className={cn(
              "text-left grid gap-1.5 bg-white border rounded-md p-3",
            )}
            style={{ borderColor: "color-mix(in oklab, var(--danger-strong) 45%, transparent)", boxShadow: "inset 2px 0 0 var(--danger-strong)" }}
          >
            <span className="text-[10px] uppercase tracking-[0.02em] text-text-3">{c.client.name}</span>
            <span className="text-[12.5px] font-medium tracking-tight text-text">{c.title}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] font-medium" style={{ color: "var(--danger-strong)" }}>
                {c.deadline ? overdueLabel(c.deadline) : c.pendenteMaterial ? "material pendente" : ""}
              </span>
              <span className="flex-1" />
              <Avatar size="sm" initials={c.responsible.initials} colorKey={c.responsible.color} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function overdueLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.floor((t0.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  return `atrasado ${diff}d`;
}

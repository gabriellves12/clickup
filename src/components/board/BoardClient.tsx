"use client";

import * as React from "react";
import {
  DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors,
  closestCenter, DragOverlay, useDroppable,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTransition } from "react";
import { moveCard } from "@/app/actions/cards";
import { TaskCard } from "./TaskCard";
import { EditableBoardTitle } from "./EditableBoardTitle";
import { ColumnHeader } from "./ColumnHeader";
import { AddColumnButton } from "./AddColumnButton";
import { BoardFilters, emptyFilters, matchesDate, type BoardFiltersState } from "./BoardFilters";
import { Avatar, Badge, Button } from "@/components/ui/primitives";
import { IcAlert, IcPlus } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { BoardData, CardLite, FlowColumnDef, PersonLite } from "./types";
import { CardDialog } from "@/components/dialogs/CardDialog";

const cellKey = (statusKey: string, personId: string) => `cell::${statusKey}::${personId}`;
const parseCell = (id: string) => {
  const [, statusKey, personId] = id.split("::");
  return { statusKey, personId };
};

export function BoardClient({
  data, canManage, currentUserId,
}: { data: BoardData; canManage: boolean; currentUserId: string }) {
  const [cards, setCards] = React.useState<CardLite[]>(data.cards);
  React.useEffect(() => setCards(data.cards), [data.cards]);

  const [filters, setFilters] = React.useState<BoardFiltersState>(emptyFilters);
  const currentUserIsResponsible = React.useMemo(
    () => cards.some((c) => c.responsibleId === currentUserId),
    [cards, currentUserId],
  );

  const todayStart = React.useMemo(() => {
    const t = new Date(); t.setHours(0, 0, 0, 0); return t;
  }, []);

  // Aplica filtros combinados. "Somente eu" força personIds = [currentUserId] visual/lógica.
  const effectivePersonIds = React.useMemo(() => {
    if (filters.onlyMe) return new Set([currentUserId]);
    if (filters.personIds.length) return new Set(filters.personIds);
    return null;
  }, [filters.onlyMe, filters.personIds, currentUserId]);

  const effectiveStatusKeys = React.useMemo(() => (
    filters.statusKeys.length ? new Set(filters.statusKeys) : null
  ), [filters.statusKeys]);

  const filteredCards = React.useMemo(() => {
    return cards.filter((c) => {
      if (effectivePersonIds && !effectivePersonIds.has(c.responsibleId)) return false;
      if (effectiveStatusKeys && !effectiveStatusKeys.has(c.status)) return false;
      if (!matchesDate(c.deadline, filters.date, todayStart)) return false;
      return true;
    });
  }, [cards, effectivePersonIds, effectiveStatusKeys, filters.date, todayStart]);

  // Membros visíveis: quando "Somente eu" está ativo, só a raia do usuário logado.
  // Quando "Pessoa" tem seleção, só as raias selecionadas.
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

  const overdueOrPending = React.useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return cards
      .filter((c) => {
        if (c.status === "FINALIZADO") return false;
        if (c.pendenteMaterial) return true;
        if (!c.deadline) return false;
        return new Date(c.deadline) < todayStart;
      })
      .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""));
  }, [cards]);

  // Cards por (pessoa, status) — matriz, respeitando filtros.
  const cardsByCell = React.useMemo(() => {
    const map = new Map<string, CardLite[]>();
    for (const p of visibleMembers)
      for (const s of data.flow) map.set(cellKey(s.key, p.person.id), []);
    for (const c of filteredCards) {
      const k = cellKey(c.status, c.responsibleId);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(c);
    }
    for (const [, arr] of map) arr.sort((a, b) => a.order - b.order);
    return map;
  }, [filteredCards, visibleMembers, data.flow]);

  const countsByStatus = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const c of filteredCards) map.set(c.status, (map.get(c.status) ?? 0) + 1);
    return map;
  }, [filteredCards]);

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

    if (over.data.current?.type === "cell") {
      const parsed = parseCell(String(over.id));
      toStatus = parsed.statusKey;
      toResponsibleId = parsed.personId;
    } else {
      overCard = cards.find((c) => c.id === over.id);
      if (overCard) { toStatus = overCard.status; toResponsibleId = overCard.responsibleId; }
    }

    // Regra: drag só reordena/muda de coluna. Não muda de pessoa.
    if (toResponsibleId !== activeCard.responsibleId) return;

    setCards((prev) => {
      const withoutActive = prev.filter((c) => c.id !== activeCard.id);
      const targetList = withoutActive
        .filter((c) => c.status === toStatus && c.responsibleId === toResponsibleId)
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
          .filter((c) => c.status === toStatus && c.responsibleId === toResponsibleId && c.id !== activeCard.id)
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

  const flow = React.useMemo(
    () => [...data.flow].sort((a, b) => a.order - b.order),
    [data.flow],
  );

  return (
    <>
      {/* Header do board */}
      <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4 border-b border-[#f2f2f2]">
        <div className="min-w-0">
          <EditableBoardTitle boardId={data.team.id} name={data.team.name} canEdit={canManage} />
          <p className="text-[11px] text-text-3 mt-1">
            {data.members.length} pessoas · {cards.length} demandas · {flow.length} colunas
            {overdueOrPending.length > 0 && (
              <> · <span className="text-danger font-medium">{overdueOrPending.length} pendentes</span></>
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

      {/* Filtros */}
      <BoardFilters
        filters={filters}
        onChange={setFilters}
        people={data.members.map((m) => m.person)}
        flow={flow}
        matchedCount={filteredCards.length}
        totalCount={cards.length}
        currentUserIsResponsible={currentUserIsResponsible}
      />

      {/* Corpo */}
      <div className="p-4 flex-1 min-h-0 overflow-hidden bg-[#fafafa]">
        <div className="h-full flex gap-3">
          <DndContext id="board-dnd" sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
            {/* Coluna especial · Materiais Pendentes */}
            <PendingColumn cards={overdueOrPending} onOpen={setOpenCardId} />

            {/* Matriz: linhas (pessoas) × colunas (status) */}
            <section className="flex-1 min-w-0 overflow-auto scrollbar-clean rounded-lg border border-[#e7e7e7] bg-white">
              <div className="min-w-max">
                {/* Header row */}
                <div className="sticky top-0 z-10 flex bg-[#fafafa] border-b border-[#e8e8e8]">
                  <div className="w-[160px] shrink-0 px-4 h-11 flex items-center text-[10px] font-semibold uppercase tracking-[.055em] text-[#999] border-r border-[#eee]">
                    Pessoas / Etapas
                  </div>
                  {flow.map((col, idx) => (
                    <div key={col.id} className="w-[240px] shrink-0 border-r border-[#eee]">
                      <ColumnHeader
                        id={col.id}
                        label={col.label}
                        count={countsByStatus.get(col.key) ?? 0}
                        tone={col.tone}
                        canEdit={canManage}
                        neighbors={{
                          prev: flow[idx - 1] ? { id: flow[idx - 1].id, order: flow[idx - 1].order } : null,
                          prevPrev: flow[idx - 2] ? { id: flow[idx - 2].id, order: flow[idx - 2].order } : null,
                          next: flow[idx + 1] ? { id: flow[idx + 1].id, order: flow[idx + 1].order } : null,
                          nextNext: flow[idx + 2] ? { id: flow[idx + 2].id, order: flow[idx + 2].order } : null,
                        }}
                      />
                    </div>
                  ))}
                  {canManage && (
                    <div className="w-[220px] shrink-0 p-2">
                      <AddColumnButton teamId={data.team.id} />
                    </div>
                  )}
                </div>

                {/* Rows */}
                {visibleMembers.map(({ person }) => (
                  <div key={person.id} className="flex border-b border-[#eee] last:border-b-0">
                    <div className="w-[160px] shrink-0 px-4 py-3 flex items-center gap-2 border-r border-[#eee] bg-[#fafafa] sticky left-0 z-[1]">
                      <Avatar size="sm" initials={person.initials} colorKey={person.color} className="border-0" />
                      <span className="text-[11.5px] font-semibold text-[#333] truncate">{person.name}</span>
                    </div>
                    {flow.map((col) => {
                      const list = cardsByCell.get(cellKey(col.key, person.id)) ?? [];
                      return (
                        <Cell
                          key={col.id}
                          statusKey={col.key}
                          personId={person.id}
                          cards={list}
                          onOpen={setOpenCardId}
                          onAdd={canManage ? () => setCreating({ open: true, status: col.key, responsibleId: person.id }) : undefined}
                        />
                      );
                    })}
                    {canManage && <div className="w-[220px] shrink-0" />}
                  </div>
                ))}

                {visibleMembers.length === 0 && (
                  <div className="p-10 text-center text-[11px] text-text-3">
                    {data.members.length === 0
                      ? "Nenhuma pessoa vinculada a este quadro ainda."
                      : "Nenhuma raia visível para os filtros atuais."}
                  </div>
                )}
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

/* ------------------------- Cell (dropzone da matriz) ------------------------- */

function Cell({
  statusKey, personId, cards, onOpen, onAdd,
}: {
  statusKey: string;
  personId: string;
  cards: CardLite[];
  onOpen: (id: string) => void;
  onAdd?: () => void;
}) {
  const id = cellKey(statusKey, personId);
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: "cell" } });
  const items = React.useMemo(() => cards.map((c) => c.id), [cards]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-[240px] shrink-0 border-r border-[#eee] p-2 min-h-[140px] grid gap-1.5 content-start",
        "transition-colors duration-100",
        isOver && "bg-accent/6 outline outline-1 outline-accent/40 outline-offset-[-1px]",
      )}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {cards.map((c) => (
          <TaskCard key={c.id} card={c} isDone={c.status === "FINALIZADO"} onOpen={onOpen} />
        ))}
      </SortableContext>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="h-8 rounded-md text-left px-2 text-[10.5px] text-[#999] hover:text-[#333] hover:bg-[#f3f3f3] transition-colors"
        >
          + Adicionar
        </button>
      )}
    </div>
  );
}

/* ------------------------- Pending column ------------------------- */

function PendingColumn({ cards, onOpen }: { cards: CardLite[]; onOpen: (id: string) => void }) {
  return (
    <div className="w-[248px] shrink-0 bg-white border border-[#e7e7e7] rounded-lg p-2 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-2 py-1.5 shrink-0">
        <IcAlert className="size-3.5 text-danger" />
        <span className="text-[12px] font-semibold tracking-tight text-text">Materiais Pendentes</span>
        <Badge tone={cards.length ? "danger" : "neutral"} className="ml-auto">{cards.length}</Badge>
      </div>
      <div className="grid gap-2 p-1 overflow-y-auto scrollbar-clean">
        {cards.length === 0 && (
          <div className="text-[12px] text-text-3 border border-dashed border-border rounded-lg p-4 text-center">
            Sem pendências. Tudo em dia.
          </div>
        )}
        {cards.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onOpen(c.id)}
            className={cn(
              "text-left grid gap-1.5 bg-white border border-[#dedede] rounded-md p-3",
              "shadow-[inset_2px_0_0_#777] hover:border-[#bbb]",
            )}
          >
            <span className="text-[10.5px] uppercase tracking-[0.02em] text-text-3">{c.client.name}</span>
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
  );
}

function overdueLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.floor((t0.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  return `atrasado ${diff}d`;
}

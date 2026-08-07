"use client";

import * as React from "react";
import {
  DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors,
  closestCenter, DragOverlay, useDroppable,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTransition } from "react";
import { AlertTriangle, Lock } from "lucide-react";
import { moveCard } from "@/app/actions/cards";
import { PERSON_COLUMN_STATUS } from "@/lib/board-config";
import { TaskCard } from "./TaskCard";
import { EditableBoardTitle } from "./EditableBoardTitle";
import { ColumnHeader } from "./ColumnHeader";
import { AddColumnButton } from "./AddColumnButton";
import { BoardListView } from "./BoardListView";
import { ViewSwitcher, type BoardView } from "./ViewSwitcher";
import { FiltersPopover } from "./FiltersPopover";
import { StageManager } from "./StageManager";
import { emptyFilters, matchesDate, type BoardFiltersState } from "./BoardFilters";
import { Avatar, Badge, Button } from "@/components/ui/primitives";
import { IcPlus } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { BoardData, CardLite, PersonLite, FlowColumnDef } from "./types";
import { CardDialog } from "@/components/dialogs/CardDialog";

// ---------------- Column model ----------------

type PersonColumn = { kind: "person"; id: string; label: string; person: PersonLite };
type StageColumn  = { kind: "stage";  id: string; label: string; stage: FlowColumnDef };
type BoardColumn  = PersonColumn | StageColumn;

const dropId = (col: BoardColumn) => (col.kind === "person" ? `person::${col.person.id}` : `stage::${col.stage.key}`);
const parseDropId = (id: string): { kind: "person" | "stage"; key: string } | null => {
  const [kind, key] = id.split("::");
  if (kind !== "person" && kind !== "stage") return null;
  return { kind, key };
};

// ---------------- Component ----------------

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
  const restrictedStageKeys = React.useMemo(
    () => new Set(flow.filter((s) => s.restrictToManagers).map((s) => s.key)),
    [flow],
  );

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

  // ------------ Materiais Pendentes (lens, independente de filtros) ------------
  const overdueOrPending = React.useMemo(() => cards
    .filter((c) => {
      if (c.status === "FINALIZADO") return false;
      if (c.pendenteMaterial) return true;
      if (!c.deadline) return false;
      return new Date(c.deadline) < todayStart;
    })
    .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? "")),
  [cards, todayStart]);

  // ------------ Colunas do board (flat) ------------
  const columns: BoardColumn[] = React.useMemo(() => {
    const personCols: PersonColumn[] = visibleMembers.map((m) => ({
      kind: "person",
      id: `person::${m.person.id}`,
      label: m.person.name,
      person: m.person,
    }));
    const stageCols: StageColumn[] = flow.map((s) => ({
      kind: "stage",
      id: `stage::${s.key}`,
      label: s.label,
      stage: s,
    }));
    return [...personCols, ...stageCols];
  }, [visibleMembers, flow]);

  // ------------ Cards por coluna ------------
  const cardsByColumn = React.useMemo(() => {
    const map = new Map<string, CardLite[]>();
    for (const col of columns) map.set(col.id, []);
    for (const c of filteredCards) {
      const key = c.status === PERSON_COLUMN_STATUS
        ? `person::${c.responsibleId}`
        : `stage::${c.status}`;
      if (map.has(key)) map.get(key)!.push(c);
    }
    for (const [, arr] of map) arr.sort((a, b) => a.order - b.order);
    return map;
  }, [filteredCards, columns]);

  const activeCard = activeId ? cards.find((c) => c.id === activeId) : null;

  // ------------ Permissão de drop (client-side) ------------
  const canDropOn = React.useCallback((source: CardLite, col: BoardColumn): boolean => {
    const isOwn = source.responsibleId === currentUserId;
    if (!canManage && !isOwn) return false;
    if (col.kind === "person") {
      if (!canManage && col.person.id !== currentUserId) return false;
      return true;
    }
    if (col.stage.restrictToManagers && !canManage) return false;
    return true;
  }, [canManage, currentUserId]);

  // ------------ Drag & Drop ------------
  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)); }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const source = cards.find((c) => c.id === active.id);
    if (!source) return;

    // Descobre a coluna destino: pode vir do container (dropId) ou de um card (herda coluna do card alvo).
    let targetCol: BoardColumn | undefined;
    let overCard: CardLite | undefined;

    if (over.data.current?.type === "column") {
      targetCol = columns.find((c) => c.id === String(over.id));
    } else {
      overCard = cards.find((c) => c.id === over.id);
      if (overCard) {
        const key = overCard.status === PERSON_COLUMN_STATUS
          ? `person::${overCard.responsibleId}`
          : `stage::${overCard.status}`;
        targetCol = columns.find((c) => c.id === key);
      }
    }
    if (!targetCol) return;

    if (!canDropOn(source, targetCol)) return;

    // Novo status/responsável conforme coluna alvo.
    const toStatus = targetCol.kind === "person" ? PERSON_COLUMN_STATUS : targetCol.stage.key;
    const toResponsibleId = targetCol.kind === "person" ? targetCol.person.id : source.responsibleId;

    // Optimistic update.
    setCards((prev) => {
      const withoutActive = prev.filter((c) => c.id !== source.id);
      const targetList = withoutActive
        .filter((c) => (
          targetCol!.kind === "person"
            ? c.status === PERSON_COLUMN_STATUS && c.responsibleId === toResponsibleId
            : c.status === targetCol!.stage.key
        ))
        .sort((a, b) => a.order - b.order);
      const insertAt = overCard ? targetList.findIndex((c) => c.id === overCard!.id) : targetList.length;
      const before = insertAt > 0 ? targetList[insertAt - 1] : null;
      const after  = insertAt >= 0 && insertAt < targetList.length ? targetList[insertAt] : null;
      const newOrder = before && after ? (before.order + after.order) / 2
        : before ? before.order + 1000
        : after ? after.order - 1000
        : 1000;
      return withoutActive.concat({
        ...source, status: toStatus, responsibleId: toResponsibleId, order: newOrder,
      });
    });

    startTransition(async () => {
      try {
        const list = cards
          .filter((c) => (
            targetCol!.kind === "person"
              ? c.status === PERSON_COLUMN_STATUS && c.responsibleId === toResponsibleId
              : c.status === targetCol!.stage.key
          ) && c.id !== source.id)
          .sort((a, b) => a.order - b.order);
        const idx = overCard ? list.findIndex((c) => c.id === overCard!.id) : list.length;
        await moveCard({
          cardId: source.id,
          toStatus,
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
        {view === "list" ? (
          <BoardListView cards={filteredCards} flow={flow} onOpen={setOpenCardId} />
        ) : (
          <DndContext id="board-dnd" sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <div className="h-full flex gap-3 overflow-x-auto scrollbar-clean pb-2">
              <PendingColumn cards={overdueOrPending} onOpen={setOpenCardId} />

              {columns.map((col) => {
                const list = cardsByColumn.get(col.id) ?? [];
                return (
                  <BoardColumnView
                    key={col.id}
                    column={col}
                    cards={list}
                    stageMap={stageMap}
                    onOpen={setOpenCardId}
                    onAdd={canManage ? () => setCreating({
                      open: true,
                      status: col.kind === "stage" ? col.stage.key : PERSON_COLUMN_STATUS,
                      responsibleId: col.kind === "person" ? col.person.id : undefined,
                    }) : undefined}
                    canEdit={canManage}
                    boardTeamId={data.team.id}
                    stageNeighbors={col.kind === "stage" ? getStageNeighbors(flow, col.stage.key) : undefined}
                    restrictedForCurrentUser={col.kind === "stage" && restrictedStageKeys.has(col.stage.key) && !canManage}
                  />
                );
              })}

              {canManage && (
                <div className="w-[240px] shrink-0 pt-1">
                  <AddColumnButton teamId={data.team.id} />
                </div>
              )}
            </div>

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
        )}
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

/* ------------------------- Board column ------------------------- */

function BoardColumnView({
  column, cards, stageMap, onOpen, onAdd, canEdit, boardTeamId, stageNeighbors, restrictedForCurrentUser,
}: {
  column: BoardColumn;
  cards: CardLite[];
  stageMap: Map<string, FlowColumnDef>;
  onOpen: (id: string) => void;
  onAdd?: () => void;
  canEdit: boolean;
  boardTeamId: string;
  stageNeighbors?: ReturnType<typeof getStageNeighbors>;
  restrictedForCurrentUser: boolean;
}) {
  const id = dropId(column);
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: "column" } });
  const items = React.useMemo(() => cards.map((c) => c.id), [cards]);

  return (
    <section
      className={cn(
        "w-[268px] shrink-0 bg-white border border-[#e7e7e7] rounded-lg overflow-hidden flex flex-col transition-colors duration-100",
        isOver && !restrictedForCurrentUser && "outline outline-1 outline-accent/50 outline-offset-[-1px] bg-accent/5",
        restrictedForCurrentUser && "opacity-85",
      )}
    >
      {column.kind === "person" ? (
        <PersonColumnHeader person={column.person} count={cards.length} />
      ) : (
        <ColumnHeader
          id={column.stage.id}
          label={column.stage.label}
          count={cards.length}
          tone={column.stage.tone}
          canEdit={canEdit}
          neighbors={stageNeighbors ?? { prev: null, prevPrev: null, next: null, nextNext: null }}
          restrictToManagers={column.stage.restrictToManagers}
          teamId={boardTeamId}
        />
      )}

      <div ref={setNodeRef} className="flex-1 min-h-0 overflow-y-auto scrollbar-clean grid gap-2 p-2 content-start">
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
          <div className="text-[10.5px] text-[#a5a5a5] border border-dashed border-[#eaeaea] rounded-md p-4 text-center">
            {restrictedForCurrentUser ? (
              <span className="inline-flex items-center gap-1"><Lock className="size-3" /> Somente gestão</span>
            ) : (
              <span>Sem tarefas</span>
            )}
          </div>
        )}
      </div>

      {onAdd && !restrictedForCurrentUser && (
        <button
          type="button"
          onClick={onAdd}
          className="h-8 text-left px-3 text-[10.5px] text-[#888] hover:text-[#222] hover:bg-[#f5f5f5] border-t border-[#f0f0f0] transition-colors"
        >
          + Adicionar tarefa
        </button>
      )}
    </section>
  );
}

function PersonColumnHeader({ person, count }: { person: PersonLite; count: number }) {
  return (
    <header className="h-11 shrink-0 px-3 flex items-center gap-2 border-b border-[#e8e8e8] bg-[#fafafa]">
      <Avatar size="sm" initials={person.initials} colorKey={person.color} className="border-0" />
      <span className="text-[10.5px] font-semibold uppercase tracking-[.055em] text-[#333] truncate flex-1">
        {person.name}
      </span>
      <span className="min-w-5 h-5 px-1.5 rounded bg-[#e9e9e9] grid place-items-center text-[9.5px] tabular text-[#666]">
        {count}
      </span>
    </header>
  );
}

function getStageNeighbors(flow: FlowColumnDef[], key: string) {
  const idx = flow.findIndex((s) => s.key === key);
  const at = (n: number) => (flow[n] ? { id: flow[n].id, order: flow[n].order } : null);
  return {
    prev: at(idx - 1),
    prevPrev: at(idx - 2),
    next: at(idx + 1),
    nextNext: at(idx + 2),
  };
}

/* ------------------------- Pending column (lens) ------------------------- */

function PendingColumn({ cards, onOpen }: { cards: CardLite[]; onOpen: (id: string) => void }) {
  return (
    <section className="w-[268px] shrink-0 bg-white border border-[#e7e7e7] rounded-lg overflow-hidden flex flex-col">
      <header
        className="px-3 py-2.5 flex items-center gap-2 text-white shrink-0"
        style={{ background: "var(--danger-strong)" }}
      >
        <AlertTriangle className="size-3.5" strokeWidth={1.8} />
        <span className="text-[11.5px] font-semibold tracking-tight">Materiais Pendentes</span>
        <Badge className="ml-auto !bg-white/20 !text-white !border-transparent">{cards.length}</Badge>
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
            className="text-left grid gap-1.5 bg-white border rounded-md p-3"
            style={{
              borderColor: "color-mix(in oklab, var(--danger-strong) 45%, transparent)",
              boxShadow: "inset 2px 0 0 var(--danger-strong)",
            }}
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
    </section>
  );
}

function overdueLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.floor((t0.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  return `atrasado ${diff}d`;
}

"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/cn";
import { TaskCard } from "./TaskCard";
import { IconButton } from "@/components/ui/primitives";
import { IcPlus } from "@/components/icons";
import type { CardLite } from "./types";
import type { StatusDef } from "@/lib/board-config";

export function FlowColumn({
  id, cards, flow, teamName, onOpen, onAdd,
}: {
  id: string;
  cards: CardLite[];
  flow?: StatusDef[];
  teamName?: string;
  onOpen: (cardId: string) => void;
  onAdd?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: "column" } });
  const items = React.useMemo(() => cards.map((c) => c.id), [cards]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[80px] rounded-md p-1 grid gap-1.5 content-start",
        "transition-colors duration-100",
        isOver && "bg-accent/6 outline outline-1 outline-accent/40",
      )}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {cards.map((c) => (
          <TaskCard key={c.id} card={c} isDone={c.status === "FINALIZADO"} statusLabel={flow?.find((status) => status.key === c.status)?.label} teamName={teamName} onOpen={onOpen} />
        ))}
      </SortableContext>
      {onAdd && (
        <IconButton
          onClick={onAdd}
          aria-label="Adicionar demanda nesta coluna"
          className="w-full h-8 text-text-3 hover:text-text border border-dashed border-transparent hover:border-border rounded-md"
        >
          <IcPlus className="size-3.5" />
        </IconButton>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { BoardFilters, hasAnyFilter, type BoardFiltersState } from "./BoardFilters";
import type { FlowColumnDef, PersonLite } from "./types";

type Props = {
  filters: BoardFiltersState;
  onChange: (next: BoardFiltersState) => void;
  onClear: () => void;
  people: PersonLite[];
  flow: FlowColumnDef[];
  matchedCount: number;
  totalCount: number;
  currentUserIsResponsible: boolean;
};

export function FiltersPopover(props: Props) {
  const active = hasAnyFilter(props.filters);
  const count =
    (props.filters.onlyMe ? 1 : 0) +
    (props.filters.personIds.length > 0 ? 1 : 0) +
    (props.filters.statusKeys.length > 0 ? 1 : 0) +
    (props.filters.date !== "all" ? 1 : 0);

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[11.5px] font-medium border transition-colors",
            active
              ? "bg-[#eef4ff] text-[#0b3d91] border-[#c9dcff]"
              : "bg-white text-[#555] border-[#e0e0e0] hover:border-[#c0c0c0] hover:text-[#111]",
          )}
        >
          <Filter className="size-3.5" />
          Filtro
          {active && (
            <span className="grid place-items-center min-w-[16px] h-4 px-1 rounded-full bg-[#0b3d91] text-white text-[9px] font-semibold tabular">
              {count}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-40 w-[min(560px,calc(100vw-32px))] rounded-lg border border-border bg-surface shadow-e4 overflow-hidden"
          style={{ animation: "contentShow 140ms cubic-bezier(.2,0,0,1)" }}
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-hairline">
            <div className="text-[11px] font-semibold tracking-tight text-text">Filtrar demandas</div>
            {active && (
              <button
                type="button"
                onClick={props.onClear}
                className="inline-flex items-center gap-1 text-[10.5px] text-text-3 hover:text-text"
              >
                <X className="size-3" /> Limpar tudo
              </button>
            )}
          </div>
          <BoardFilters
            filters={props.filters}
            onChange={props.onChange}
            people={props.people}
            flow={props.flow}
            matchedCount={props.matchedCount}
            totalCount={props.totalCount}
            currentUserIsResponsible={props.currentUserIsResponsible}
            embedded
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

"use client";

import { KanbanSquare, List } from "lucide-react";
import { cn } from "@/lib/cn";

export type BoardView = "board" | "list";

export function ViewSwitcher({ value, onChange }: { value: BoardView; onChange: (v: BoardView) => void }) {
  return (
    <div className="inline-flex items-center h-8 p-0.5 rounded-full bg-white border border-[#e0e0e0]">
      <Option active={value === "board"} onClick={() => onChange("board")}>
        <KanbanSquare className="size-3.5" /> Quadro
      </Option>
      <Option active={value === "list"} onClick={() => onChange("list")}>
        <List className="size-3.5" /> Lista
      </Option>
    </div>
  );
}

function Option({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[11.5px] font-medium tracking-tight transition-colors",
        active ? "bg-[#171717] text-white" : "text-[#666] hover:text-[#111]",
      )}
    >
      {children}
    </button>
  );
}

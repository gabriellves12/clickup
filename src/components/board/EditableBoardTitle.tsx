"use client";

import * as React from "react";
import { useTransition } from "react";
import { Check, Pencil, X } from "lucide-react";
import { renameBoard } from "@/app/actions/boards";
import { cn } from "@/lib/cn";

export function EditableBoardTitle({
  boardId, name, canEdit,
}: { boardId: string; name: string; canEdit: boolean }) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(name);
  const [pending, startTransition] = useTransition();
  React.useEffect(() => setValue(name), [name]);

  if (!canEdit || !editing) {
    return (
      <div className="group inline-flex items-center gap-2 min-w-0">
        <h1 className="text-[18px] font-semibold tracking-[-0.025em] text-text truncate">{name}</h1>
        {canEdit && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Renomear quadro"
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 grid place-items-center size-7 rounded-md text-text-3 hover:text-text hover:bg-surface-2 transition-opacity"
          >
            <Pencil className="size-3.5" />
          </button>
        )}
      </div>
    );
  }

  function save() {
    const clean = value.trim();
    if (!clean || clean === name) { setEditing(false); return; }
    startTransition(async () => {
      try { await renameBoard({ id: boardId, name: clean }); setEditing(false); }
      catch { setValue(name); setEditing(false); }
    });
  }

  return (
    <div className="inline-flex items-center gap-1 min-w-0">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          else if (e.key === "Escape") { setValue(name); setEditing(false); }
        }}
        onBlur={save}
        disabled={pending}
        className={cn(
          "text-[18px] font-semibold tracking-[-0.025em] text-text",
          "h-8 px-2 rounded-md border border-border-strong bg-surface min-w-0 w-[260px]",
          "focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/25",
        )}
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={save}
        aria-label="Salvar"
        className="grid place-items-center size-7 rounded-md text-text-3 hover:text-text hover:bg-surface-2"
      >
        <Check className="size-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => { setValue(name); setEditing(false); }}
        aria-label="Cancelar"
        className="grid place-items-center size-7 rounded-md text-text-3 hover:text-text hover:bg-surface-2"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

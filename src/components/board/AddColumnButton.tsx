"use client";

import * as React from "react";
import { useTransition } from "react";
import { Plus, X } from "lucide-react";
import { createColumn } from "@/app/actions/boards";
import { cn } from "@/lib/cn";

export function AddColumnButton({ teamId }: { teamId: string }) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    const clean = value.trim();
    if (!clean) return;
    startTransition(async () => {
      try {
        await createColumn({ teamId, label: clean });
        setValue(""); setOpen(false);
      } catch (err) { alert(err instanceof Error ? err.message : "Erro ao criar coluna."); }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "w-[220px] h-11 shrink-0 rounded-lg border border-dashed border-[#d5d5d5] text-[#888]",
          "hover:border-[#a3a3a3] hover:text-[#333] hover:bg-white transition-colors",
          "flex items-center justify-center gap-1.5 text-[11px] font-medium",
        )}
      >
        <Plus className="size-3.5" />
        Adicionar coluna
      </button>
    );
  }

  return (
    <div className="w-[220px] h-11 shrink-0 rounded-lg border border-[#d5d5d5] bg-white p-1.5 flex items-center gap-1">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          else if (e.key === "Escape") { setValue(""); setOpen(false); }
        }}
        disabled={pending}
        placeholder="Nome da coluna"
        className="flex-1 min-w-0 h-full px-2 text-[11.5px] bg-transparent focus:outline-none"
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => { setValue(""); setOpen(false); }}
        aria-label="Cancelar"
        className="grid place-items-center size-6 rounded text-text-3 hover:text-text hover:bg-surface-2"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

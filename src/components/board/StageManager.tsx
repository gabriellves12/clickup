"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { useTransition } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Layers, Pencil, Plus, Trash2, X } from "lucide-react";
import { createColumn, deleteColumn, renameColumn, reorderColumn } from "@/app/actions/boards";
import { cn } from "@/lib/cn";
import type { FlowColumnDef } from "./types";

function toneDot(tone: string | null | undefined): string {
  switch (tone) {
    case "doing":  return "bg-accent";
    case "review": return "bg-[color:var(--warning)]";
    case "done":   return "bg-[color:var(--success)]";
    case "warn":   return "bg-[color:var(--warning)]";
    case "info":   return "bg-[color:var(--info)]";
    default:       return "bg-[#bbb]";
  }
}

export function StageManager({ teamId, flow }: { teamId: string; flow: FlowColumnDef[] }) {
  const sorted = React.useMemo(() => [...flow].sort((a, b) => a.order - b.order), [flow]);

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[11.5px] font-medium border bg-white text-[#555] border-[#e0e0e0] hover:border-[#c0c0c0] hover:text-[#111] transition-colors"
        >
          <Layers className="size-3.5" />
          Etapas
          <span className="text-[10px] tabular text-[#888]">({flow.length})</span>
          <ChevronDown className="size-3" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-40 w-[320px] rounded-lg border border-border bg-surface shadow-e4 overflow-hidden"
          style={{ animation: "contentShow 140ms cubic-bezier(.2,0,0,1)" }}
        >
          <div className="px-4 py-2.5 border-b border-hairline">
            <div className="text-[11px] font-semibold tracking-tight text-text">Etapas do quadro</div>
            <div className="text-[10px] text-text-3 mt-0.5">Renomeie, reordene, adicione ou remova.</div>
          </div>

          <div className="max-h-[360px] overflow-y-auto p-1">
            {sorted.map((col, idx) => (
              <StageRow
                key={col.id}
                col={col}
                canMoveUp={idx > 0}
                canMoveDown={idx < sorted.length - 1}
                prevId={sorted[idx - 1]?.id ?? null}
                prevPrevId={sorted[idx - 2]?.id ?? null}
                nextId={sorted[idx + 1]?.id ?? null}
                nextNextId={sorted[idx + 2]?.id ?? null}
              />
            ))}
          </div>

          <div className="border-t border-hairline p-2">
            <AddStage teamId={teamId} />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function StageRow({
  col, canMoveUp, canMoveDown, prevId, prevPrevId, nextId, nextNextId,
}: {
  col: FlowColumnDef;
  canMoveUp: boolean;
  canMoveDown: boolean;
  prevId: string | null;
  prevPrevId: string | null;
  nextId: string | null;
  nextNextId: string | null;
}) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(col.label);
  const [pending, startTransition] = useTransition();
  React.useEffect(() => setValue(col.label), [col.label]);

  function save() {
    const clean = value.trim();
    if (!clean || clean === col.label) { setEditing(false); return; }
    startTransition(async () => {
      try { await renameColumn({ id: col.id, label: clean }); setEditing(false); }
      catch { setValue(col.label); setEditing(false); }
    });
  }

  function move(direction: "up" | "down") {
    startTransition(async () => {
      try {
        if (direction === "up") {
          await reorderColumn({ id: col.id, beforeId: prevPrevId, afterId: prevId });
        } else {
          await reorderColumn({ id: col.id, beforeId: nextId, afterId: nextNextId });
        }
      } catch (err) { console.error(err); }
    });
  }

  function handleDelete() {
    if (!confirm(`Excluir a etapa "${col.label}"?\n\nDemandas usando esta etapa impedem a exclusão.`)) return;
    startTransition(async () => {
      try { await deleteColumn(col.id); }
      catch (err) { alert(err instanceof Error ? err.message : "Não foi possível excluir."); }
    });
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-[#fafafa] group">
      <span className={cn("size-2 rounded-full shrink-0", toneDot(col.tone))} aria-hidden />
      {editing ? (
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            else if (e.key === "Escape") { setValue(col.label); setEditing(false); }
          }}
          onBlur={save}
          disabled={pending}
          className="flex-1 h-6 px-1 text-[11.5px] border-b border-accent bg-transparent focus:outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex-1 text-left text-[11.5px] text-[#333] truncate"
        >
          {col.label}
        </button>
      )}
      <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-0.5">
        <IconBtn onClick={() => setEditing(true)} label="Renomear"><Pencil className="size-3" /></IconBtn>
        <IconBtn onClick={() => move("up")} disabled={!canMoveUp || pending} label="Mover para cima"><ChevronLeft className="size-3 -rotate-90" /></IconBtn>
        <IconBtn onClick={() => move("down")} disabled={!canMoveDown || pending} label="Mover para baixo"><ChevronRight className="size-3 -rotate-90" /></IconBtn>
        <IconBtn onClick={handleDelete} disabled={pending} label="Excluir" destructive><Trash2 className="size-3" /></IconBtn>
      </div>
    </div>
  );
}

function IconBtn({
  children, onClick, disabled, label, destructive,
}: { children: React.ReactNode; onClick: () => void; disabled?: boolean; label: string; destructive?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "grid place-items-center size-6 rounded transition-colors",
        disabled ? "opacity-30 cursor-not-allowed" : "hover:bg-[#eee]",
        destructive ? "text-[color:var(--danger)]" : "text-[#666] hover:text-[#111]",
      )}
    >
      {children}
    </button>
  );
}

function AddStage({ teamId }: { teamId: string }) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    const clean = value.trim();
    if (!clean) return;
    startTransition(async () => {
      try { await createColumn({ teamId, label: clean }); setValue(""); setOpen(false); }
      catch (err) { alert(err instanceof Error ? err.message : "Erro ao criar etapa."); }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded text-[11px] font-medium text-[#666] hover:bg-[#f2f2f2] hover:text-[#111] transition-colors"
      >
        <Plus className="size-3" /> Adicionar etapa
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          else if (e.key === "Escape") { setValue(""); setOpen(false); }
        }}
        placeholder="Nome da etapa"
        disabled={pending}
        className="flex-1 min-w-0 h-8 px-2 text-[11.5px] rounded border border-border-strong bg-surface focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/25"
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => { setValue(""); setOpen(false); }}
        className="grid place-items-center size-8 rounded text-text-3 hover:text-text hover:bg-surface-2"
        aria-label="Cancelar"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

"use client";

import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronLeft, ChevronRight, Lock, MoreHorizontal, Pencil, Trash2, Unlock } from "lucide-react";
import { useTransition } from "react";
import { cn } from "@/lib/cn";
import { deleteColumn, renameColumn, reorderColumn, setColumnRestriction } from "@/app/actions/boards";

type Neighbor = { id: string; order: number } | null;

type Props = {
  id: string;
  label: string;
  count: number;
  tone?: string | null;
  canEdit: boolean;
  neighbors: {
    prev: Neighbor;
    prevPrev: Neighbor;
    next: Neighbor;
    nextNext: Neighbor;
  };
  restrictToManagers?: boolean;
  teamId?: string;
};

export function ColumnHeader({ id, label, count, tone, canEdit, neighbors, restrictToManagers = false, teamId: _teamId }: Props) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(label);
  const [pending, startTransition] = useTransition();
  React.useEffect(() => setValue(label), [label]);

  const toneColor = toneToColor(tone);

  function save() {
    const clean = value.trim();
    if (!clean || clean === label) { setEditing(false); return; }
    startTransition(async () => {
      try { await renameColumn({ id, label: clean }); setEditing(false); }
      catch { setValue(label); setEditing(false); }
    });
  }

  function move(direction: "prev" | "next") {
    startTransition(async () => {
      try {
        if (direction === "prev") {
          // Move para antes do prev: novo lugar entre prevPrev e prev.
          await reorderColumn({
            id,
            beforeId: neighbors.prevPrev?.id ?? null,
            afterId: neighbors.prev?.id ?? null,
          });
        } else {
          // Move para depois do next: novo lugar entre next e nextNext.
          await reorderColumn({
            id,
            beforeId: neighbors.next?.id ?? null,
            afterId: neighbors.nextNext?.id ?? null,
          });
        }
      } catch (err) { console.error(err); }
    });
  }

  async function handleDelete() {
    if (!confirm(`Excluir a coluna "${label}"?\n\nDemandas nela impedem a exclusão.`)) return;
    startTransition(async () => {
      try { await deleteColumn(id); }
      catch (err) {
        alert(err instanceof Error ? err.message : "Não foi possível excluir.");
      }
    });
  }

  function toggleRestriction() {
    startTransition(async () => {
      try { await setColumnRestriction({ id, restrictToManagers: !restrictToManagers }); }
      catch (err) { alert(err instanceof Error ? err.message : "Não foi possível atualizar."); }
    });
  }

  return (
    <header className="group h-11 shrink-0 px-3 flex items-center gap-2 border-b border-[#e8e8e8] bg-[#fafafa]">
      <span className={cn("size-2 rounded-full shrink-0", toneColor.dot)} aria-hidden />
      {restrictToManagers && (
        <Lock className="size-3 text-[#a09990]" aria-label="Somente gestão" />
      )}
      {editing ? (
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            else if (e.key === "Escape") { setValue(label); setEditing(false); }
          }}
          onBlur={save}
          disabled={pending}
          className="flex-1 h-6 text-[10.5px] font-semibold uppercase tracking-[.055em] text-[#333] border-b border-accent bg-transparent focus:outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => canEdit && setEditing(true)}
          disabled={!canEdit}
          className={cn(
            "text-left text-[10.5px] font-semibold uppercase tracking-[.055em] text-[#333] truncate flex-1",
            canEdit && "hover:text-[#111] cursor-text",
          )}
        >
          {label}
        </button>
      )}
      <span className="min-w-5 h-5 px-1.5 rounded bg-[#e9e9e9] grid place-items-center text-[9.5px] tabular text-[#666]">
        {count}
      </span>
      {canEdit && !editing && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label="Opções da coluna"
              className="grid place-items-center size-6 rounded text-text-3 hover:text-text hover:bg-[#eee] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={4}
              className="z-50 w-[180px] rounded-md border border-border bg-surface p-1 shadow-e3"
              style={{ animation: "contentShow 140ms cubic-bezier(.2,0,0,1)" }}
            >
              <DropdownItem onSelect={() => setEditing(true)}>
                <Pencil className="size-3.5" /> Renomear
              </DropdownItem>
              <DropdownItem
                onSelect={() => move("prev")}
                disabled={!neighbors.prev}
              >
                <ChevronLeft className="size-3.5" /> Mover para esquerda
              </DropdownItem>
              <DropdownItem
                onSelect={() => move("next")}
                disabled={!neighbors.next}
              >
                <ChevronRight className="size-3.5" /> Mover para direita
              </DropdownItem>
              <DropdownMenu.Separator className="my-1 h-px bg-hairline" />
              <DropdownItem onSelect={toggleRestriction}>
                {restrictToManagers ? <Unlock className="size-3.5" /> : <Lock className="size-3.5" />}
                {restrictToManagers ? "Liberar para membros" : "Restringir a gestão"}
              </DropdownItem>
              <DropdownMenu.Separator className="my-1 h-px bg-hairline" />
              <DropdownItem onSelect={handleDelete} destructive>
                <Trash2 className="size-3.5" /> Excluir coluna
              </DropdownItem>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
    </header>
  );
}

function DropdownItem({
  children, onSelect, disabled, destructive,
}: { children: React.ReactNode; onSelect: () => void; disabled?: boolean; destructive?: boolean }) {
  return (
    <DropdownMenu.Item
      disabled={disabled}
      onSelect={(e: Event) => { e.preventDefault(); onSelect(); }}
      className={cn(
        "flex items-center gap-2 h-8 px-2 rounded text-[11.5px] outline-none cursor-default",
        disabled ? "opacity-40" : "hover:bg-surface-2",
        destructive ? "text-danger" : "text-text",
      )}
    >
      {children}
    </DropdownMenu.Item>
  );
}

function toneToColor(tone: string | null | undefined) {
  switch (tone) {
    case "doing":  return { dot: "bg-accent" };
    case "review": return { dot: "bg-[color:var(--warning)]" };
    case "done":   return { dot: "bg-[color:var(--success)]" };
    case "warn":   return { dot: "bg-[color:var(--warning)]" };
    case "info":   return { dot: "bg-[color:var(--info)]" };
    default:       return { dot: "bg-[#bbb]" };
  }
}

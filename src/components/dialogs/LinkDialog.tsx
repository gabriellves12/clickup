"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useTransition } from "react";
import { Button, Field, Input, Select } from "@/components/ui/primitives";
import { IcClose, IcTrash } from "@/components/icons";
import { LINK_CATEGORIES } from "@/lib/board-config";
import { createLinkItem, deleteLinkItem, updateLinkItem } from "@/app/actions/links";
import type { LinkItemLite } from "@/components/board/types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clientId?: string;
  parentId?: string | null;
  item?: LinkItemLite;
  currentTeamSlug: string;
};

export function LinkDialog({ open, onOpenChange, clientId, parentId, item, currentTeamSlug }: Props) {
  const [pending, startTransition] = useTransition();
  const editing = !!item;

  const initial = React.useMemo(() => ({
    category: item?.category ?? "drive",
    label: item?.label ?? "",
    url: item?.url ?? "",
    observation: item?.observation ?? "",
  }), [item, open]);

  const [form, setForm] = React.useState(initial);
  React.useEffect(() => setForm(initial), [initial]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.label.trim()) return;
    startTransition(async () => {
      if (editing && item) {
        await updateLinkItem({
          id: item.id, label: form.label, url: form.url || null,
          observation: form.observation || null, category: form.category,
          currentTeamSlug,
        });
      } else if (clientId) {
        await createLinkItem({
          clientId, category: form.category, label: form.label,
          url: form.url || undefined, observation: form.observation || undefined,
          parentId: parentId ?? null, currentTeamSlug,
        });
      }
      onOpenChange(false);
    });
  }

  function handleDelete() {
    if (!item) return;
    if (!confirm("Remover este acesso?")) return;
    startTransition(async () => {
      await deleteLinkItem(item.id, currentTeamSlug);
      onOpenChange(false);
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          style={{ animation: "overlayShow 150ms cubic-bezier(.2,0,0,1)" }}
        />
        <Dialog.Content
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(480px,calc(100vw-32px))] bg-surface border border-border rounded-2xl shadow-e5 p-6"
          style={{ animation: "contentShow 180ms cubic-bezier(.2,0,0,1)" }}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <Dialog.Title className="text-[17px] font-semibold tracking-tight">
                {editing ? "Editar acesso" : "Adicionar acesso"}
              </Dialog.Title>
              <Dialog.Description className="text-[13px] text-text-2 mt-1">
                URL, categoria e observação (opcional).
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button aria-label="Fechar" className="p-1 rounded-md text-text-3 hover:text-text hover:bg-surface-2">
                <IcClose className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={submit} className="grid gap-4">
            <Field label="Categoria">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {LINK_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </Select>
            </Field>
            <Field label="Rótulo">
              <Input
                autoFocus
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Ex.: Drive geral / Figma Master"
              />
            </Field>
            <Field label="URL (opcional)">
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://…"
              />
            </Field>
            <Field label="Observação (opcional)">
              <Input
                value={form.observation}
                onChange={(e) => setForm({ ...form, observation: e.target.value })}
                placeholder="login, notas, quem tem acesso…"
              />
            </Field>

            <div className="flex items-center gap-2 justify-between mt-1">
              {editing ? (
                <Button type="button" variant="ghost" onClick={handleDelete} className="text-danger hover:text-danger hover:bg-danger/10">
                  <IcTrash className="size-3.5" /> Remover
                </Button>
              ) : <span />}
              <div className="flex items-center gap-2">
                <Dialog.Close asChild>
                  <Button type="button" variant="ghost">Cancelar</Button>
                </Dialog.Close>
                <Button type="submit" variant="primary" disabled={pending}>
                  {pending ? "Salvando…" : editing ? "Salvar" : "Adicionar"}
                </Button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

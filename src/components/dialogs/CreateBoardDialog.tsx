"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useTransition } from "react";
import { Button, Field, Input, Select } from "@/components/ui/primitives";
import { IcClose } from "@/components/icons";
import { createBoard } from "@/app/actions/boards";

type ClientOption = { id: string; name: string };

export function CreateBoardDialog({
  open, onOpenChange, kind, clients = [],
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind: "TEAM" | "CLIENT";
  clients?: ClientOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = React.useState("");
  const [clientId, setClientId] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) { setName(""); setClientId(""); setError(null); }
    else if (kind === "CLIENT" && clients[0] && !clientId) setClientId(clients[0].id);
  }, [open, kind, clients, clientId]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Informe o nome do quadro."); return; }
    if (kind === "CLIENT" && !clientId) { setError("Selecione um cliente."); return; }
    startTransition(async () => {
      try {
        await createBoard({ name, kind, clientId: kind === "CLIENT" ? clientId : undefined });
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar quadro.");
      }
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
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(440px,calc(100vw-32px))] bg-white border border-[#e6e6e6] rounded-2xl shadow-e5 p-6"
          style={{ animation: "contentShow 180ms cubic-bezier(.2,0,0,1)" }}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <Dialog.Title className="text-[16px] font-semibold tracking-tight">
                {kind === "TEAM" ? "Novo quadro de time" : "Novo quadro de cliente"}
              </Dialog.Title>
              <Dialog.Description className="text-[12.5px] text-text-2 mt-1">
                {kind === "TEAM"
                  ? "Define um quadro operacional com colunas padrão (que você pode ajustar depois)."
                  : "Cria um quadro dedicado ao cliente escolhido, com fluxo pré-configurado."}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button aria-label="Fechar" className="p-1 rounded-md text-text-3 hover:text-text hover:bg-surface-2">
                <IcClose className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={submit} className="grid gap-3">
            <Field label="Nome do quadro">
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={kind === "TEAM" ? "Ex.: Social Media" : "Deixe como o nome do cliente"}
              />
            </Field>
            {kind === "CLIENT" && (
              <Field label="Cliente">
                <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                  {clients.length === 0 && <option value="">Nenhum cliente cadastrado</option>}
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
            )}

            {error && (
              <div className="text-[12px] px-3 py-2 rounded-md bg-danger/10 text-danger border border-danger/20">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 justify-end mt-2">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost">Cancelar</Button>
              </Dialog.Close>
              <Button type="submit" variant="primary" disabled={pending}>
                {pending ? "Criando…" : "Criar quadro"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

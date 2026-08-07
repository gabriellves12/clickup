"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Copy, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, IconButton } from "@/components/ui/primitives";
import { CategoryIcon, IcClose, IcExternal } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { ClientRow } from "@/lib/clients-data";
import { createLinkItem } from "@/app/actions/links";

const fmtMonth = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

function monthsBetween(from: Date, to: Date) {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

function formatDuration(months: number) {
  if (months < 1) return "menos de 1 mês";
  if (months < 12) return `${months} ${months === 1 ? "mês" : "meses"}`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const y = `${years} ${years === 1 ? "ano" : "anos"}`;
  if (rest === 0) return y;
  return `${y} e ${rest} ${rest === 1 ? "mês" : "meses"}`;
}

const WHATSAPP_GREEN = "#25D366";

export function ClientQuickView({
  client, open, onOpenChange,
  canViewCredentials,
  canManageLinks,
  canViewWhatsapp,
}: {
  client: ClientRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  canViewCredentials: boolean;
  canManageLinks: boolean;
  canViewWhatsapp: boolean;
}) {
  const [composerOpen, setComposerOpen] = React.useState(false);
  const router = useRouter();
  if (!client) return null;

  const now = new Date();
  const start = client.startDate ? new Date(client.startDate) : null;
  const end = client.endDate ? new Date(client.endDate) : null;
  const operationMonths = start ? monthsBetween(start, end ?? now) : null;

  // Vigência do contrato
  const contractEnd = start && client.contractMonths
    ? new Date(start.getFullYear(), start.getMonth() + client.contractMonths, start.getDate())
    : null;
  const contractRemainingMonths = contractEnd ? monthsBetween(now, contractEnd) : null;

  // Separar links: "importantes" (Drive/Figma/Fotos/Insta/produtos) vs "acessos" (Cloudflare/Hosting/WP/custom)
  const importantCats = new Set(["drive", "figma", "photos", "instagram", "product"]);
  const roots = client.links.filter((l) => !l.parentId);
  const importantLinks = roots.filter((l) => importantCats.has(l.category));
  const accessLinks = roots.filter((l) => !importantCats.has(l.category));

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          style={{ animation: "overlayShow 150ms cubic-bezier(.2,0,0,1)" }}
        />
        <Dialog.Content
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[min(560px,calc(100vw-32px))] max-h-[calc(100dvh-32px)]
                     bg-surface border border-border rounded-2xl shadow-e5 flex flex-col overflow-hidden"
          style={{ animation: "contentShow 180ms cubic-bezier(.2,0,0,1)" }}
        >
          {/* Header */}
          <div className="flex items-start gap-4 p-6 pb-4 border-b border-hairline">
            <Avatar size="lg" initials={client.initials} colorKey="av-5" className="!size-14 text-[16px] border-0" />
            <div className="flex-1 min-w-0">
              <Dialog.Title className="text-[20px] font-semibold tracking-[-0.02em] text-text truncate">
                {client.name}
              </Dialog.Title>
              <Dialog.Description asChild>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <ContratoTag value={client.tipoContrato} />
                  <StatusTag value={client.status} />
                </div>
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <IconButton aria-label="Fechar"><IcClose /></IconButton>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto scrollbar-clean p-6 grid gap-5">
            {/* Responsáveis */}
            <Field label="Responsáveis">
              {client.responsibles.length === 0 ? (
                <span className="text-[12.5px] text-text-3">Sem demandas em aberto no momento.</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {client.responsibles.map((p) => (
                    <PersonChip key={p.id} name={p.name} initials={p.initials} color={p.color} />
                  ))}
                </div>
              )}
            </Field>

            {/* Tempo na operação */}
            <Field label="Tempo na operação">
              {operationMonths === null ? (
                <span className="text-[13px] text-text-3">Data de início não cadastrada.</span>
              ) : (
                <div className="grid gap-0.5">
                  <span className="text-[14px] font-medium text-text">{formatDuration(operationMonths)}</span>
                  <span className="text-[11.5px] text-text-3">
                    {start && `Desde ${capitalize(fmtMonth.format(start))}`}
                    {end && ` · Encerrado em ${capitalize(fmtMonth.format(end))}`}
                  </span>
                </div>
              )}
            </Field>

            {/* Contrato */}
            <Field label="Contrato">
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusTag value={client.status} />
                  {client.contractMonths && (
                    <span className="text-[11.5px] text-text-2">
                      Duração de <b className="font-semibold">{formatDuration(client.contractMonths)}</b>
                    </span>
                  )}
                  {contractRemainingMonths !== null && client.status === "ATIVO" && (
                    contractRemainingMonths > 0 ? (
                      <span className="text-[11.5px] text-text-3">
                        · vence em {formatDuration(contractRemainingMonths)}
                      </span>
                    ) : (
                      <span className="text-[11.5px] text-danger font-medium">
                        · vencido há {formatDuration(Math.abs(contractRemainingMonths))}
                      </span>
                    )
                  )}
                </div>
                {client.contractUrl ? (
                  <LinkChip href={client.contractUrl} label="Abrir contrato" />
                ) : (
                  <span className="text-[11.5px] text-text-3">Contrato não anexado.</span>
                )}
              </div>
            </Field>

            {/* Links importantes */}
            <Field label="Links importantes">
              {importantLinks.length === 0 ? (
                <span className="text-[12.5px] text-text-3">Sem links cadastrados.</span>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {importantLinks.map((l) => (
                    <ResourceCard key={l.id} link={l} />
                  ))}
                </div>
              )}
              {canManageLinks && <button type="button" onClick={() => setComposerOpen(true)} className="mt-2 flex min-h-12 w-full items-center gap-2 rounded-lg border border-dashed border-border-strong px-3 text-left text-[10px] font-medium text-text-2 transition-colors hover:border-text-3 hover:bg-surface-2 hover:text-text"><span className="grid size-6 place-items-center rounded-md bg-surface-2 text-[15px] leading-none">+</span><span>Adicionar foto, Figma, Drive, produto ou acesso</span></button>}
            </Field>

            {/* Acesso */}
            <Field label="Acesso">
              {accessLinks.length === 0 ? (
                <span className="text-[12.5px] text-text-3">Nenhum acesso cadastrado.</span>
              ) : (
                <div className="grid gap-1">
                  {accessLinks.map((l) => (
                    <AccessCard key={l.id} link={l} canViewCredentials={canViewCredentials} />
                  ))}
                </div>
              )}
            </Field>

            {/* WhatsApp — restrito à Administração e Gestão */}
            {canViewWhatsapp && <Field label="Grupo do WhatsApp">
              {client.whatsappUrl ? (
                <a
                  href={client.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 h-9 pl-2.5 pr-3 rounded-full bg-surface-2 hover:bg-surface-3 text-text no-underline hover:no-underline transition-colors"
                >
                  <span
                    aria-hidden
                    className="size-6 rounded-full grid place-items-center text-white"
                    style={{ background: WHATSAPP_GREEN }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
                      <path d="M20.5 3.5A11.9 11.9 0 0012.05 0C5.42 0 .05 5.37.05 12c0 2.11.55 4.17 1.6 6L0 24l6.16-1.61A11.94 11.94 0 0012.05 24C18.68 24 24 18.63 24 12c0-3.19-1.24-6.19-3.5-8.5zM12.05 22a10 10 0 01-5.1-1.4l-.36-.22-3.66.96.98-3.56-.24-.37A9.94 9.94 0 012.05 12C2.05 6.49 6.54 2 12.05 2c2.66 0 5.15 1.04 7.03 2.93A9.87 9.87 0 0122 12c0 5.51-4.44 10-9.95 10zm5.47-7.48c-.3-.15-1.77-.87-2.05-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.36.22-.66.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.79-1.67-2.09-.18-.3-.02-.46.13-.61.14-.14.3-.36.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.07-.15-.68-1.64-.93-2.24-.24-.58-.5-.5-.68-.51h-.58c-.2 0-.53.07-.8.37-.28.3-1.05 1.02-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.13 3.26 5.16 4.57.72.31 1.28.5 1.72.63.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.07-.13-.28-.2-.58-.35z" />
                    </svg>
                  </span>
                  <span className="text-[13px] font-medium">Abrir grupo</span>
                  <IcExternal className="size-3 text-text-3" />
                </a>
              ) : (
                <span className="text-[12.5px] text-text-3">Sem grupo cadastrado.</span>
              )}
            </Field>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
      <LinkComposer
        open={composerOpen}
        clientId={client.id}
        clientName={client.name}
        onOpenChange={setComposerOpen}
        onCreated={() => router.refresh()}
      />
    </Dialog.Root>
  );
}

/* ---------------- pieces ---------------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-text-3">
        {label}
      </div>
      {children}
    </div>
  );
}

function ContratoTag({ value }: { value: "FIXO" | "FREELA" }) {
  return (
    <span className={cn(
      "inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-medium border",
      value === "FIXO" ? "text-text border-border-strong" : "text-text-2 border-border",
    )}>
      {value === "FIXO" ? "Fixo" : "Freela"}
    </span>
  );
}

function StatusTag({ value }: { value: "ATIVO" | "ENCERRADO" }) {
  if (value === "ATIVO") {
    return (
      <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium bg-success/15 text-success">
        <span className="size-1.5 rounded-full bg-current" /> Ativo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium bg-surface-2 text-text-3">
      <span className="size-1.5 rounded-full bg-current" /> Encerrado
    </span>
  );
}

function PersonChip({ name, initials, color }: { name: string; initials: string; color: string }) {
  return (
    <div className="inline-flex items-center gap-2 h-8 pl-1 pr-3 rounded-full border border-border bg-surface">
      <Avatar size="sm" initials={initials} colorKey={color} className="border-0" />
      <span className="text-[12.5px] text-text">{name}</span>
    </div>
  );
}

function LinkChip({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-surface-2 hover:bg-surface-3 text-[12.5px] text-text no-underline hover:no-underline transition-colors self-start"
    >
      {label} <IcExternal className="size-3 text-text-3" />
    </a>
  );
}

type ClientLink = ClientRow["links"][number];

function ResourceCard({ link }: { link: ClientLink }) {
  const theme: Record<string, string> = {
    drive: "bg-[#edf5f3] text-[#377365] border-[#dceae5]",
    figma: "bg-[#f1edfb] text-[#6950a5] border-[#e4dcf8]",
    photos: "bg-[#f8f0e7] text-[#94633b] border-[#f0e0cf]",
    product: "bg-[#eef1f8] text-[#4a639d] border-[#dfe5f4]",
  };
  const body = (
    <div className={cn("group flex min-h-14 items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-transform hover:-translate-y-px", theme[link.category] ?? "bg-surface-2 text-text-2 border-border")}>
      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-white/70"><CategoryIcon category={link.category} className="size-3.5" /></span>
      <span className="min-w-0 flex-1"><b className="block truncate text-[11px] font-medium text-text">{link.label}</b><small className="mt-0.5 block text-[9px] opacity-70">{link.category === "figma" ? "Arquivo no Figma" : link.category === "drive" ? "Pasta no Drive" : link.category === "photos" ? "Banco de imagens" : "Produto"}</small></span>
      {link.url && <IcExternal className="size-3 shrink-0 opacity-55 transition-opacity group-hover:opacity-100" />}
    </div>
  );
  return link.url ? <a href={link.url} target="_blank" rel="noopener noreferrer" className="no-underline hover:no-underline">{body}</a> : body;
}

function AccessCard({ link, canViewCredentials }: { link: ClientLink; canViewCredentials: boolean }) {
  const isWordpress = link.category === "wordpress";
  return (
    <div className={cn("rounded-lg border p-3", isWordpress ? "border-[#d8e1ef] bg-[#f5f8fc]" : "border-border bg-surface-2/50")}>
      <div className="flex items-center gap-2.5">
        <span className={cn("grid size-7 shrink-0 place-items-center rounded-md", isWordpress ? "bg-[#e2ebf7] text-[#43658d]" : "bg-surface text-text-3 border border-border")}><CategoryIcon category={link.category} className="size-3.5" /></span>
        <div className="min-w-0 flex-1"><b className="block truncate text-[11px] font-medium text-text">{link.label}</b><span className="block text-[9px] text-text-3">{isWordpress ? "Painel WordPress" : link.category === "cloudflare" ? "Cloudflare" : "Acesso interno"}</span></div>
        {link.url && <a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-border bg-surface px-2 text-[9px] font-medium text-text-2 hover:text-text">Abrir <IcExternal className="size-3" /></a>}
      </div>
      {link.observation && <p className="mt-2 text-[9.5px] text-text-3">{link.observation}</p>}
      {canViewCredentials && (link.username || link.secret) ? (
        <div className="mt-3 grid gap-1.5 border-t border-[#dfe6ef] pt-2.5 sm:grid-cols-2">
          {link.username && <CredentialField label="Usuário" value={link.username} />}
          {link.secret && <CredentialField label="Senha" value={link.secret} secret />}
        </div>
      ) : (
        <p className="mt-2.5 inline-flex items-center gap-1.5 text-[9px] text-text-3"><LockKeyhole className="size-3" />{canViewCredentials ? "Sem credenciais cadastradas." : "Credenciais disponíveis somente para administradores."}</p>
      )}
    </div>
  );
}

function CredentialField({ label, value, secret = false }: { label: string; value: string; secret?: boolean }) {
  const [revealed, setRevealed] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  async function copyValue() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }
  return <div className="rounded-md border border-[#dce3ec] bg-white px-2 py-1.5"><div className="mb-1 flex items-center justify-between"><span className="text-[8px] font-semibold uppercase tracking-[.11em] text-text-3">{label}</span><div className="flex items-center gap-1">{secret && <button type="button" onClick={() => setRevealed((current) => !current)} className="grid size-4 place-items-center text-text-3 hover:text-text" aria-label={revealed ? "Ocultar senha" : "Exibir senha"}>{revealed ? <EyeOff className="size-3" /> : <Eye className="size-3" />}</button>}<button type="button" onClick={() => void copyValue()} className="grid size-4 place-items-center text-text-3 hover:text-text" aria-label={`Copiar ${label}`}>{copied ? <Check className="size-3 text-[#418164]" /> : <Copy className="size-3" />}</button></div></div><span className="block truncate font-mono text-[9.5px] text-text">{secret && !revealed ? "••••••••••••" : value}</span></div>;
}

type NewLinkCategory = "drive" | "figma" | "photos" | "product" | "wordpress" | "cloudflare" | "hosting" | "custom";
type NewLinkForm = { category: NewLinkCategory; label: string; url: string; observation: string; username: string; secret: string };

function LinkComposer({ open, clientId, clientName, onOpenChange, onCreated }: { open: boolean; clientId: string; clientName: string; onOpenChange: (open: boolean) => void; onCreated: () => void }) {
  const [form, setForm] = React.useState<NewLinkForm>({ category: "figma", label: "", url: "", observation: "", username: "", secret: "" });
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const isAccess = ["wordpress", "cloudflare", "hosting", "custom"].includes(form.category);
  function update<K extends keyof NewLinkForm>(key: K, value: NewLinkForm[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.label.trim()) { setError("Informe o nome deste item."); return; }
    setError(null);
    startTransition(async () => {
      try {
        await createLinkItem({ clientId, category: form.category, label: form.label, url: form.url, observation: form.observation, username: form.username, secret: form.secret });
        setForm({ category: "figma", label: "", url: "", observation: "", username: "", secret: "" });
        onOpenChange(false); onCreated();
      } catch {
        setError("Não foi possível adicionar o item. Verifique sua permissão e tente novamente.");
      }
    });
  }
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[61] w-[min(460px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-5 shadow-e5 outline-none"><Dialog.Title className="text-[17px] font-semibold tracking-[-.03em]">Adicionar ao cliente</Dialog.Title><Dialog.Description className="mt-1 text-[10.5px] text-text-3">Novo material para <b className="font-medium text-text-2">{clientName}</b>.</Dialog.Description><form className="mt-5 grid gap-3" onSubmit={submit}><label className="grid gap-1.5 text-[10px] font-medium text-text-2">Tipo de item<select value={form.category} onChange={(event) => update("category", event.target.value as NewLinkCategory)} className="field"><option value="figma">Figma</option><option value="drive">Drive</option><option value="photos">Fotos</option><option value="product">Produto</option><option value="wordpress">WordPress</option><option value="cloudflare">Cloudflare</option><option value="hosting">Hospedagem</option><option value="custom">Outro acesso</option></select></label><label className="grid gap-1.5 text-[10px] font-medium text-text-2">Nome<input value={form.label} onChange={(event) => update("label", event.target.value)} placeholder={isAccess ? "Ex.: WordPress — site institucional" : "Ex.: Pasta de fotos atualizadas"} className="field" /></label><label className="grid gap-1.5 text-[10px] font-medium text-text-2">Link<input value={form.url} onChange={(event) => update("url", event.target.value)} type="url" placeholder="https://" className="field" /></label><label className="grid gap-1.5 text-[10px] font-medium text-text-2">Observação<input value={form.observation} onChange={(event) => update("observation", event.target.value)} placeholder="Contexto ou instrução de uso (opcional)" className="field" /></label>{isAccess && <div className="grid grid-cols-2 gap-3 rounded-lg border border-[#dce5f0] bg-[#f5f8fc] p-3"><label className="grid gap-1.5 text-[10px] font-medium text-text-2">Usuário<input value={form.username} onChange={(event) => update("username", event.target.value)} placeholder="Opcional" className="field !h-8" /></label><label className="grid gap-1.5 text-[10px] font-medium text-text-2">Senha<input value={form.secret} onChange={(event) => update("secret", event.target.value)} placeholder="Opcional" className="field !h-8" /></label><p className="col-span-2 text-[9px] leading-3.5 text-text-3">Credenciais ficam disponíveis somente para administradores.</p></div>}{error && <p className="text-[10px] text-danger">{error}</p>}<div className="mt-2 flex justify-end gap-2"><Dialog.Close asChild><button type="button" className="h-8 rounded-md px-3 text-[10.5px] text-text-2 hover:bg-surface-2">Cancelar</button></Dialog.Close><button type="submit" disabled={pending} className="h-8 rounded-md bg-text px-3 text-[10.5px] font-medium text-bg disabled:opacity-50">{pending ? "Adicionando…" : "Adicionar item"}</button></div></form></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

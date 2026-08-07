"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { CategoryIcon, IcAlert, IcChevronDown, IcClose, IcExternal, IcPlus, IcTrash } from "@/components/icons";
import { createOrUpdateCard, deleteCard } from "@/app/actions/cards";
import { addComment, deleteComment, listComments, type CommentLite } from "@/app/actions/comments";
import { createClientQuick, createProductQuick } from "@/app/actions/catalog";
import { colorForClient, colorForPriority, colorForStage } from "@/lib/kanban-colors";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CardLite, ClientWithLinks, DemandTypeLite, PersonLite, ProductLite } from "@/components/board/types";
import { PERSON_COLUMN_STATUS, type StatusDef } from "@/lib/board-config";

type Props = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  editing?: CardLite;
  defaults?: { status?: string; responsibleId?: string };
  clients: ClientWithLinks[];
  products: ProductLite[];
  demandTypes: DemandTypeLite[];
  people: PersonLite[];
  currentTeamSlug: string;
  flow: StatusDef[];
  readOnly?: boolean;
};

type FormState = {
  title: string; clientId: string; productId: string; demandTypeId: string; variations: string[];
  briefing: string; copyUrl: string; referenceUrl: string; attachmentDriveUrl: string;
  externalMaterials: string; useExternalMaterials: boolean; responsibleId: string; status: string;
  startDate: string; deadline: string; priority: string; pendenteMaterial: boolean;
};

const priorities = [
  { value: "LOW", label: "Baixa" }, { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "Alta" }, { value: "URGENT", label: "Urgente" },
];

export function CardDialog({
  open, onOpenChange, editing, defaults, clients, products, demandTypes, people, currentTeamSlug, flow, readOnly = false,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [localClients, setLocalClients] = React.useState(clients);
  const [localProducts, setLocalProducts] = React.useState(products);
  const [linksOpen, setLinksOpen] = React.useState(true);
  const [titleWasEdited, setTitleWasEdited] = React.useState(Boolean(editing?.title));
  const [slideCount, setSlideCount] = React.useState(3);
  const [freeVariation, setFreeVariation] = React.useState("");
  const [quickCreate, setQuickCreate] = React.useState<"client" | "product" | null>(null);
  const [quickName, setQuickName] = React.useState("");

  const initial = React.useMemo<FormState>(() => ({
    title: editing?.title ?? "",
    clientId: editing?.clientId ?? clients[0]?.id ?? "",
    productId: editing?.productId ?? "",
    demandTypeId: editing?.demandTypeId ?? "",
    variations: editing?.variation ?? [],
    briefing: editing?.briefing ?? editing?.description ?? "",
    copyUrl: editing?.copyUrl ?? "",
    referenceUrl: editing?.referenceUrl ?? "",
    attachmentDriveUrl: editing?.attachmentDriveUrl ?? "",
    externalMaterials: editing?.externalMaterials ?? "",
    useExternalMaterials: editing?.useExternalMaterials ?? false,
    responsibleId: editing?.responsibleId ?? defaults?.responsibleId ?? people[0]?.id ?? "",
    status: editing?.status ?? defaults?.status ?? PERSON_COLUMN_STATUS,
    startDate: editing?.startDate?.slice(0, 10) ?? "",
    deadline: editing?.deadline?.slice(0, 10) ?? "",
    priority: editing?.priority ?? "NORMAL",
    pendenteMaterial: editing?.pendenteMaterial ?? false,
  }), [editing, defaults, clients, people, flow]);

  const [form, setForm] = React.useState(initial);

  // Comentários (lazy load ao abrir card em edição)
  const [comments, setComments] = React.useState<CommentLite[]>([]);
  const [commentsLoaded, setCommentsLoaded] = React.useState(false);
  React.useEffect(() => {
    if (!open || !editing?.id) { setComments([]); setCommentsLoaded(false); return; }
    let cancelled = false;
    listComments(editing.id).then((rows) => {
      if (!cancelled) { setComments(rows); setCommentsLoaded(true); }
    }).catch(() => { if (!cancelled) setCommentsLoaded(true); });
    return () => { cancelled = true; };
  }, [open, editing?.id]);

  const client = localClients.find((item) => item.id === form.clientId);
  const product = localProducts.find((item) => item.id === form.productId);
  const demand = demandTypes.find((item) => item.id === form.demandTypeId);
  const clientProducts = localProducts.filter((item) => item.clientId === form.clientId);
  const tipoProjeto = demand?.routeToWeb ? "PAGINA" : "PADRAO";
  // Quando um tipo com routeToWeb=true é escolhido, o server roteia o card para
  // o quadro Web e escolhe a coluna inicial daquele quadro. Aqui só sinalizamos.
  const willReroute = tipoProjeto === "PAGINA" && currentTeamSlug !== "web-design";
  const destFlow = flow;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));
  const toggleVariation = (value: string) => set("variations", form.variations.includes(value) ? form.variations.filter((item) => item !== value) : [...form.variations, value]);
  const generatedTitle = (clientId: string, productId: string, demandTypeId: string) => {
    const nextClient = localClients.find((item) => item.id === clientId);
    const nextProduct = localProducts.find((item) => item.id === productId);
    const nextDemand = demandTypes.find((item) => item.id === demandTypeId);
    return [nextDemand ? `[${nextDemand.prefix}]` : "", nextProduct?.name ?? "", nextClient ? `[${nextClient.name}]` : ""].filter(Boolean).join(" ");
  };
  const updateDefinition = (patch: Partial<Pick<FormState, "clientId" | "productId" | "demandTypeId" | "variations" | "status">>) => {
    setForm((current) => {
      const next = { ...current, ...patch };
      return { ...next, title: titleWasEdited ? next.title : generatedTitle(next.clientId, next.productId, next.demandTypeId) };
    });
  };

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (readOnly) return;
    if (!form.title.trim() || !form.clientId || !form.productId || !form.demandTypeId || !form.responsibleId || !form.briefing.trim()) return;
    startTransition(async () => {
      await createOrUpdateCard({
        id: editing?.id, title: form.title, clientId: form.clientId, productId: form.productId,
        demandTypeId: form.demandTypeId, variations: form.variations, briefing: form.briefing,
        description: form.briefing, copyUrl: form.copyUrl, referenceUrl: form.referenceUrl,
        attachmentDriveUrl: form.attachmentDriveUrl, externalMaterials: form.externalMaterials,
        useExternalMaterials: form.useExternalMaterials, responsibleId: form.responsibleId,
        status: form.status, tipoProjeto, startDate: form.startDate, deadline: form.deadline,
        priority: form.priority, pendenteMaterial: form.pendenteMaterial, currentTeamSlug,
      });
      // Se o server roteou o card para outro quadro (tipo página → web), leva o usuário até lá.
      if (willReroute) router.push("/board/web-design");
      onOpenChange(false);
    });
  }

  function handleDelete() {
    if (!editing || !confirm("Excluir esta demanda? A ação não pode ser desfeita.")) return;
    startTransition(async () => { await deleteCard(editing.id, currentTeamSlug); onOpenChange(false); });
  }

  function handleQuickCreate() {
    const clean = quickName.trim();
    if (!clean) return;
    startTransition(async () => {
      if (quickCreate === "client") {
        const created = await createClientQuick(clean, currentTeamSlug);
        setLocalClients((items) => [...items, { ...created, links: [] }]);
        updateDefinition({ clientId: created.id, productId: "" });
      } else if (quickCreate === "product" && client) {
        const created = await createProductQuick({ clientId: client.id, name: clean, currentTeamSlug });
        setLocalProducts((items) => [...items, created]);
        setForm((current) => ({
          ...current,
          productId: created.id,
          title: titleWasEdited
            ? current.title
            : [demand ? `[${demand.prefix}]` : "", created.name, `[${client.name}]`].filter(Boolean).join(" "),
        }));
      }
      setQuickCreate(null); setQuickName("");
    });
  }

  const centralLinks = [
    ...(client?.links.filter((link) => !link.parentId && link.category !== "product").map((link) => ({ ...link })) ?? []),
    ...(product?.driveUrl ? [{ id: "product-drive", category: "drive", label: "Drive do produto", url: product.driveUrl, observation: null, parentId: null, order: 0 }] : []),
    ...(product?.figmaUrl ? [{ id: "product-figma", category: "figma", label: "Figma do produto", url: product.figmaUrl, observation: null, parentId: null, order: 0 }] : []),
    ...(product?.photosUrl ? [{ id: "product-photos", category: "photos", label: "Pasta de fotos", url: product.photosUrl, observation: null, parentId: null, order: 0 }] : []),
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[3px] data-[state=open]:animate-[overlayShow_150ms_ease-out]" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(760px,calc(100vw-24px))] max-h-[min(88vh,900px)] rounded-xl bg-bg border border-border shadow-e5 flex flex-col outline-none data-[state=open]:animate-[contentShow_180ms_cubic-bezier(.2,0,0,1)]">
          <header className="h-[78px] shrink-0 flex items-center justify-between gap-4 px-7 bg-surface border-b border-border">
            <div>
              <span className="text-[10px] font-semibold tracking-[.18em] text-text-3 uppercase">{readOnly ? "Visualização" : editing ? "Editar entrega" : "Nova entrega"}</span>
              <Dialog.Title className="text-[22px] leading-tight font-semibold tracking-[-.035em] mt-1">{editing ? "Detalhes da task" : "Construir task"}</Dialog.Title>
              <Dialog.Description className="sr-only">Defina cliente, produto, demanda, conteúdo e gestão da task.</Dialog.Description>
            </div>
            <Dialog.Close asChild><button aria-label="Fechar" className="size-9 grid place-items-center rounded-full border border-border text-text-2 hover:bg-surface-2 hover:text-text"><IcClose className="size-4" /></button></Dialog.Close>
          </header>

          <form onSubmit={handleSubmit} className="contents">
            <div className="flex-1 overflow-y-auto scrollbar-clean flex flex-col">
            <fieldset disabled={readOnly} className="p-5 grid gap-4 disabled:opacity-100">
              {editing && (
                <div className="grid gap-5">
                  {/* Título */}
                  <Input
                    value={form.title}
                    onChange={(event) => { set("title", event.target.value); setTitleWasEdited(true); }}
                    className="h-auto w-full border-0 px-0 py-1 text-[22px] font-semibold tracking-[-.025em] shadow-none focus:ring-0"
                  />

                  {/* Badges de resumo — coloridos */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(() => {
                      const idx = destFlow.findIndex((s) => s.key === form.status);
                      const isPersonCol = form.status === PERSON_COLUMN_STATUS;
                      const stageColor = isPersonCol
                        ? { badgeBg: "#eaf2ff", badgeText: "#1d3d7a" }
                        : colorForStage(idx, destFlow[idx]?.tone ?? null);
                      const stageLabel = isPersonCol ? "Coluna da pessoa" : (destFlow[idx]?.label ?? form.status);
                      return (
                        <BadgePill bg={stageColor.badgeBg} text={stageColor.badgeText}>{stageLabel}</BadgePill>
                      );
                    })()}
                    {form.clientId && (() => {
                      const c = localClients.find((x) => x.id === form.clientId);
                      const cc = colorForClient(form.clientId);
                      return c ? <BadgePill bg={cc.bg} text={cc.text}>{c.name}</BadgePill> : null;
                    })()}
                    {form.priority && form.priority !== "NORMAL" && (() => {
                      const pc = colorForPriority(form.priority);
                      return <BadgePill bg={pc.bg} text={pc.text}>{pc.label}</BadgePill>;
                    })()}
                    {form.deadline && (
                      <BadgePill bg="#eef2ff" text="#3730a3">
                        {new Date(`${form.deadline}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </BadgePill>
                    )}
                  </div>

                  {/* Info block: Status | Responsável | Etiqueta | Data de entrega | Prioridade */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-lg border border-border bg-surface-2 p-3">
                    <InfoField label="Status">
                      <Select value={form.status} onChange={(event) => set("status", event.target.value)} className="h-8 text-[12px]">
                        <option value={PERSON_COLUMN_STATUS}>Coluna da pessoa</option>
                        {destFlow.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                      </Select>
                    </InfoField>
                    <InfoField label="Responsável">
                      <Select value={form.responsibleId} onChange={(event) => set("responsibleId", event.target.value)} className="h-8 text-[12px]">
                        {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                      </Select>
                    </InfoField>
                    <InfoField label="Etiqueta do cliente">
                      <Select value={form.clientId} onChange={(event) => updateDefinition({ clientId: event.target.value, productId: "" })} className="h-8 text-[12px]">
                        {localClients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </Select>
                    </InfoField>
                    <InfoField label="Data de entrega">
                      <Input type="date" value={form.deadline} onChange={(event) => set("deadline", event.target.value)} className="h-8 text-[12px]" />
                    </InfoField>
                    <InfoField label="Prioridade">
                      <Select value={form.priority} onChange={(event) => set("priority", event.target.value)} className="h-8 text-[12px]">
                        {priorities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </Select>
                    </InfoField>
                    <InfoField label="Produto">
                      <Select value={form.productId} onChange={(event) => updateDefinition({ productId: event.target.value })} className="h-8 text-[12px]">
                        <option value="">—</option>
                        {clientProducts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </Select>
                    </InfoField>
                  </div>

                  {/* Briefing */}
                  <ContentBlock title="Briefing">
                    <Textarea
                      required rows={5}
                      value={form.briefing}
                      onChange={(event) => set("briefing", event.target.value)}
                      placeholder="Escreva o direcionamento da demanda…"
                      className="text-[13px] leading-5"
                    />
                  </ContentBlock>

                  {/* Copy + Link do Drive + Referência */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ContentBlock title="Copy">
                      <LinkableInput
                        value={form.copyUrl}
                        onChange={(v) => set("copyUrl", v)}
                        placeholder="Cole o link enviado pelo cliente"
                        variant="link"
                      />
                    </ContentBlock>
                    <ContentBlock title="Link do Drive">
                      <LinkableInput
                        value={form.attachmentDriveUrl}
                        onChange={(v) => set("attachmentDriveUrl", v)}
                        placeholder={product?.driveUrl ?? "https://drive.google.com/…"}
                        variant="link"
                      />
                    </ContentBlock>
                  </div>

                  {/* Referência (livre) */}
                  <ContentBlock title="Referência">
                    <Textarea
                      rows={3}
                      value={form.referenceUrl}
                      onChange={(event) => set("referenceUrl", event.target.value)}
                      placeholder="Link, descrição, observação… o que for referência para a entrega"
                      className="text-[12px] leading-5"
                    />
                  </ContentBlock>

                  {/* Central de Links */}
                  <ContentBlock title="Central de Links">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <CentralLink label="Fotos" href={pickPhotos(client, product)} />
                      <CentralLink label="Figma principal" href={pickCentralLink(client, "figma")} />
                      <CentralLink label="Figma do produto" href={product?.figmaUrl ?? null} />
                    </div>
                    <div className="mt-3 border-t border-hairline pt-3">
                      <span className="text-[9.5px] font-medium uppercase tracking-[.08em] text-text-3">Acessos</span>
                      <div className="mt-2 grid gap-2 sm:grid-cols-3">
                        <CentralLink label="WordPress" href={pickCentralLink(client, "wordpress")} />
                        <CentralLink label="Cloudflare" href={pickCentralLink(client, "cloudflare")} />
                        <CentralLink label="Hospedagem" href={pickCentralLink(client, "hosting")} />
                      </div>
                    </div>
                  </ContentBlock>
                </div>
              )}
              {!editing && <>
              <Section number="01" title="Definição" subtitle="Escolha o contexto; o restante se organiza sozinho.">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Cliente">
                    <Select required value={form.clientId} onChange={(event) => updateDefinition({ clientId: event.target.value, productId: "" })}>
                      <option value="">Selecione</option>{localClients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </Select>
                    <InlineCreate label="Novo cliente" active={quickCreate === "client"} onOpen={() => { setQuickCreate("client"); setQuickName(""); }} value={quickName} onChange={setQuickName} onSave={handleQuickCreate} pending={pending} />
                  </Field>
                  <Field label="Produto">
                    <Select required disabled={!client} value={form.productId} onChange={(event) => updateDefinition({ productId: event.target.value })}>
                      <option value="">{client ? "Selecione" : "Escolha o cliente"}</option>{clientProducts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </Select>
                    {client && <InlineCreate label="Novo produto" active={quickCreate === "product"} onOpen={() => { setQuickCreate("product"); setQuickName(""); }} value={quickName} onChange={setQuickName} onSave={handleQuickCreate} pending={pending} />}
                  </Field>
                </div>

                <Field label="Tipo de demanda" className="mt-5">
                  <div className="flex flex-wrap gap-1.5">{demandTypes.map((item) => <Chip key={item.id} selected={form.demandTypeId === item.id} onClick={() => { updateDefinition({ demandTypeId: item.id, variations: [] }); }}><b>[{item.prefix}]</b> {item.name}</Chip>)}</div>
                </Field>

                {demand && <Field label="Formato / variação" className="mt-5">
                  {demand.variationMode === "FIXED" && <div className="flex flex-wrap gap-1.5">{demand.variations.map((item) => <Chip key={item} selected={form.variations.includes(item)} onClick={() => toggleVariation(item)}>{item}</Chip>)}</div>}
                  {demand.variationMode === "SLIDES" && <div className="flex flex-wrap items-center gap-2"><Stepper value={slideCount} onChange={setSlideCount} /><Button type="button" size="sm" onClick={() => set("variations", Array.from({ length: slideCount }, (_, index) => `Lâmina ${String(index + 1).padStart(2, "0")}`))}>Gerar lâminas</Button></div>}
                  {demand.variationMode === "FREE" && <div className="flex gap-2"><Input value={freeVariation} onChange={(event) => setFreeVariation(event.target.value)} placeholder="Nome do produto ou dia do CPL" className="flex-1" /><Button type="button" size="sm" onClick={() => { if (freeVariation.trim()) { toggleVariation(freeVariation.trim()); setFreeVariation(""); } }}>Adicionar</Button></div>}
                  {form.variations.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{form.variations.map((item) => <button type="button" key={item} onClick={() => toggleVariation(item)} className="text-[10px] bg-[#353535] text-[#d0d0cc] rounded-md px-2 py-1">{item} ×</button>)}</div>}
                </Field>}

                <Field label="Título da task" hint={titleWasEdited ? "Edição manual ativa — o título não será mais sobrescrito." : "Gerado automaticamente pelas seleções."} className="mt-5">
                  <Input required value={form.title} onChange={(event) => { set("title", event.target.value); setTitleWasEdited(true); }} placeholder="[PREFIXO] Produto [Cliente]" className="h-11 text-[15px] font-semibold" />
                </Field>
                {willReroute && <div className="mt-3 flex items-start gap-2 rounded-lg border border-info/30 bg-info/10 p-3 text-[12px] text-[#d8d8d5]"><IcAlert className="size-4 text-info mt-px" /><span><b>Rota automática:</b> esta task será enviada ao board do Time Web Design.</span></div>}
              </Section>

              <section className="rounded-2xl border border-border bg-surface-2 overflow-hidden">
                <button type="button" onClick={() => setLinksOpen(!linksOpen)} className="w-full flex items-center justify-between p-5 text-left">
                  <SectionTitle number="02" title="Central de links" subtitle={client && product ? `${centralLinks.length} acessos encontrados` : "Selecione cliente e produto"} />
                  <IcChevronDown className={cn("size-4 text-text-3 transition-transform", linksOpen && "rotate-180")} />
                </button>
                {linksOpen && <div className="px-5 pb-5">
                  <div className="rounded-lg border border-border bg-surface px-3 py-2.5 text-[11.5px] leading-relaxed text-text-2">O Figma e as fotos do cliente estarão sempre disponíveis na central de links. Não é necessário anexá-los na task.</div>
                  {centralLinks.length > 0 && <div className="grid sm:grid-cols-2 gap-2 mt-3">{centralLinks.map((link) => <a key={link.id} href={link.url ?? "#"} target="_blank" rel="noreferrer" className="group flex items-center gap-3 rounded-lg border border-border bg-surface p-3 text-text hover:no-underline hover:border-border-strong">
                    <span className="size-8 grid place-items-center rounded-lg bg-text text-bg"><CategoryIcon category={link.category} className="size-4" /></span><span className="min-w-0"><small className="block text-[10px] text-text-3 truncate">{link.label}</small><b className="block text-[11.5px] font-medium truncate">Abrir acesso</b></span><IcExternal className="size-3.5 ml-auto text-text-3 group-hover:text-text" />
                  </a>)}</div>}
                </div>}
              </section>

              <Section number="03" title="Conteúdo da task" subtitle="Só o que muda em cada entrega.">
                <Field label="Briefing *"><Textarea required rows={6} value={form.briefing} onChange={(event) => set("briefing", event.target.value)} placeholder="Contexto, objetivo, direcionamento e entregáveis…" /></Field>
                <div className="grid sm:grid-cols-2 gap-3 mt-4"><Field label="Copy"><Input type="url" value={form.copyUrl} onChange={(event) => set("copyUrl", event.target.value)} placeholder="https://" /></Field><Field label="Referência"><Input type="url" value={form.referenceUrl} onChange={(event) => set("referenceUrl", event.target.value)} placeholder="URL da referência" /></Field></div>
                <Field label="Drive para anexar" hint="Use somente se o material estiver fora do drive próprio." className="mt-4"><Input type="url" value={form.attachmentDriveUrl} onChange={(event) => set("attachmentDriveUrl", event.target.value)} placeholder="https://drive.google.com/…" /></Field>
                <label className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-surface-2 p-3 cursor-pointer"><input type="checkbox" checked={form.useExternalMaterials} onChange={(event) => set("useExternalMaterials", event.target.checked)} className="size-4 accent-accent" /><span><b className="block text-[12px] font-medium">Material fora da central de links</b><small className="block text-[10.5px] text-text-3 mt-0.5">Cliente freela ou acessos avulsos</small></span></label>
                {form.useExternalMaterials && <Field label="Materiais externos" className="mt-4"><Textarea rows={3} value={form.externalMaterials} onChange={(event) => set("externalMaterials", event.target.value)} placeholder="Cole links de Drive, Figma ou fotos — um por linha" /></Field>}
              </Section>

              <Section number="04" title="Gestão" subtitle="A demanda entra automaticamente na coluna do responsável.">
                <div className="grid sm:grid-cols-2 gap-3"><Field label="Responsável"><Select required value={form.responsibleId} onChange={(event) => set("responsibleId", event.target.value)}><option value="">Selecione</option>{people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</Select></Field><Field label="Prioridade"><Select value={form.priority} onChange={(event) => set("priority", event.target.value)}>{priorities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></Field><Field label="Data de início"><Input type="date" value={form.startDate} onChange={(event) => set("startDate", event.target.value)} /></Field><Field label="Data de vencimento"><Input type="date" value={form.deadline} onChange={(event) => set("deadline", event.target.value)} /></Field><Field label="Etiqueta"><div className="h-[34px] flex items-center"><span className="inline-flex rounded-full bg-text text-bg px-2.5 py-1 text-[11px] font-medium">{client?.name ?? "Cliente não definido"}</span></div></Field></div>
                <label className="mt-4 inline-flex items-center gap-2 text-[12px] text-text-2"><input type="checkbox" checked={form.pendenteMaterial} onChange={(event) => set("pendenteMaterial", event.target.checked)} className="size-4 accent-danger" /> Marcar material como pendente</label>
              </Section>
              </>}
            </fieldset>

            {editing && (
              <section className="border-t border-border bg-surface-2 p-5">
                <h3 className="text-[11px] font-semibold uppercase tracking-[.08em] text-text-2">Comentários</h3>
                <CommentsThread
                  cardId={editing.id}
                  comments={comments}
                  loaded={commentsLoaded}
                  canDelete={!readOnly}
                  currentTeamSlug={currentTeamSlug}
                  onAdded={(c) => setComments((prev) => [...prev, c])}
                  onDeleted={(id) => setComments((prev) => prev.filter((c) => c.id !== id))}
                />
              </section>
            )}
            </div>

            <footer className="shrink-0 min-h-[70px] flex items-center gap-2 px-6 py-3 bg-surface border-t border-border">
              {!readOnly && (editing ? <Button type="button" variant="ghost" onClick={handleDelete} className="text-danger hover:text-danger hover:bg-danger/10"><IcTrash className="size-3.5" /> Excluir</Button> : <span className="text-[11px] text-text-3">{form.briefing.trim() ? "Pronto para criar" : "Briefing obrigatório"}</span>)}
              <span className="flex-1" /><Dialog.Close asChild><Button type="button" variant="ghost">{readOnly ? "Fechar" : "Cancelar"}</Button></Dialog.Close>{!readOnly && <Button type="submit" variant="primary" size="lg" disabled={pending}>{pending ? "Salvando…" : editing ? "Salvar alterações" : "Criar task"}<span className="ml-2">→</span></Button>}
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Section({ number, title, subtitle, children }: { number: string; title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-border bg-surface p-5"><SectionTitle number={number} title={title} subtitle={subtitle} /> <div className="mt-5">{children}</div></section>;
}
function SectionTitle({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return <div className="flex items-start gap-3"><span className="size-7 shrink-0 grid place-items-center rounded-full border border-current text-[10px] font-semibold">{number}</span><span><h3 className="text-[15px] leading-tight font-semibold tracking-[-.02em]">{title}</h3><p className="text-[11px] text-text-3 mt-1">{subtitle}</p></span></div>;
}
function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("rounded-md border px-2.5 py-1.5 text-[10.5px] transition-colors", selected ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-white text-[#555] border-[#dedede] hover:bg-[#f5f5f5] hover:border-[#c8c8c8]")}>{children}</button>;
}
function Stepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <div className="h-8 inline-flex items-center rounded-md border border-[#dedede] bg-white"><button type="button" className="size-8" onClick={() => onChange(Math.max(1, value - 1))}>−</button><b className="min-w-20 text-center text-[11px]">{value} lâminas</b><button type="button" className="size-8" onClick={() => onChange(value + 1)}>+</button></div>;
}
function InlineCreate({ label, active, onOpen, value, onChange, onSave, pending }: { label: string; active: boolean; onOpen: () => void; value: string; onChange: (value: string) => void; onSave: () => void; pending: boolean }) {
  if (!active) return <button type="button" onClick={onOpen} className="mt-1 inline-flex items-center gap-1 text-[10.5px] text-[#aaa] hover:text-white"><IcPlus className="size-3" /> {label}</button>;
  return <div className="mt-1 flex gap-1.5"><Input autoFocus value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onSave(); } }} placeholder="Nome" className="h-8 flex-1 text-[12px]" /><Button type="button" size="sm" onClick={onSave} disabled={pending || !value.trim()}>Criar</Button></div>;
}
function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid grid-cols-[92px_1fr] items-center gap-3"><span className="text-[11px] text-[#8a8a8a]">{label}</span><div>{children}</div></div>;
}
function TaskSheetRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return <section className="grid grid-cols-[22px_1fr] gap-2 border-b border-[#e8e8e8] py-6"><span className="text-[15px] text-[#888]">{icon}</span><div><h3 className="mb-3 text-[13px] font-bold uppercase tracking-[-.01em]">{label}</h3>{children}</div></section>;
}

/* ------------------------- Info / Content / Central de Links ------------------------- */

function BadgePill({ bg, text, children }: { bg: string; text: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center h-5 px-2 rounded-full text-[9.5px] font-semibold uppercase tracking-[.04em]"
      style={{ backgroundColor: bg, color: text }}
    >
      {children}
    </span>
  );
}

function LinkableInput({
  value, onChange, placeholder, variant,
}: { value: string; onChange: (v: string) => void; placeholder?: string; variant: "link" }) {
  const hasLink = value.trim().length > 0 && /^https?:\/\//i.test(value.trim());
  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 flex-1"
      />
      {hasLink && variant === "link" && (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 h-9 px-2.5 rounded-md border border-border bg-white text-[11px] font-medium text-text hover:bg-surface-2 no-underline hover:no-underline shrink-0"
          onMouseDown={(event) => event.stopPropagation()}
        >
          Abrir <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  );
}

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-[9px] font-medium uppercase tracking-[.08em] text-text-3">{label}</span>
      {children}
    </label>
  );
}

function ContentBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-3">
      <h4 className="text-[10px] font-semibold uppercase tracking-[.08em] text-text-2 mb-2">{title}</h4>
      {children}
    </section>
  );
}

function CentralLink({ label, href }: { label: string; href: string | null | undefined }) {
  const hasLink = Boolean(href);
  return (
    <a
      href={hasLink ? href! : undefined}
      target={hasLink ? "_blank" : undefined}
      rel="noreferrer"
      className={cn(
        "flex items-center gap-2 rounded-md border px-2.5 py-2 text-left no-underline",
        hasLink
          ? "border-border bg-surface-2 hover:bg-surface-3 hover:no-underline"
          : "border-dashed border-hairline bg-transparent pointer-events-none",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[9.5px] uppercase tracking-[.06em] text-text-3">{label}</div>
        <div className={cn("text-[11px] font-medium truncate", hasLink ? "text-text" : "text-text-3")}>
          {hasLink ? "Abrir link" : "Não definido"}
        </div>
      </div>
      {hasLink && <IcExternal className="size-3 text-text-3 shrink-0" />}
    </a>
  );
}

function pickCentralLink(client: ClientWithLinks | undefined, category: string): string | null {
  if (!client) return null;
  const item = client.links.find((l) => !l.parentId && l.category === category && l.url);
  return item?.url ?? null;
}

function pickPhotos(client: ClientWithLinks | undefined, product: ProductLite | undefined): string | null {
  if (product?.photosUrl) return product.photosUrl;
  return pickCentralLink(client, "photos");
}

/* ------------------------- Comments thread ------------------------- */

function CommentsThread({
  cardId, comments, loaded, canDelete, currentTeamSlug, onAdded, onDeleted,
}: {
  cardId: string;
  comments: CommentLite[];
  loaded: boolean;
  canDelete: boolean;
  currentTeamSlug: string;
  onAdded: (c: CommentLite) => void;
  onDeleted: (id: string) => void;
}) {
  const [body, setBody] = React.useState("");
  const [mediaInput, setMediaInput] = React.useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    const text = body.trim();
    const links = mediaInput.split(/\s+/).map((s) => s.trim()).filter(Boolean);
    if (!text && links.length === 0) return;
    startTransition(async () => {
      try {
        const created = await addComment({ cardId, body: text, mediaUrls: links, currentTeamSlug });
        onAdded(created);
        setBody(""); setMediaInput("");
      } catch (err) {
        alert(err instanceof Error ? err.message : "Falha ao comentar.");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Excluir este comentário?")) return;
    startTransition(async () => {
      try {
        await deleteComment({ id, currentTeamSlug });
        onDeleted(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Não foi possível excluir.");
      }
    });
  }

  return (
    <div className="mt-3 grid gap-3">
      {!loaded && <p className="text-[10.5px] text-text-3">Carregando comentários…</p>}
      {loaded && comments.length === 0 && (
        <p className="text-[10.5px] text-text-3">Nenhum comentário ainda. Compartilhe referências, links e feedbacks aqui.</p>
      )}
      {comments.map((c) => (
        <article key={c.id} className="rounded-lg border border-border bg-surface p-3">
          <header className="flex items-center gap-2">
            <span className="size-6 shrink-0 rounded-full bg-text/85 text-bg text-[9.5px] font-semibold grid place-items-center">
              {c.author.initials}
            </span>
            <span className="text-[11px] font-medium text-text truncate">{c.author.name}</span>
            <span className="text-[9.5px] text-text-3 tabular ml-auto">{formatCommentDate(c.createdAt)}</span>
            {canDelete && (
              <button
                type="button"
                onClick={() => remove(c.id)}
                className="text-[9.5px] text-text-3 hover:text-danger transition-colors"
                aria-label="Excluir comentário"
                disabled={pending}
              >
                Excluir
              </button>
            )}
          </header>
          {c.body && <p className="mt-2 text-[12px] leading-5 text-text whitespace-pre-wrap">{c.body}</p>}
          {c.mediaUrls.length > 0 && (
            <div className="mt-2 grid gap-1.5">
              {c.mediaUrls.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10.5px] text-text-2 underline decoration-hairline hover:text-text truncate block"
                >
                  {url}
                </a>
              ))}
            </div>
          )}
        </article>
      ))}

      <div className="rounded-lg border border-border bg-surface p-3 grid gap-2">
        <Textarea
          rows={3}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Escreva um comentário, feedback ou instrução…"
          className="text-[12px] leading-5"
        />
        <Input
          value={mediaInput}
          onChange={(event) => setMediaInput(event.target.value)}
          placeholder="Cole URLs de imagens ou referências (separadas por espaço)"
          className="h-9 text-[11px]"
        />
        <div className="flex items-center gap-2">
          <span className="text-[9.5px] text-text-3">{body.length ? `${body.length} caracteres` : ""}</span>
          <span className="flex-1" />
          <Button type="button" size="sm" variant="primary" onClick={submit} disabled={pending || (!body.trim() && !mediaInput.trim())}>
            {pending ? "Enviando…" : "Comentar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatCommentDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const same = d.toDateString() === now.toDateString();
  if (same) return `hoje ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

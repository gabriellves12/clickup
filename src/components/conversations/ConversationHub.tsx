"use client";

import * as React from "react";
import { Archive, CheckCheck, ChevronDown, Clock, ContactRound, Filter, Inbox, MessageCircle, MoreHorizontal, Paperclip, Phone, Plus, Search, Send, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ConversationState = "aberta" | "aguardando" | "finalizada";
type Message = { id: string; direction: "in" | "out"; body: string; time: string; read?: boolean };
type Conversation = {
  id: string; name: string; initials: string; phone: string; company: string; owner: string;
  accent: string; state: ConversationState; unread: number; updatedAt: string; preview: string;
  messages: Message[];
};

const seedConversations: Conversation[] = [
  { id: "1", name: "Marina Alves", initials: "MA", phone: "+55 11 99811-2304", company: "Instituto Horizonte", owner: "Gabriel", accent: "#5d917d", state: "aberta", unread: 2, updatedAt: "Agora", preview: "Posso enviar as fotos da nova campanha?", messages: [{ id: "1", direction: "in", body: "Oi, pessoal! Posso enviar as fotos da nova campanha por aqui?", time: "09:42" }, { id: "2", direction: "out", body: "Oi, Marina! Pode enviar sim. Vamos organizar tudo na pasta do projeto.", time: "09:45", read: true }, { id: "3", direction: "in", body: "Perfeito. Também queria confirmar o prazo da landing page.", time: "09:47" }] },
  { id: "2", name: "João Menna", initials: "JM", phone: "+55 11 98710-7719", company: "João Menna", owner: "Lucas", accent: "#9575bd", state: "aguardando", unread: 0, updatedAt: "12 min", preview: "Obrigado, vou validar com a equipe.", messages: [{ id: "1", direction: "out", body: "João, deixamos a nova versão da página disponível para aprovação.", time: "09:09", read: true }, { id: "2", direction: "in", body: "Obrigado, vou validar com a equipe.", time: "09:11" }] },
  { id: "3", name: "Priscilla Dantas", initials: "PD", phone: "+55 61 99201-8071", company: "Priscilla Dantas Mentoria", owner: "Gabriel", accent: "#c08064", state: "aberta", unread: 1, updatedAt: "31 min", preview: "O link da área de membros está atualizado?", messages: [{ id: "1", direction: "in", body: "O link da área de membros está atualizado?", time: "08:52" }, { id: "2", direction: "out", body: "Estamos conferindo agora e já retorno com a confirmação.", time: "08:56", read: true }] },
  { id: "4", name: "Core Educação", initials: "CE", phone: "+55 62 99122-9411", company: "Core Educação", owner: "Riquer", accent: "#6182a9", state: "aberta", unread: 0, updatedAt: "1 h", preview: "Precisamos de um ajuste no criativo 03.", messages: [{ id: "1", direction: "in", body: "Precisamos de um ajuste no criativo 03.", time: "08:20" }, { id: "2", direction: "out", body: "Anotado. Vou levar para o time de criação e te atualizo.", time: "08:24", read: true }] },
  { id: "5", name: "Mahmoud Baydoun", initials: "MB", phone: "+55 11 97110-8820", company: "Mahmoud Baydoun", owner: "Gabriel", accent: "#b08953", state: "finalizada", unread: 0, updatedAt: "Ontem", preview: "Combinado, muito obrigado!", messages: [{ id: "1", direction: "out", body: "A publicação foi concluída e está tudo certo no site.", time: "Ontem, 16:08", read: true }, { id: "2", direction: "in", body: "Combinado, muito obrigado!", time: "Ontem, 16:11" }] },
];

const labels: Record<ConversationState, string> = { aberta: "Em atendimento", aguardando: "Aguardando cliente", finalizada: "Finalizada" };
const tones: Record<ConversationState, string> = { aberta: "bg-[#e7f2ec] text-[#39765a]", aguardando: "bg-[#f7f0df] text-[#946b25]", finalizada: "bg-[#efefed] text-[#777772]" };
type FilterKey = "todas" | "nao-lidas" | ConversationState;

export function ConversationHub() {
  const [conversations, setConversations] = React.useState(seedConversations);
  const [activeId, setActiveId] = React.useState(seedConversations[0].id);
  const [filter, setFilter] = React.useState<FilterKey>("todas");
  const [query, setQuery] = React.useState("");
  const [draft, setDraft] = React.useState("");
  const active = conversations.find((item) => item.id === activeId) ?? conversations[0];
  const filtered = conversations.filter((item) => {
    const matchesQuery = `${item.name} ${item.company} ${item.preview}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"));
    const matchesFilter = filter === "todas" || (filter === "nao-lidas" ? item.unread > 0 : item.state === filter);
    return matchesQuery && matchesFilter;
  });
  const unread = conversations.reduce((sum, item) => sum + item.unread, 0);

  function selectConversation(id: string) {
    setActiveId(id);
    setConversations((items) => items.map((item) => item.id === id ? { ...item, unread: 0 } : item));
  }

  function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setConversations((items) => items.map((item) => item.id === active.id ? { ...item, preview: body, updatedAt: "Agora", messages: [...item.messages, { id: `${Date.now()}`, direction: "out", body, time: "Agora", read: true }] } : item));
    setDraft("");
  }

  function setConversationState(state: ConversationState) {
    setConversations((items) => items.map((item) => item.id === active.id ? { ...item, state } : item));
  }

  return <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8f8f6] text-[#242422]">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-[#e4e4e1] bg-white px-6 py-4 lg:px-8">
      <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-[#1e2924] text-white"><MessageCircle className="size-[17px]" /></span><div><p className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#85857f]">Relacionamento · WhatsApp Business</p><h1 className="mt-0.5 text-[22px] font-semibold tracking-[-.045em]">Central de conversas</h1></div></div>
      <div className="flex items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-[#e3e3df] bg-[#fafaf9] px-2.5 py-1.5 text-[9.5px] text-[#777772]"><span className="size-1.5 rounded-full bg-[#b6b6b0]" />Integração pendente</span><button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#1e2924] px-3 text-[10px] font-medium text-white transition-colors hover:bg-[#31463b]"><Plus className="size-3.5" />Nova conversa</button></div>
    </header>

    <div className="border-b border-[#e7e7e3] bg-[#fbfbfa] px-6 py-2.5 lg:px-8"><p className="inline-flex items-center gap-1.5 text-[9.5px] text-[#777772]"><span className="size-1.5 rounded-full bg-[#c3a35b]" />Estrutura pronta para conectar ao WhatsApp Business. As mensagens abaixo são uma prévia operacional.</p></div>

    <section className="grid min-h-0 flex-1 grid-cols-[minmax(276px,330px)_minmax(410px,1fr)] xl:grid-cols-[minmax(292px,348px)_minmax(480px,1fr)_264px]">
      <aside className="flex min-h-0 flex-col border-r border-[#e4e4e1] bg-white">
        <div className="border-b border-[#ecece9] p-3.5"><label className="relative block"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#989892]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar conversa" className="h-8 w-full rounded-md border border-[#e1e1dd] bg-[#fafafa] pl-8 pr-7 text-[10.5px] outline-none placeholder:text-[#aaa9a3] focus:border-[#69776f]" />{query && <button type="button" onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#333]"><X className="size-3" /></button>}</label><div className="mt-3 flex items-center justify-between gap-2"><div className="flex gap-1 overflow-x-auto scrollbar-clean">{([['todas', 'Todas'], ['nao-lidas', 'Não lidas'], ['aberta', 'Abertas'], ['aguardando', 'Aguardando']] as [FilterKey, string][]).map(([key, label]) => <button type="button" key={key} onClick={() => setFilter(key)} className={cn("whitespace-nowrap rounded-full px-2 py-1 text-[9px] font-medium transition-colors", filter === key ? "bg-[#202a25] text-white" : "text-[#777772] hover:bg-[#efefeb]")}>{label}{key === "nao-lidas" && unread > 0 ? ` · ${unread}` : ""}</button>)}</div><Filter className="size-3.5 shrink-0 text-[#898983]" /></div></div>
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-clean">{filtered.map((item) => <button key={item.id} type="button" onClick={() => selectConversation(item.id)} className={cn("relative flex w-full gap-2.5 border-b border-[#f0f0ed] px-3.5 py-3 text-left transition-colors", item.id === active.id ? "bg-[#f0f4f1]" : "hover:bg-[#fafaf8]")}><span className="grid size-9 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: item.accent }}>{item.initials}</span><span className="min-w-0 flex-1"><span className="flex items-baseline justify-between gap-2"><b className="truncate text-[10.5px] font-semibold text-[#33332f]">{item.name}</b><small className="shrink-0 text-[8.5px] text-[#92928c]">{item.updatedAt}</small></span><span className="mt-0.5 block truncate text-[9px] text-[#878780]">{item.company}</span><span className="mt-1 block truncate text-[9.5px] text-[#666660]">{item.preview}</span></span>{item.unread > 0 && <span className="absolute bottom-3 right-3 grid size-4 place-items-center rounded-full bg-[#3d8061] text-[8px] font-semibold text-white">{item.unread}</span>}</button>)}{filtered.length === 0 && <div className="grid place-items-center px-6 py-14 text-center"><Inbox className="size-5 text-[#aaa9a2]" /><p className="mt-2 text-[10px] text-[#85857f]">Nenhuma conversa encontrada.</p></div>}</div>
      </aside>

      <section className="flex min-h-0 flex-col bg-[#f7f7f5]">
        <div className="flex items-center justify-between gap-4 border-b border-[#e3e3e0] bg-white px-5 py-3"><div className="flex min-w-0 items-center gap-2.5"><span className="grid size-8 shrink-0 place-items-center rounded-full text-[9px] font-semibold text-white" style={{ backgroundColor: active.accent }}>{active.initials}</span><div className="min-w-0"><h2 className="truncate text-[12px] font-semibold text-[#30302d]">{active.name}</h2><p className="mt-0.5 truncate text-[9px] text-[#85857f]">{active.phone} · {active.company}</p></div></div><div className="flex items-center gap-1.5"><StateMenu state={active.state} onChange={setConversationState} /><button type="button" className="grid size-7 place-items-center rounded-md text-[#84847e] hover:bg-[#f0f0ed] hover:text-[#333]"><MoreHorizontal className="size-4" /></button></div></div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 scrollbar-clean"><div className="mx-auto max-w-[680px]"><div className="mb-5 text-center"><span className="rounded-full bg-[#e8e8e4] px-2.5 py-1 text-[8.5px] font-medium text-[#787872]">Hoje</span></div>{active.messages.map((message) => <div key={message.id} className={cn("mb-3 flex", message.direction === "out" ? "justify-end" : "justify-start")}><div className={cn("max-w-[80%] rounded-lg px-3 py-2 shadow-[0_1px_1px_rgba(0,0,0,.025)]", message.direction === "out" ? "rounded-br-sm bg-[#dcefe4] text-[#254233]" : "rounded-bl-sm border border-[#e4e4e1] bg-white text-[#3e3e39]")}><p className="text-[10.5px] leading-[1.45]">{message.body}</p><span className="mt-1 flex items-center justify-end gap-1 text-[8px] opacity-65">{message.time}{message.direction === "out" && <CheckCheck className="size-3" />}</span></div></div>)}</div></div>
        <form onSubmit={sendMessage} className="border-t border-[#e3e3e0] bg-white p-3.5"><div className="mx-auto flex max-w-[680px] items-end gap-2 rounded-lg border border-[#deded9] bg-[#fbfbfa] p-1.5 focus-within:border-[#718378]"><button type="button" className="grid size-7 shrink-0 place-items-center rounded-md text-[#8a8a84] hover:bg-[#eeeeeb] hover:text-[#333]" aria-label="Anexar arquivo"><Paperclip className="size-3.5" /></button><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Escreva uma mensagem…" rows={1} className="max-h-24 min-h-7 flex-1 resize-none bg-transparent py-1.5 text-[10.5px] leading-4 outline-none placeholder:text-[#a4a49e]" /><button type="submit" disabled={!draft.trim()} className="grid size-7 shrink-0 place-items-center rounded-md bg-[#1e2924] text-white transition-colors hover:bg-[#31463b] disabled:bg-[#d8d8d4]" aria-label="Enviar mensagem"><Send className="size-3.5" /></button></div><p className="mx-auto mt-1.5 max-w-[680px] text-[8.5px] text-[#979790]">O envio real será habilitado após a conexão com o WhatsApp Business.</p></form>
      </section>

      <aside className="hidden min-h-0 flex-col border-l border-[#e4e4e1] bg-white xl:flex"><div className="border-b border-[#ecece9] p-4"><p className="text-[8.5px] font-semibold uppercase tracking-[.14em] text-[#92928c]">Contexto do contato</p><div className="mt-4 flex items-center gap-2.5"><span className="grid size-10 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: active.accent }}>{active.initials}</span><div className="min-w-0"><b className="block truncate text-[11px] text-[#373733]">{active.name}</b><span className="mt-0.5 block truncate text-[9px] text-[#85857f]">{active.company}</span></div></div></div><div className="grid gap-5 p-4 text-[10px]"><InfoRow icon={Phone} label="Telefone" value={active.phone} /><InfoRow icon={ContactRound} label="Responsável" value={active.owner} /><div><p className="mb-1.5 text-[8.5px] font-semibold uppercase tracking-[.12em] text-[#92928c]">Situação</p><span className={cn("inline-flex rounded-full px-2 py-1 text-[8.5px] font-medium", tones[active.state])}>{labels[active.state]}</span></div><div className="border-t border-[#eeeeeb] pt-4"><p className="text-[8.5px] font-semibold uppercase tracking-[.12em] text-[#92928c]">Atalhos</p><button type="button" className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[9.5px] text-[#666660] hover:bg-[#f3f3f0]"><Clock className="size-3.5" />Agendar retorno</button><button type="button" onClick={() => setConversationState("finalizada")} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[9.5px] text-[#666660] hover:bg-[#f3f3f0]"><Archive className="size-3.5" />Arquivar conversa</button></div></div></aside>
    </section>
  </main>;
}

function StateMenu({ state, onChange }: { state: ConversationState; onChange: (state: ConversationState) => void }) {
  const [open, setOpen] = React.useState(false);
  return <div className="relative"><button type="button" onClick={() => setOpen((value) => !value)} className={cn("inline-flex h-7 items-center gap-1 rounded-md px-2 text-[9px] font-medium", tones[state])}>{labels[state]}<ChevronDown className="size-3" /></button>{open && <div className="absolute right-0 top-8 z-20 w-40 rounded-md border border-[#e0e0dc] bg-white p-1 shadow-[0_10px_24px_rgba(0,0,0,.1)]">{(Object.keys(labels) as ConversationState[]).map((key) => <button type="button" key={key} onClick={() => { onChange(key); setOpen(false); }} className="flex w-full items-center rounded px-2 py-1.5 text-left text-[9.5px] text-[#555550] hover:bg-[#f2f2ef]">{labels[key]}</button>)}</div>}</div>;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return <div><p className="mb-1.5 text-[8.5px] font-semibold uppercase tracking-[.12em] text-[#92928c]">{label}</p><p className="flex items-center gap-1.5 text-[10px] text-[#555550]"><Icon className="size-3.5 text-[#92928c]" />{value}</p></div>;
}

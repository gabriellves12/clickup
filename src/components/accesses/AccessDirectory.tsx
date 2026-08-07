"use client";

import * as React from "react";
import {
  BookMarked, Boxes, ChevronDown, CircleHelp, ExternalLink, Eye, Filter,
  KeyRound, LockKeyhole, Plus,
  Search, ShieldCheck, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";

type EntryKind = "ferramenta" | "referência" | "biblioteca" | "ia";
type AccessState = "cofre" | "aberto" | "solicitar";
type AccessEntry = {
  id: string;
  name: string;
  kind: EntryKind;
  area: string;
  owner: string;
  url: string;
  access: AccessState;
  reviewedAt: string;
  description: string;
};

const initialEntries: AccessEntry[] = [
  { id: "figma", name: "Figma", kind: "ferramenta", area: "Design", owner: "Time de criação", url: "https://www.figma.com/files", access: "cofre", reviewedAt: "Hoje", description: "Arquivos, bibliotecas e projetos de design." },
  { id: "drive", name: "Google Drive", kind: "ferramenta", area: "Operação", owner: "Administração", url: "https://drive.google.com", access: "cofre", reviewedAt: "Hoje", description: "Pasta mestra, documentos e entregáveis." },
  { id: "notion", name: "Notion", kind: "ferramenta", area: "Processos", owner: "Operação", url: "https://www.notion.so", access: "cofre", reviewedAt: "05 ago", description: "Playbooks, rituais e documentação interna." },
  { id: "chatgpt", name: "ChatGPT", kind: "ia", area: "Criação", owner: "Administração", url: "https://chatgpt.com", access: "cofre", reviewedAt: "Hoje", description: "Pesquisa, redação e apoio ao planejamento." },
  { id: "adobe", name: "Adobe Creative Cloud", kind: "ferramenta", area: "Design", owner: "Time de criação", url: "https://creativecloud.adobe.com", access: "cofre", reviewedAt: "31 jul", description: "Aplicativos de edição e banco Adobe Stock." },
  { id: "freepik", name: "Freepik", kind: "biblioteca", area: "Assets", owner: "Time de criação", url: "https://www.freepik.com", access: "cofre", reviewedAt: "29 jul", description: "Vetores, mockups, texturas e imagens de apoio." },
  { id: "pinterest", name: "Pinterest", kind: "referência", area: "Pesquisa", owner: "Livre", url: "https://www.pinterest.com", access: "aberto", reviewedAt: "—", description: "Pesquisa visual e repertório de campanhas." },
  { id: "behance", name: "Behance", kind: "referência", area: "Pesquisa", owner: "Livre", url: "https://www.behance.net", access: "aberto", reviewedAt: "—", description: "Cases e referências de direção de arte." },
  { id: "motion", name: "Motion Array", kind: "biblioteca", area: "Motion", owner: "Time de criação", url: "https://motionarray.com", access: "solicitar", reviewedAt: "24 jul", description: "Templates, efeitos, trilhas e elementos de motion." },
  { id: "meta", name: "Meta Ad Library", kind: "referência", area: "Mídia", owner: "Livre", url: "https://www.facebook.com/ads/library", access: "aberto", reviewedAt: "—", description: "Consulta pública de anúncios em veiculação." },
];

const kinds: Record<EntryKind, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  ferramenta: { label: "Ferramenta", className: "bg-[#e8ecef] text-[#455967]", icon: Boxes },
  referência: { label: "Referência", className: "bg-[#eee9dd] text-[#78633e]", icon: BookMarked },
  biblioteca: { label: "Biblioteca", className: "bg-[#e4ede9] text-[#3b6b57]", icon: Sparkles },
  ia: { label: "IA", className: "bg-[#ece7ef] text-[#674c70]", icon: Sparkles },
};

const accessLabels: Record<AccessState, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  cofre: { label: "No cofre", className: "text-[#3a6c58]", icon: LockKeyhole },
  aberto: { label: "Acesso aberto", className: "text-[#60605b]", icon: Eye },
  solicitar: { label: "Solicitar acesso", className: "text-[#956328]", icon: KeyRound },
};

export function AccessDirectory() {
  const [entries, setEntries] = React.useState(initialEntries);
  const [query, setQuery] = React.useState("");
  const [kind, setKind] = React.useState<"todos" | EntryKind>("todos");
  const [access, setAccess] = React.useState<"todos" | AccessState>("todos");
  const [isFormOpen, setFormOpen] = React.useState(false);

  const filteredEntries = React.useMemo(() => entries.filter((entry) => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    const matchesQuery = !normalized || `${entry.name} ${entry.area} ${entry.owner} ${entry.description}`.toLocaleLowerCase("pt-BR").includes(normalized);
    return matchesQuery && (kind === "todos" || entry.kind === kind) && (access === "todos" || entry.access === access);
  }), [access, entries, kind, query]);

  const stats = {
    total: entries.length,
    protected: entries.filter((entry) => entry.access === "cofre").length,
    references: entries.filter((entry) => entry.kind === "referência" || entry.kind === "biblioteca").length,
  };

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#f6f6f4] scrollbar-clean">
      <header className="border-b border-[#e1e1dd] bg-[#fbfbfa] px-6 py-5 lg:px-8">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[.17em] text-[#84847e]">Admin · Base interna</p>
            <h1 className="mt-2 text-[25px] font-semibold tracking-[-.045em] text-[#20201e]">Planilha de acessos</h1>
            <p className="mt-1 text-[11.5px] text-[#7c7c76]">Ferramentas, bancos de referência e atalhos que ajudam o time a trabalhar melhor.</p>
          </div>
          <button type="button" onClick={() => setFormOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#1e1e1c] px-3.5 text-[11px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,.15)] transition-transform hover:-translate-y-px">
            <Plus className="size-3.5" /> Adicionar acesso
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1480px] p-5 lg:p-7">
        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryCard icon={KeyRound} label="Itens na base" value={stats.total} detail="Ferramentas e links úteis" />
          <SummaryCard icon={ShieldCheck} label="Protegidos no cofre" value={stats.protected} detail="Credenciais não ficam na planilha" tone="green" />
          <SummaryCard icon={BookMarked} label="Bancos de referência" value={stats.references} detail="Pesquisa, assets e inspiração" tone="sand" />
        </section>

        <section className="mt-5 overflow-hidden rounded-lg border border-[#dfdfda] bg-white shadow-[0_1px_2px_rgba(0,0,0,.025)]">
          <div className="flex flex-col gap-3 border-b border-[#e9e9e5] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-[340px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#969690]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, área ou finalidade" className="h-8 w-full rounded-md border border-[#dfdfda] bg-[#fbfbfa] pl-8 pr-3 text-[10.5px] outline-none placeholder:text-[#a4a49e] focus:border-[#5b5b56]" />
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterSelect label="Tipo" value={kind} onChange={(value) => setKind(value as "todos" | EntryKind)} options={[["todos", "Todos"], ["ferramenta", "Ferramentas"], ["referência", "Referências"], ["biblioteca", "Bibliotecas"], ["ia", "IA"]]} />
              <FilterSelect label="Disponibilidade" value={access} onChange={(value) => setAccess(value as "todos" | AccessState)} options={[["todos", "Todos"], ["cofre", "No cofre"], ["aberto", "Abertos"], ["solicitar", "Solicitar"]]} />
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-clean">
            <table className="min-w-[890px] w-full text-left">
              <thead className="border-b border-[#e9e9e5] bg-[#f7f7f5] text-[8.5px] font-semibold uppercase tracking-[.13em] text-[#868680]">
                <tr><th className="px-4 py-3">Recurso</th><th className="px-3 py-3">Tipo</th><th className="px-3 py-3">Área de uso</th><th className="px-3 py-3">Responsável</th><th className="px-3 py-3">Acesso</th><th className="px-3 py-3">Revisado</th><th className="px-4 py-3 text-right">Link</th></tr>
              </thead>
              <tbody className="divide-y divide-[#eeeeeb]">
                {filteredEntries.map((entry) => <AccessRow key={entry.id} entry={entry} />)}
                {filteredEntries.length === 0 && <tr><td colSpan={7} className="px-4 py-14 text-center"><CircleHelp className="mx-auto size-4 text-[#a5a59f]" /><p className="mt-2 text-[10.5px] text-[#85857f]">Nenhum item corresponde aos filtros atuais.</p></td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-[#e9e9e5] bg-[#fbfbfa] px-4 py-3"><p className="text-[9.5px] text-[#8a8a84]">Mostrando <b className="font-medium text-[#53534e]">{filteredEntries.length}</b> de {entries.length} itens.</p><p className="inline-flex items-center gap-1.5 text-[9.5px] text-[#797973]"><LockKeyhole className="size-3" /> Senhas e tokens permanecem no cofre.</p></div>
        </section>

        <aside className="mt-4 flex gap-3 rounded-lg border border-[#e2e1d9] bg-[#f0eee7] p-4 text-[#625e50]">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#ded7c8] text-[#655b42]"><ShieldCheck className="size-3.5" /></span>
          <div><h2 className="text-[10.5px] font-semibold">Princípio de segurança</h2><p className="mt-1 max-w-[820px] text-[10px] leading-4">Esta base serve para localizar recursos e identificar quem gerencia cada acesso. Credenciais, chaves e tokens devem ser guardados somente em um cofre de senhas autorizado.</p></div>
        </aside>
      </div>

      {isFormOpen && <CreateAccessDialog onClose={() => setFormOpen(false)} onCreate={(entry) => { setEntries((current) => [entry, ...current]); setFormOpen(false); }} />}
    </main>
  );
}

function SummaryCard({ icon: Icon, label, value, detail, tone = "default" }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; detail: string; tone?: "default" | "green" | "sand" }) {
  const colors = { default: "bg-white border-[#dfdfda] text-[#242422]", green: "bg-[#e7f0eb] border-[#d7e4da] text-[#285d48]", sand: "bg-[#f4eee3] border-[#e9ddca] text-[#755c35]" }[tone];
  return <section className={cn("relative overflow-hidden rounded-lg border p-4", colors)}><Icon className="absolute right-4 top-4 size-4 opacity-35" /><p className="text-[9px] font-semibold uppercase tracking-[.13em] opacity-65">{label}</p><p className="mt-3 text-[24px] font-semibold tracking-[-.055em] tabular">{value}</p><p className="mt-2 text-[9.5px] opacity-70">{detail}</p></section>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <label className="relative inline-flex h-8 items-center gap-1.5 rounded-md border border-[#dfdfda] bg-white px-2.5 text-[10px] text-[#686862]"><Filter className="size-3 text-[#999993]" /><span className="text-[#8a8a84]">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="appearance-none bg-transparent pr-3 text-[10px] font-medium text-[#464641] outline-none">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 size-3 text-[#85857f]" /></label>;
}

function AccessRow({ entry }: { entry: AccessEntry }) {
  const type = kinds[entry.kind]; const TypeIcon = type.icon;
  const state = accessLabels[entry.access]; const StateIcon = state.icon;
  return <tr className="group transition-colors hover:bg-[#fafaf8]"><td className="px-4 py-3"><div className="flex items-center gap-2.5"><span className="grid size-7 place-items-center rounded-md bg-[#f0f0ed] text-[#555550]"><TypeIcon className="size-3.5" /></span><div><p className="text-[10.5px] font-semibold text-[#30302d]">{entry.name}</p><p className="mt-0.5 max-w-[295px] truncate text-[9px] text-[#8b8b85]">{entry.description}</p></div></div></td><td className="px-3 py-3"><span className={cn("inline-flex h-5 items-center rounded-full px-2 text-[8.5px] font-medium", type.className)}>{type.label}</span></td><td className="px-3 py-3 text-[10px] text-[#666660]">{entry.area}</td><td className="px-3 py-3 text-[10px] text-[#666660]">{entry.owner}</td><td className="px-3 py-3"><span className={cn("inline-flex items-center gap-1 text-[9.5px] font-medium", state.className)}><StateIcon className="size-3" />{state.label}</span></td><td className="px-3 py-3 text-[9.5px] text-[#8a8a84]">{entry.reviewedAt}</td><td className="px-4 py-3 text-right"><a href={entry.url} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[9.5px] font-medium text-[#4e4e49] transition-colors hover:bg-[#ecece8] hover:text-[#1f1f1d]">Abrir <ExternalLink className="size-3" /></a></td></tr>;
}

function CreateAccessDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (entry: AccessEntry) => void }) {
  const [form, setForm] = React.useState({ name: "", url: "", area: "", owner: "", kind: "ferramenta" as EntryKind, access: "cofre" as AccessState, description: "" });
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/25 p-4 backdrop-blur-[1px]" role="dialog" aria-modal="true" aria-label="Adicionar acesso" onMouseDown={onClose}><form onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); if (!form.name.trim() || !form.url.trim()) return; onCreate({ ...form, id: `${Date.now()}`, name: form.name.trim(), url: form.url.trim(), area: form.area.trim() || "Geral", owner: form.owner.trim() || "Não definido", description: form.description.trim() || "Recurso interno cadastrado na planilha.", reviewedAt: "Agora" }); }} className="w-full max-w-[475px] rounded-lg bg-white p-5 shadow-[0_18px_48px_rgba(0,0,0,.24)]"><p className="text-[9px] font-semibold uppercase tracking-[.15em] text-[#85857f]">Base interna</p><h2 className="mt-1 text-[19px] font-semibold tracking-[-.04em]">Adicionar acesso</h2><p className="mt-1 text-[10px] text-[#898983]">Inclua apenas o link e o contexto. Não registre senhas ou tokens aqui.</p><div className="mt-5 grid gap-3"><Input label="Nome do recurso" value={form.name} onChange={(value) => update("name", value)} placeholder="Ex.: Storyblocks" required /><Input label="Link de acesso" value={form.url} onChange={(value) => update("url", value)} placeholder="https://" type="url" required /><div className="grid grid-cols-2 gap-3"><Input label="Área de uso" value={form.area} onChange={(value) => update("area", value)} placeholder="Ex.: Motion" /><Input label="Responsável" value={form.owner} onChange={(value) => update("owner", value)} placeholder="Ex.: Design" /></div><div className="grid grid-cols-2 gap-3"><SelectField label="Tipo" value={form.kind} onChange={(value) => update("kind", value)} options={[["ferramenta", "Ferramenta"], ["referência", "Referência"], ["biblioteca", "Biblioteca"], ["ia", "IA"]]} /><SelectField label="Acesso" value={form.access} onChange={(value) => update("access", value)} options={[["cofre", "No cofre"], ["aberto", "Acesso aberto"], ["solicitar", "Solicitar acesso"]]} /></div><Input label="Finalidade" value={form.description} onChange={(value) => update("description", value)} placeholder="Como o time utiliza este recurso?" /></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="h-8 rounded-md px-3 text-[10.5px] text-[#696963] hover:bg-[#f2f2ef]">Cancelar</button><button type="submit" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#1e1e1c] px-3 text-[10.5px] font-medium text-white"><Plus className="size-3" /> Adicionar</button></div></form></div>;
}

function Input({ label, value, onChange, placeholder, required, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; required?: boolean; type?: string }) { return <label className="grid gap-1.5 text-[9.5px] font-medium text-[#64645e]">{label}<input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} type={type} className="h-8 rounded-md border border-[#dfdfda] px-2.5 text-[10.5px] outline-none placeholder:text-[#aaa9a3] focus:border-[#5b5b56]" /></label>; }

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) { return <label className="grid gap-1.5 text-[9.5px] font-medium text-[#64645e]">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-8 rounded-md border border-[#dfdfda] bg-white px-2 text-[10.5px] outline-none focus:border-[#5b5b56]">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>; }

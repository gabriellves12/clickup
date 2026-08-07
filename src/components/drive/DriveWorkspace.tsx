"use client";

import * as React from "react";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Download, File, FileImage, FileSpreadsheet, FileText, Folder, FolderOpen, HardDrive, Search, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Entry = { id: string; name: string; mimeType: string; size: string | null; modifiedTime: string | null; thumbnailLink: string | null; webViewLink: string | null; canDownload: boolean; folderToken?: string; downloadToken?: string };
type FolderPath = { id: string; name: string; token?: string };
type Status = { configured: boolean; connected: boolean; googleEmail: string | null };
const root: FolderPath = { id: "root", name: "Drive da operação" };

export function DriveWorkspace() {
  const [status, setStatus] = React.useState<Status | null>(null);
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [path, setPath] = React.useState<FolderPath[]>([root]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [notice, setNotice] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const current = path[path.length - 1];

  const loadFolder = React.useCallback(async (folder: FolderPath) => {
    setLoading(true); setNotice(null);
    try {
      const params = new URLSearchParams();
      if (folder.id !== "root") { params.set("folderId", folder.id); if (folder.token) params.set("token", folder.token); }
      const response = await fetch(`/api/drive/files?${params}`, { cache: "no-store" });
      const payload = await response.json() as { entries?: Entry[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível carregar os arquivos.");
      setEntries(payload.entries ?? []);
    } catch (caught) { setEntries([]); setNotice(caught instanceof Error ? caught.message : "Não foi possível carregar os arquivos."); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => {
    async function initialise() {
      const response = await fetch("/api/drive/status", { cache: "no-store" });
      const payload = await response.json() as Status & { error?: string };
      if (!response.ok) { setNotice(payload.error ?? "Não foi possível verificar o Drive."); setLoading(false); return; }
      setStatus(payload);
      if (payload.configured && payload.connected) await loadFolder(root);
      else setLoading(false);
    }
    void initialise();
  }, [loadFolder]);

  function enterFolder(entry: Entry) { const next = { id: entry.id, name: entry.name, token: entry.folderToken }; setPath((items) => [...items, next]); void loadFolder(next); }
  function jumpTo(index: number) { const next = path[index]; setPath((items) => items.slice(0, index + 1)); void loadFolder(next); }
  function goBack() { if (path.length > 1) jumpTo(path.length - 2); }
  async function upload(file: File) {
    if (!status?.connected) return;
    setUploading(true); setNotice(null);
    try {
      const form = new FormData(); form.set("file", file);
      if (current.id !== "root") { form.set("folderId", current.id); if (current.token) form.set("token", current.token); }
      const response = await fetch("/api/drive/upload", { method: "POST", body: form });
      const payload = await response.json() as { entry?: Entry; error?: string };
      if (!response.ok || !payload.entry) throw new Error(payload.error ?? "Não foi possível enviar o arquivo.");
      setEntries((items) => [...items, payload.entry!].sort(orderEntries)); setNotice(`${file.name} foi enviado para esta pasta.`);
    } catch (caught) { setNotice(caught instanceof Error ? caught.message : "Não foi possível enviar o arquivo."); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
  }
  const visible = entries.filter((entry) => entry.name.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")));

  return <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8f8f6] text-[#20201e]">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-[#e4e4e0] bg-white px-6 py-4 lg:px-8"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-[#263d32] text-white"><HardDrive className="size-[17px]" /></span><div><p className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#85857f]">Arquivos · Google Drive</p><h1 className="mt-0.5 text-[22px] font-semibold tracking-[-.045em]">Drive da operação</h1></div></div><ConnectionStatus status={status} /></header>
    {!status?.configured && !loading ? <SetupPanel /> : !status?.connected && !loading ? <ConnectPanel /> : <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e5e1] bg-white px-6 py-3 lg:px-8"><div className="flex min-w-0 items-center gap-1.5 overflow-x-auto text-[10px] text-[#777772] scrollbar-clean"><button type="button" onClick={goBack} disabled={path.length === 1} className="grid size-7 shrink-0 place-items-center rounded-md hover:bg-[#f1f1ee] disabled:opacity-30" aria-label="Voltar"><ArrowLeft className="size-3.5" /></button>{path.map((folder, index) => <React.Fragment key={`${folder.id}-${index}`}><button type="button" onClick={() => jumpTo(index)} className={cn("shrink-0 rounded px-1.5 py-1 hover:bg-[#f1f1ee]", index === path.length - 1 ? "font-medium text-[#30302d]" : "text-[#85857f]")}>{folder.name}</button>{index < path.length - 1 && <span className="text-[#c2c2bc]">/</span>}</React.Fragment>)}</div><div className="flex items-center gap-2"><label className="relative hidden sm:block"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#979790]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nesta pasta" className="h-8 w-[210px] rounded-md border border-[#e1e1dd] bg-[#fafafa] pl-8 pr-3 text-[10px] outline-none focus:border-[#6b7c70]" /></label><input ref={inputRef} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} type="file" className="hidden" /><button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#263d32] px-3 text-[10px] font-medium text-white hover:bg-[#355344] disabled:opacity-55"><UploadCloud className="size-3.5" />{uploading ? "Enviando…" : "Enviar arquivo"}</button></div></div>
      {notice && <div className="mx-6 mt-4 flex items-center justify-between gap-3 rounded-md border border-[#e2e4df] bg-white px-3 py-2 text-[10px] text-[#5d665f] lg:mx-8"><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-[#478060]" />{notice}</span><button type="button" onClick={() => setNotice(null)}><X className="size-3.5" /></button></div>}
      <div className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-8"><div className="mx-auto max-w-[1450px]">{loading ? <LoadingCards /> : visible.length === 0 ? <EmptyFolder filtered={Boolean(query)} /> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{visible.map((entry) => <DriveCard key={entry.id} entry={entry} onOpen={() => enterFolder(entry)} />)}</div>}</div></div>
    </section>}
  </main>;
}

function ConnectionStatus({ status }: { status: Status | null }) { if (!status) return <span className="h-6 w-28 animate-pulse rounded-full bg-[#eeeeea]" />; return status.connected ? <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dce8df] bg-[#f0f7f2] px-2.5 py-1.5 text-[9px] text-[#427353]"><span className="size-1.5 rounded-full bg-[#4e9867]" />Conectado: {status.googleEmail}</span> : <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ece6d7] bg-[#fbf7ed] px-2.5 py-1.5 text-[9px] text-[#8d6c30]"><span className="size-1.5 rounded-full bg-[#c79d4c]" />Aguardando conexão</span>; }
function SetupPanel() { return <section className="grid flex-1 place-items-center p-6"><div className="max-w-[540px] rounded-xl border border-[#e1e1dd] bg-white p-7 shadow-[0_10px_28px_rgba(25,35,29,.05)]"><span className="grid size-10 place-items-center rounded-lg bg-[#eef4ef] text-[#406e51]"><HardDrive className="size-5" /></span><h2 className="mt-5 text-[19px] font-semibold tracking-[-.04em]">Integração pronta para configurar</h2><p className="mt-2 text-[11px] leading-5 text-[#74746e]">A interface e a proteção dos tokens já estão prontas. Falta cadastrar as credenciais OAuth do Google no ambiente de deploy.</p><ol className="mt-5 grid gap-2 border-l border-[#e3e3df] pl-4 text-[10px] leading-4 text-[#65655f]"><li>Crie um cliente OAuth do tipo Aplicativo da Web no Google Cloud.</li><li>Ative a Google Drive API e informe a URL de retorno do painel.</li><li>Adicione as três variáveis Google no deploy e publique.</li></ol></div></section>; }
function ConnectPanel() { return <section className="grid flex-1 place-items-center p-6"><div className="max-w-[475px] text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#eaf2ec] text-[#3e7854]"><FolderOpen className="size-6" /></span><h2 className="mt-5 text-[20px] font-semibold tracking-[-.04em]">Conecte seu Google Drive</h2><p className="mx-auto mt-2 max-w-[390px] text-[11px] leading-5 text-[#74746e]">Use o mesmo e-mail da plataforma. Você verá e poderá alterar somente os arquivos que esse e-mail já tem permissão para acessar.</p><a href="/api/integrations/google/drive/connect" className="mt-5 inline-flex h-9 items-center gap-2 rounded-md bg-[#263d32] px-4 text-[10.5px] font-medium text-white no-underline hover:bg-[#355344]">Conectar minha conta Google <ArrowUpRight className="size-3.5" /></a></div></section>; }
function LoadingCards() { return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-lg border border-[#e8e8e4] bg-white" />)}</div>; }
function EmptyFolder({ filtered }: { filtered: boolean }) { return <div className="grid place-items-center py-24 text-center"><Folder className="size-7 text-[#aaa9a2]" /><p className="mt-3 text-[11px] font-medium text-[#5f5f59]">{filtered ? "Nenhum arquivo encontrado" : "Esta pasta está vazia"}</p><p className="mt-1 text-[9.5px] text-[#93938d]">{filtered ? "Tente outro termo de busca." : "Use o botão Enviar arquivo para adicionar materiais."}</p></div>; }
function DriveCard({ entry, onOpen }: { entry: Entry; onOpen: () => void }) { const folder = entry.mimeType === "application/vnd.google-apps.folder"; const content = <><span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", folder ? "bg-[#edf3ee] text-[#4e7d5e]" : "bg-[#f1f1ee] text-[#777772]")}>{fileIcon(entry)}</span><span className="min-w-0 flex-1"><b className="block truncate text-[10.5px] text-[#3a3a35]">{entry.name}</b><small className="mt-1 block text-[8.5px] text-[#898983]">{folder ? "Pasta" : `${formatSize(entry.size)} · ${formatDate(entry.modifiedTime)}`}</small></span>{folder ? <FolderOpen className="size-3.5 text-[#9a9a94]" /> : <span className="flex items-center gap-1">{entry.downloadToken && entry.canDownload && <a href={`/api/drive/files/${entry.id}/download?token=${encodeURIComponent(entry.downloadToken)}`} onClick={(event) => event.stopPropagation()} className="grid size-7 place-items-center rounded-md text-[#80807b] hover:bg-[#eeeeeb] hover:text-[#333]" aria-label={`Baixar ${entry.name}`}><Download className="size-3.5" /></a>}{entry.webViewLink && <a href={entry.webViewLink} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="grid size-7 place-items-center rounded-md text-[#80807b] hover:bg-[#eeeeeb] hover:text-[#333]" aria-label={`Abrir ${entry.name}`}><ArrowUpRight className="size-3.5" /></a>}</span>}</>; return folder ? <button type="button" onClick={onOpen} className="flex min-h-[92px] w-full items-center gap-3 rounded-lg border border-[#e5e5e1] bg-white p-3.5 text-left transition-all hover:-translate-y-px hover:border-[#bdcbbf] hover:shadow-[0_8px_20px_rgba(24,38,29,.06)]">{content}</button> : <div className="flex min-h-[92px] items-center gap-3 rounded-lg border border-[#e5e5e1] bg-white p-3.5">{content}</div>; }
function fileIcon(entry: Entry) { if (entry.mimeType.startsWith("image/")) return <FileImage className="size-4" />; if (entry.mimeType.includes("spreadsheet") || /excel|csv/.test(entry.mimeType)) return <FileSpreadsheet className="size-4" />; if (entry.mimeType.includes("pdf") || entry.mimeType.includes("document")) return <FileText className="size-4" />; return <File className="size-4" />; }
function formatSize(value: string | null) { if (!value) return "Arquivo"; const bytes = Number(value); return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value)) : "Atualizado agora"; }
function orderEntries(a: Entry, b: Entry) { return Number(b.mimeType === "application/vnd.google-apps.folder") - Number(a.mimeType === "application/vnd.google-apps.folder") || a.name.localeCompare(b.name, "pt-BR"); }

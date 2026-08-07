import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Circle, ExternalLink, PanelsTopLeft, UserPlus, UsersRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/cn";
import { createPortalUser, updatePortalUserLimit } from "@/app/actions/client-portal";

const statusOrder = ["PENDENTES", "PARA_PRODUCAO", "EM_PRODUCAO", "APROVACAO", "FINALIZADO"];
const statusLabels: Record<string, string> = {
  PENDENTES: "Pendentes", PARA_PRODUCAO: "Para produção", EM_PRODUCAO: "Em produção",
  APROVACAO: "Aprovação", FINALIZADO: "Finalizado",
};

export default async function ClientAreaPreviewPage({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const user = await requireCurrentUser();
  if (user.role !== "admin" && user.role !== "manager") redirect("/kanban");
  const { cliente } = await searchParams;
  const clients = await prisma.client.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, initials: true, status: true } });
  const selectedId = clients.some((client) => client.id === cliente) ? cliente! : clients[0]?.id;
  const selected = selectedId ? await prisma.client.findUnique({ where: { id: selectedId }, include: { users: { where: { role: "client" }, orderBy: { name: "asc" } }, cards: { include: { team: true }, orderBy: { order: "asc" } } } }) : null;
  if (!selected) return null;

  return <main className="flex min-h-0 flex-1 flex-col bg-[#f7f7f7]">
    <header className="border-b border-[#e6e6e6] bg-white px-6 py-5 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><span className="flex items-center gap-2 text-[9px] font-medium uppercase tracking-[.14em] text-[#999]"><PanelsTopLeft className="size-3.5" /> Pré-visualização do portal</span><h1 className="mt-2 text-[22px] font-semibold tracking-[-.035em]">Área do cliente</h1><p className="mt-1 text-[10.5px] text-[#888]">Selecione uma empresa para visualizar exatamente o quadro disponibilizado ao cliente.</p></div><span className="flex items-center gap-1.5 text-[9.5px] text-[#888]"><ExternalLink className="size-3" />O cliente acessa pelo login próprio em /portal</span></div>
      <nav className="mt-5 flex gap-1.5 overflow-x-auto pb-1" aria-label="Selecionar cliente">{clients.map((client) => <Link key={client.id} href={`/area-cliente?cliente=${client.id}`} className={cn("flex h-8 shrink-0 items-center gap-2 rounded-md border px-2.5 text-[10.5px] font-medium transition-colors", client.id === selected.id ? "border-[#222] bg-[#222] text-white" : "border-[#e2e2e2] bg-white text-[#666] hover:bg-[#f3f3f3] hover:text-[#222]")}><span className={cn("grid size-4 place-items-center rounded text-[7px]", client.id === selected.id ? "bg-white/15" : "bg-[#ededed]")}>{client.initials}</span>{client.name}</Link>)}</nav>
    </header>

    <section className="border-b border-[#e7e7e7] bg-white px-6 py-5 lg:px-8"><div className="flex flex-wrap items-start justify-between gap-5"><div><h2 className="text-[20px] font-semibold tracking-[-.035em]">{selected.name}</h2><p className="mt-1 text-[10.5px] text-[#888]">{selected.cards.length} demandas visíveis · responsável padrão Thinkbrand</p></div><div className="flex flex-wrap items-end gap-2"><form action={updatePortalUserLimit} className="flex items-end gap-2"><input type="hidden" name="clientId" value={selected.id} /><label className="grid gap-1 text-[9px] font-medium uppercase tracking-[.08em] text-[#888]">Limite de acessos<input name="limit" type="number" min="1" max="20" defaultValue={selected.portalUserLimit} className="h-8 w-20 rounded-md border border-[#ddd] px-2 text-[11px] text-[#222]" /></label><button className="h-8 rounded-md border border-[#ddd] bg-white px-3 text-[10px] font-medium hover:bg-[#f3f3f3]">Atualizar</button></form><form action={createPortalUser} className="flex items-end gap-2"><input type="hidden" name="clientId" value={selected.id} /><label className="grid gap-1 text-[9px] font-medium uppercase tracking-[.08em] text-[#888]">Nome<input required name="name" placeholder="Nome do usuário" className="h-8 w-36 rounded-md border border-[#ddd] px-2 text-[11px] normal-case tracking-normal text-[#222]" /></label><label className="grid gap-1 text-[9px] font-medium uppercase tracking-[.08em] text-[#888]">Email<input required name="email" type="email" placeholder="email@cliente.com" className="h-8 w-44 rounded-md border border-[#ddd] px-2 text-[11px] normal-case tracking-normal text-[#222]" /></label><button disabled={selected.users.length >= selected.portalUserLimit} className="flex h-8 items-center gap-1.5 rounded-md bg-[#171717] px-3 text-[10px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-35"><UserPlus className="size-3" />Liberar acesso</button></form></div></div><div className="mt-4 flex items-center gap-2 text-[9.5px] text-[#777]"><UsersRound className="size-3.5" /><b className="font-medium">{selected.users.length}/{selected.portalUserLimit} acessos liberados:</b>{selected.users.map((person) => <span key={person.id} className="rounded bg-[#f0f0f0] px-2 py-1">{person.name}</span>)}</div></section>

    <section className="flex-1 overflow-x-auto p-5 lg:p-7"><div className="flex min-w-max gap-3">{statusOrder.map((status) => {
      const cards = selected.cards.filter((card) => card.clientStatus === status);
      return <div key={status} className="w-[270px] shrink-0 rounded-lg border border-[#e3e3e3] bg-[#f1f1f1]"><header className="flex h-11 items-center gap-2 border-b border-[#e1e1e1] px-3"><Circle className="size-2.5 text-[#666]" /><h3 className="text-[9.5px] font-semibold uppercase tracking-[.06em]">{statusLabels[status]}</h3><span className="ml-auto rounded bg-[#e2e2e2] px-1.5 py-0.5 text-[8.5px] tabular">{cards.length}</span></header><div className="grid gap-2 p-2">{cards.map((card) => <article key={card.id} className="rounded-md border border-[#dedede] bg-white p-3"><span className="text-[8.5px] uppercase tracking-[.05em] text-[#999]">{card.team.name.replace("Time ", "")}</span><h4 className="mt-1.5 text-[11.5px] font-medium leading-[1.4]">{card.title}</h4><div className="mt-3 flex items-center gap-2 border-t border-[#eee] pt-2.5"><span className="grid size-5 place-items-center rounded-full bg-[#222] text-[7px] text-white">TB</span><span className="truncate text-[8.5px] text-[#777]">Thinkbrand</span>{card.deadline && <span className="ml-auto flex items-center gap-1 text-[8px] text-[#888]"><CalendarDays className="size-2.5" />{card.deadline.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>}</div></article>)}{cards.length === 0 && <p className="rounded-md border border-dashed border-[#d5d5d5] py-6 text-center text-[9px] text-[#999]">Nenhuma demanda</p>}</div></div>;
    })}</div></section>
  </main>;
}

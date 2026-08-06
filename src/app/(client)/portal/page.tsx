import Image from "next/image";
import { LogOut, UserRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { signOut } from "@/app/actions/auth";
import { ClientBoard } from "@/components/client/ClientBoard";

const statusOrder = ["PENDENTES", "PARA_PRODUCAO", "EM_PRODUCAO", "APROVACAO", "FINALIZADO"];
const statusLabels: Record<string, string> = {
  PENDENTES: "Pendentes", PARA_PRODUCAO: "Para produção", EM_PRODUCAO: "Em produção",
  APROVACAO: "Aprovação", FINALIZADO: "Finalizado",
};

export default async function ClientPortalPage() {
  const user = await requireCurrentUser();
  const client = await prisma.client.findUnique({
    where: { id: user.clientId! },
    include: { cards: { include: { responsible: true, team: true }, orderBy: { order: "asc" } } },
  });
  if (!client) return null;


  return <main className="flex min-h-dvh flex-col bg-[#f7f7f7] text-[#191919]">
    <header className="flex h-16 items-center border-b border-[#e5e5e5] bg-white px-5 sm:px-8">
      <Image src="/control-wordmark.svg" alt="Thinkcontrol" width={132} height={30} className="h-7 w-auto" priority />
      <span className="mx-4 hidden h-5 w-px bg-[#e5e5e5] sm:block" />
      <span className="hidden text-[11px] text-[#777] sm:block">Portal do cliente</span>
      <div className="ml-auto flex items-center gap-3"><span className="hidden text-right sm:block"><b className="block text-[10.5px] font-medium">{user.name}</b><small className="text-[9px] text-[#999]">{client.name}</small></span><span className="grid size-8 place-items-center rounded-full bg-[#171717] text-white"><UserRound className="size-3.5" /></span><form action={signOut}><button type="submit" aria-label="Sair" className="grid size-8 place-items-center rounded-md text-[#777] hover:bg-[#f1f1f1] hover:text-[#222]"><LogOut className="size-3.5" /></button></form></div>
    </header>

    <section className="border-b border-[#e8e8e8] bg-white px-5 py-7 sm:px-8">
      <div className="mx-auto max-w-[1440px]"><span className="text-[9px] font-medium uppercase tracking-[.14em] text-[#999]">Acompanhamento de demandas</span><h1 className="mt-2 text-[26px] font-semibold tracking-[-.04em]">{client.name}</h1><p className="mt-1 text-[11px] text-[#888]">Acompanhe o andamento das entregas da sua empresa.</p></div>
    </section>

    <section className="flex-1 overflow-x-auto p-5 sm:p-8">
      <ClientBoard initialCards={client.cards.map((card) => ({ id: card.id, title: card.title, status: card.clientStatus, deadline: card.deadline?.toISOString() ?? null, order: card.order, teamName: card.team.name, responsibleName: "Thinkbrand", responsibleInitials: "TB" }))} statuses={statusOrder} labels={statusLabels} />
    </section>
  </main>;
}

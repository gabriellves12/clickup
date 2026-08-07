import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, CalendarDays, Megaphone, ArrowUpRight, CircleAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";

export default async function WelcomePage() {
  const user = await requireCurrentUser();
  // Cliente: manda direto pro board da própria pasta.
  if (user.role === "client") {
    const clientTeam = user.clientId
      ? await prisma.team.findFirst({ where: { kind: "CLIENT", clientId: user.clientId }, select: { slug: true } })
      : null;
    redirect(clientTeam ? `/board/${clientTeam.slug}` : "/portal");
  }
  const firstName = user.name.split(" ")[0];
  const person = await prisma.person.findFirst({ where: { name: { contains: firstName } } });
  const now = new Date(); const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7);
  const tasks = person ? await prisma.card.findMany({
    where: { responsibleId: person.id, status: { not: "FINALIZADO" }, OR: [{ deadline: null }, { deadline: { lte: weekEnd } }] },
    include: { client: true, team: true }, orderBy: [{ deadline: "asc" }, { order: "asc" }], take: 6,
  }) : [];
  const overdue = tasks.filter((task) => task.deadline && task.deadline < now).length;

  return <main className="flex-1 min-h-0 overflow-y-auto bg-white">
    <section className="relative w-full aspect-[1920/274] min-h-[150px] max-h-[240px] overflow-hidden border-b border-[#e5e5e5] bg-[#f5f5f5]">
      <Image
        src="/welcome-banner.webp"
        alt="Banner Control"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
    </section>
    <div className="mx-auto max-w-[1180px] px-6 py-8 lg:px-10 lg:py-10">
      <header className="flex items-end justify-between gap-6">
        <div><Image src="/control-wordmark.svg" alt="Control" width={150} height={34} className="h-[34px] w-auto" priority /><h1 className="mt-7 text-[28px] font-semibold tracking-[-.04em]">Seja bem-vindo, {firstName}</h1><p className="mt-1.5 text-[12px] text-[#777]">Aqui está o que merece sua atenção nos próximos dias.</p></div>
        <blockquote className="hidden md:block max-w-[280px] border-l border-[#222] pl-4 pb-1 text-[15px] font-medium tracking-[-.02em]">“A intensidade distorce o tempo.”</blockquote>
      </header>

      <div className="mt-8 grid lg:grid-cols-[1.4fr_.8fr_.8fr] gap-4">
        <DashboardPanel icon={CalendarDays} title="Suas tarefas desta semana" count={tasks.length}>
          {tasks.length ? tasks.map((task) => <Link key={task.id} href={`/board/${task.team.slug}`} className="group flex items-center gap-3 border-b border-[#ededed] px-4 py-3.5 last:border-0 hover:bg-[#fafafa]">
            <span className="size-2 rounded-full border border-[#555]" /><span className="min-w-0 flex-1"><b className="block truncate text-[11.5px] font-medium text-[#252525]">{task.title}</b><small className="mt-1 block text-[9.5px] text-[#8a8a8a]">{task.client.name} · {task.deadline ? task.deadline.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }) : "Sem prazo"}</small></span><ArrowUpRight className="size-3.5 text-[#aaa] group-hover:text-[#333]" />
          </Link>) : <EmptyState text="Nenhuma tarefa para esta semana." />}
        </DashboardPanel>

        <DashboardPanel icon={Bell} title="Notificações" count={overdue}>
          {overdue > 0 ? <div className="flex gap-3 p-4"><CircleAlert className="size-4 shrink-0 text-[#555]" /><div><b className="text-[11.5px] font-medium">{overdue} {overdue === 1 ? "prazo precisa" : "prazos precisam"} de atenção</b><p className="mt-1 text-[10px] leading-4 text-[#888]">Revise as demandas atrasadas antes de iniciar novas entregas.</p></div></div> : <EmptyState text="Você está em dia." />}
        </DashboardPanel>

        <DashboardPanel icon={Megaphone} title="Avisos" count={1}>
          <div className="p-4"><span className="text-[9px] uppercase tracking-[.1em] text-[#999]">Operação</span><p className="mt-2 text-[11px] leading-5 text-[#555]">Mantenha briefing, copy e links atualizados antes de mover uma demanda para produção.</p></div>
        </DashboardPanel>
      </div>
      <p className="mt-8 text-center text-[12px] font-medium md:hidden">“A intensidade distorce o tempo.”</p>
    </div>
  </main>;
}

function DashboardPanel({ icon: Icon, title, count, children }: { icon: typeof CalendarDays; title: string; count: number; children: React.ReactNode }) {
  return <section className="rounded-lg border border-[#e5e5e5] bg-white overflow-hidden"><header className="h-11 px-4 flex items-center gap-2 border-b border-[#eaeaea] bg-[#fafafa]"><Icon className="size-3.5 text-[#666]" /><h2 className="text-[10.5px] font-semibold uppercase tracking-[.055em]">{title}</h2><span className="ml-auto rounded bg-[#eaeaea] px-1.5 py-0.5 text-[9px] tabular text-[#666]">{count}</span></header>{children}</section>;
}
function EmptyState({ text }: { text: string }) { return <p className="p-5 text-center text-[10.5px] text-[#999]">{text}</p>; }

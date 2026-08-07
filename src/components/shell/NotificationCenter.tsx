"use client";

import * as React from "react";
import { Bell, CheckCheck, CircleAlert, Megaphone, PackageOpen, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  overdueCount: number;
  pendingMaterialCount: number;
  variant?: "workspace" | "client";
};

type Tab = "notifications" | "announcements";

export function NotificationCenter({ overdueCount, pendingMaterialCount, variant = "workspace" }: Props) {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<Tab>("notifications");
  const panelRef = React.useRef<HTMLElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const attentionCount = overdueCount + pendingMaterialCount;
  const audience = variant === "client" ? "sua empresa" : "a operação";
  const secondaryTitle = variant === "client"
    ? (pendingMaterialCount === 1 ? "1 demanda aguardando aprovação" : `${pendingMaterialCount} demandas aguardando aprovação`)
    : (pendingMaterialCount === 1 ? "1 material ainda pendente" : `${pendingMaterialCount} materiais ainda pendentes`);
  const secondaryDescription = variant === "client"
    ? "Há entregas que precisam da sua validação para seguir no fluxo."
    : "Há demandas aguardando arquivos ou informações para seguir.";

  React.useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Abrir central de notificações e avisos"
        aria-expanded={open}
        aria-controls="notification-center"
        className={cn(
          "relative flex h-8 items-center gap-2 rounded-md border border-[#e3e3e3] bg-white px-2.5 text-[#555] shadow-[0_1px_1px_rgba(0,0,0,.02)] transition-colors hover:border-[#cfcfcf] hover:bg-[#fafafa] hover:text-[#171717]",
          variant === "client" && "ml-auto mr-2 sm:mr-3",
        )}
      >
        <Bell className="size-3.5" strokeWidth={1.8} />
        <span className="hidden text-[10.5px] font-medium sm:inline">Central</span>
        {attentionCount > 0 && (
          <span className="grid size-4 place-items-center rounded-full bg-[#1a1a1a] text-[8px] font-semibold tabular text-white">
            {attentionCount > 9 ? "9+" : attentionCount}
          </span>
        )}
      </button>

      {open && (
        <aside
          ref={panelRef}
          id="notification-center"
          aria-label="Central de notificações e avisos"
          className={cn("fixed right-3 z-50 flex max-h-[calc(100dvh-72px)] w-[min(360px,calc(100vw-24px))] flex-col overflow-hidden rounded-xl border border-[#dedede] bg-white shadow-[0_18px_50px_rgba(0,0,0,.14)] animate-[drawerIn_180ms_var(--ease-emphasized)]", variant === "client" ? "top-[72px]" : "top-[60px]")}
        >
          <header className="flex items-start border-b border-[#ededed] px-4 pb-3 pt-4">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-medium uppercase tracking-[.12em] text-[#999]">Sempre à mão</p>
              <h2 className="mt-1 text-[16px] font-semibold tracking-[-.035em] text-[#1a1a1a]">Central</h2>
              <p className="mt-0.5 text-[10px] text-[#888]">Atualizações que pedem atenção.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar central" className="-mr-1 -mt-1 grid size-7 place-items-center rounded-md text-[#888] hover:bg-[#f2f2f2] hover:text-[#222]">
              <X className="size-3.5" />
            </button>
          </header>

          <div className="flex gap-1 border-b border-[#ededed] px-3 pt-2">
            <TabButton active={tab === "notifications"} onClick={() => setTab("notifications")} count={attentionCount}>Notificações</TabButton>
            <TabButton active={tab === "announcements"} onClick={() => setTab("announcements")}>Avisos</TabButton>
          </div>

          <div className="min-h-0 overflow-y-auto p-3 scrollbar-clean">
            {tab === "notifications" ? (
              <div className="grid gap-2">
                {overdueCount > 0 && <NotificationItem icon={CircleAlert} title={overdueCount === 1 ? "1 demanda com prazo vencido" : `${overdueCount} demandas com prazo vencido`} description="Revise as prioridades antes de iniciar novas entregas." tone="urgent" />}
                {pendingMaterialCount > 0 && <NotificationItem icon={PackageOpen} title={secondaryTitle} description={secondaryDescription} />}
                {attentionCount === 0 && <EmptyState />}
              </div>
            ) : (
              <div className="grid gap-2">
                <AnnouncementItem title="Rotina de produção" description="Mantenha briefing, copy e links atualizados antes de mover uma demanda para produção." />
                <AnnouncementItem title="Central fixa" description={`Use este espaço para acompanhar rapidamente os avisos importantes para ${audience}.`} />
              </div>
            )}
          </div>
          <footer className="border-t border-[#ededed] bg-[#fcfcfc] px-4 py-2.5 text-center text-[9.5px] text-[#999]">A central permanece disponível em qualquer tela.</footer>
        </aside>
      )}
    </>
  );
}

function TabButton({ active, count, onClick, children }: { active: boolean; count?: number; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("relative h-8 px-2 text-[10px] font-medium transition-colors", active ? "text-[#171717]" : "text-[#888] hover:text-[#444]")}>
    <span className="inline-flex items-center gap-1.5">{children}{typeof count === "number" && count > 0 && <span className="rounded bg-[#eaeaea] px-1 py-px text-[8px] tabular text-[#666]">{count}</span>}</span>
    {active && <span className="absolute inset-x-2 bottom-0 h-px bg-[#171717]" />}
  </button>;
}

function NotificationItem({ icon: Icon, title, description, tone = "neutral" }: { icon: typeof Bell; title: string; description: string; tone?: "neutral" | "urgent" }) {
  return <article className={cn("flex gap-3 rounded-lg border p-3", tone === "urgent" ? "border-[#d8d8d8] bg-[#fafafa]" : "border-[#e7e7e7] bg-white")}>
    <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-md", tone === "urgent" ? "bg-[#1d1d1d] text-white" : "bg-[#f0f0f0] text-[#555]")}><Icon className="size-3.5" strokeWidth={1.8} /></span>
    <div className="min-w-0"><h3 className="text-[11px] font-medium leading-4 text-[#252525]">{title}</h3><p className="mt-1 text-[9.5px] leading-4 text-[#888]">{description}</p></div>
  </article>;
}

function AnnouncementItem({ title, description }: { title: string; description: string }) {
  return <article className="flex gap-3 rounded-lg border border-[#e7e7e7] bg-white p-3"><span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-[#1d1d1d] text-white"><Megaphone className="size-3.5" strokeWidth={1.8} /></span><div><h3 className="text-[11px] font-medium leading-4 text-[#252525]">{title}</h3><p className="mt-1 text-[9.5px] leading-4 text-[#888]">{description}</p></div></article>;
}

function EmptyState() {
  return <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-[#dedede] bg-[#fcfcfc] px-8 text-center"><div><span className="mx-auto grid size-8 place-items-center rounded-full bg-[#f0f0f0] text-[#555]"><CheckCheck className="size-4" /></span><b className="mt-3 block text-[10.5px] font-medium text-[#555]">Tudo em dia</b><p className="mt-1 text-[9.5px] leading-4 text-[#999]">Não há notificações que precisem da sua atenção agora.</p></div></div>;
}

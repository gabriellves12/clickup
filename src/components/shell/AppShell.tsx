"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3, ChevronDown, ChevronLeft, ChevronRight, ContactRound, FolderKanban,
  FolderUp, House, KanbanSquare, LogOut, PanelsTopLeft, Plus, Search, Settings, ShieldCheck, UsersRound,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { canAccess, isRestrictedPath, navigationItems, type NavigationIcon, type UserRole } from "@/lib/navigation";
import { setTemporaryRole } from "@/app/actions/session";
import { Avatar } from "@/components/ui/primitives";
import type { CurrentUser } from "@/lib/current-user";
import { signOut } from "@/app/actions/auth";

type TeamSummary = { slug: string; name: string; cardsCount: number; overdueCount: number };
const iconMap = { home: House, kanban: KanbanSquare, clients: UsersRound, clientArea: PanelsTopLeft, crm: ContactRound, drive: FolderUp, dashboard: BarChart3, admin: ShieldCheck } satisfies Record<NavigationIcon, React.ComponentType<{ className?: string; strokeWidth?: number }>>;

export function AppShell({ user, teamsSummary, children }: { user: CurrentUser; teamsSummary: TeamSummary[]; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState(false);
  const [boardsOpen, setBoardsOpen] = React.useState(path.startsWith("/board") || path.startsWith("/kanban"));
  const [rolePending, startRoleTransition] = React.useTransition();
  const [accountOpen, setAccountOpen] = React.useState(false);
  const accountRef = React.useRef<HTMLDivElement>(null);
  const operational = navigationItems.filter((item) => item.group === "operational" && canAccess(user.role, item));
  const adminItems = navigationItems.filter((item) => item.group === "admin" && canAccess(user.role, item));
  const accountItems = navigationItems.filter((item) => item.group === "account" && canAccess(user.role, item));

  const changeRole = (role: UserRole) => startRoleTransition(async () => {
    await setTemporaryRole(role);
    if (role === "client") router.push("/portal"); else if (isRestrictedPath(path, role)) router.push("/kanban"); else router.refresh();
  });
  React.useEffect(() => {
    function close(event: PointerEvent) { if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false); }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  return <div className="h-dvh w-full overflow-hidden bg-white text-[#1a1a1a] flex">
    <aside className={cn("h-full shrink-0 border-r border-[#ebebeb] bg-[#fafafa] flex flex-col transition-[width] duration-200 z-30", collapsed ? "w-[64px]" : "w-[224px]")}>
      <div className={cn("h-[52px] shrink-0 border-b border-[#ebebeb] flex items-center", collapsed ? "justify-center" : "px-3")}>
        <Link href="/inicio" prefetch={false} className="min-w-0 flex items-center gap-2.5 text-[#1a1a1a] no-underline hover:no-underline">
          {collapsed ? <span className="size-7 shrink-0 grid place-items-center"><Image src="/control-icon.svg" alt="Control" width={23} height={20} className="h-[20px] w-auto" priority /></span> : <><Image src="/control-wordmark.svg" alt="Control" width={106} height={24} className="h-[24px] w-auto" priority /><span className="rounded-full bg-[#ededed] px-2 py-0.5 text-[9px] font-medium text-[#666]">Interno</span><ChevronDown className="size-3 ml-auto text-[#777]" /></>}
        </Link>
      </div>

      <div className="px-2 py-2">
        <button type="button" className={cn("h-8 w-full border border-[#e6e6e6] bg-white rounded-md flex items-center text-[#777] shadow-[0_1px_1px_rgba(0,0,0,.03)]", collapsed ? "justify-center" : "px-2 gap-2")}><Search className="size-3.5" />{!collapsed && <><span className="text-[11.5px]">Buscar</span><kbd className="ml-auto border border-[#e6e6e6] rounded px-1.5 text-[9px] text-[#888]">F</kbd></>}</button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-3">
        <NavGroup items={operational} path={path} collapsed={collapsed} teamsSummary={teamsSummary} boardsOpen={boardsOpen} onToggleBoards={() => setBoardsOpen(!boardsOpen)} />
        {adminItems.length > 0 && <div className="mt-4 pt-3 border-t border-[#e9e9e9]">{!collapsed && <p className="px-2 mb-1.5 text-[9px] font-medium uppercase tracking-[.12em] text-[#999]">Admin</p>}<NavGroup items={adminItems} path={path} collapsed={collapsed} /></div>}
      </div>

      {accountItems.length > 0 && <div className="border-t border-[#e9e9e9] px-2 py-2"><NavGroup items={accountItems} path={path} collapsed={collapsed} /></div>}
      <div ref={accountRef} className="relative border-t border-[#e9e9e9]">
        {accountOpen && <div className={cn("absolute bottom-[58px] z-50 w-[204px] overflow-hidden rounded-lg border border-[#dedede] bg-white p-1.5 shadow-[0_12px_32px_rgba(0,0,0,.12)]", collapsed ? "left-2" : "left-2")}><div className="border-b border-[#ededed] px-2.5 py-2"><b className="block truncate text-[10.5px] font-medium">{user.name}</b><span className="mt-0.5 block truncate text-[8.5px] text-[#999]">{user.email}</span></div><Link href="/configuracoes" onClick={() => setAccountOpen(false)} className="mt-1 flex h-8 items-center gap-2 rounded-md px-2.5 text-[10.5px] text-[#555] hover:bg-[#f2f2f2] hover:text-[#111]"><Settings className="size-3.5" />Configurações</Link><form action={signOut}><button type="submit" className="flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-[10.5px] text-[#555] hover:bg-[#f2f2f2] hover:text-[#111]"><LogOut className="size-3.5" />Sair</button></form>{user.canSwitchRole && <div className="mt-1 border-t border-[#ededed] px-2.5 pt-2"><label className="text-[8px] uppercase tracking-[.08em] text-[#999]">Visualizar como</label><select aria-label="Visualizar como" value={user.role} disabled={rolePending} onChange={(event) => changeRole(event.target.value as UserRole)} className="mt-1 h-7 w-full rounded border border-[#ddd] bg-white px-2 text-[9.5px] outline-none"><option value="admin">Administrador</option><option value="manager">Gestão</option><option value="member">Colaborador</option></select></div>}</div>}
        <button type="button" onClick={() => setAccountOpen((value) => !value)} aria-expanded={accountOpen} className={cn("min-h-[62px] w-full flex items-center text-left hover:bg-[#f1f1f1] transition-colors", collapsed ? "justify-center px-2" : "px-3 gap-2.5")}><Avatar size="sm" initials={user.initials} colorKey="av-5" className="border-0 shrink-0" />{!collapsed && <><div className="min-w-0 flex-1"><b className="block truncate text-[11.5px] font-medium">{user.name}</b><span className="block text-[9.5px] text-[#888]">{{ admin: "Administrador", manager: "Gestão", member: "Colaborador", client: "Cliente" }[user.role]}</span></div><ChevronDown className={cn("size-3 text-[#999] transition-transform", accountOpen && "rotate-180")} /></>}</button>
      </div>
    </aside>

    <section className="min-w-0 flex-1 h-full flex flex-col bg-white">
      <TopBar path={path} teamsSummary={teamsSummary} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">{children}</div>
    </section>
  </div>;
}

function NavGroup({ items, path, collapsed, teamsSummary = [], boardsOpen = false, onToggleBoards }: { items: typeof navigationItems; path: string; collapsed: boolean; teamsSummary?: TeamSummary[]; boardsOpen?: boolean; onToggleBoards?: () => void }) {
  return <nav className="grid gap-px">{items.map((item) => {
    const Icon = iconMap[item.icon];
    const active = (item.matchPrefixes ?? [item.href]).some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
    const content = <><span className={cn("size-6 shrink-0 rounded-md border grid place-items-center transition-colors", active ? "bg-[#1a1a1a] border-[#1a1a1a] text-white" : "bg-white border-[#e4e4e4] text-[#666]")}><Icon className="size-[13px]" strokeWidth={1.8} /></span>{!collapsed && <span className="truncate">{item.label}</span>}</>;
    if (item.icon === "kanban" && !collapsed) return <div key={item.href}>
      <button type="button" onClick={onToggleBoards} aria-expanded={boardsOpen} className={cn("w-full h-9 rounded-md flex items-center px-2 gap-2 text-[11.5px] font-medium transition-colors hover:bg-[#eeeeee]", active ? "text-[#171717]" : "text-[#666] hover:text-[#171717]")}>{content}<ChevronDown className={cn("size-3 ml-auto text-[#999] transition-transform", boardsOpen && "rotate-180")} /></button>
      {boardsOpen && <div className="ml-[19px] pl-[19px] border-l border-[#e3e3e3] py-1 grid gap-px">
        {teamsSummary.map((team) => { const selected = path === `/board/${team.slug}`; return <Link key={team.slug} href={`/board/${team.slug}`} prefetch={false} className={cn("h-7 -ml-1 px-1 rounded flex items-center gap-2 text-[10.5px] no-underline hover:no-underline transition-colors hover:bg-[#eeeeee]", selected ? "font-semibold text-[#171717]" : "text-[#777] hover:text-[#222]")}><FolderKanban className="size-3" /><span>{team.name.replace("Time ", "")}</span><span className="ml-auto mr-1 text-[9px] tabular text-[#999]">{team.cardsCount}</span></Link>; })}
        <button type="button" title="Criação de quadros em breve" className="h-7 -ml-1 px-1 rounded flex items-center gap-2 text-[10.5px] text-[#777] hover:text-[#222] hover:bg-[#eeeeee]"><Plus className="size-3" /><span>Criar novo</span></button>
      </div>}
    </div>;
    return <Link key={item.href} href={item.href} prefetch={false} title={collapsed ? item.label : undefined} aria-current={active ? "page" : undefined} className={cn("h-9 rounded-md flex items-center text-[11.5px] font-medium no-underline hover:no-underline transition-colors hover:bg-[#eeeeee]", collapsed ? "justify-center" : "px-2 gap-2", active ? "text-[#171717]" : "text-[#666] hover:text-[#171717]")}>{content}</Link>;
  })}</nav>;
}

function TopBar({ path, collapsed, onToggle }: { path: string; teamsSummary: TeamSummary[]; collapsed: boolean; onToggle: () => void }) {
  const current = navigationItems.find((item) => (item.matchPrefixes ?? [item.href]).some((prefix) => path === prefix || path.startsWith(`${prefix}/`)));
  const currentLabel = path === "/configuracoes" ? "Configurações" : current?.label ?? "Visão geral";
  return <header className="h-[52px] shrink-0 border-b border-[#ebebeb] bg-white flex items-center px-4 gap-3">
    <button type="button" onClick={onToggle} aria-label={collapsed ? "Expandir menu" : "Recolher menu"} className="size-7 rounded-md grid place-items-center text-[#777] hover:bg-[#f2f2f2]">{collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}</button>
    <span className="h-4 w-px bg-[#ededed]" />
    <div className="flex items-center gap-2 text-[11.5px]"><span className="text-[#888]">Workspace</span><span className="text-[#bbb]">/</span><b className="font-medium text-[#222]">{currentLabel}</b></div>
    <span className="ml-auto text-[10px] text-[#999]">Visão geral</span>
  </header>;
}

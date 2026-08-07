"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3, ChevronDown, ChevronLeft, ChevronRight, ContactRound, FolderKanban,
  FolderUp, House, KanbanSquare, LogOut, PanelsTopLeft, Plus, Search, Settings, ShieldCheck, UsersRound,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { canAccess, isRestrictedPath, navigationItems, type NavigationIcon, type UserRole } from "@/lib/navigation";
import { setTemporaryRole } from "@/app/actions/session";
import { Avatar } from "@/components/ui/primitives";
import type { CurrentUser } from "@/lib/current-user";
import { signOut } from "@/app/actions/auth";
import { CreateBoardDialog } from "@/components/dialogs/CreateBoardDialog";
import { NotificationCenter } from "@/components/shell/NotificationCenter";

export type BoardMenuItem = {
  slug: string;
  name: string;
  kind: "TEAM" | "CLIENT";
  cardsCount: number;
  overdueCount: number;
};

type Props = {
  user: CurrentUser;
  boards: BoardMenuItem[];
  canEditBoards: boolean;
  clients: { id: string; name: string }[];
  overdueCount: number;
  pendingMaterialCount: number;
  children: React.ReactNode;
};

const iconMap = {
  home: House, kanban: KanbanSquare, clients: UsersRound, clientArea: PanelsTopLeft,
  crm: ContactRound, drive: FolderUp, references: PanelsTopLeft, dashboard: BarChart3, accesses: KeyRound, admin: ShieldCheck,
} satisfies Record<NavigationIcon, React.ComponentType<{ className?: string; strokeWidth?: number }>>;

export function AppShell({ user, boards, canEditBoards, clients, overdueCount, pendingMaterialCount, children }: Props) {
  const path = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState(false);
  const teamBoards = React.useMemo(() => boards.filter((b) => b.kind === "TEAM"), [boards]);
  const clientBoards = React.useMemo(() => boards.filter((b) => b.kind === "CLIENT"), [boards]);
  const activeSlug = path.startsWith("/board/") ? path.split("/")[2] : null;
  const activeBoard = activeSlug ? boards.find((b) => b.slug === activeSlug) : null;
  const activeIsClientBoard = activeBoard?.kind === "CLIENT";

  const [kanbanOpen, setKanbanOpen] = React.useState(
    path.startsWith("/kanban") || (path.startsWith("/board") && !activeIsClientBoard)
  );
  const [clientAreaOpen, setClientAreaOpen] = React.useState(
    path.startsWith("/area-cliente") || activeIsClientBoard
  );
  const [createDialogKind, setCreateDialogKind] = React.useState<"TEAM" | "CLIENT" | null>(null);

  const [rolePending, startRoleTransition] = React.useTransition();
  const [accountOpen, setAccountOpen] = React.useState(false);
  const accountRef = React.useRef<HTMLDivElement>(null);

  const operational = navigationItems.filter((item) => item.group === "operational" && canAccess(user.role, item));
  const adminItems = navigationItems.filter((item) => item.group === "admin" && canAccess(user.role, item));
  const accountItems = navigationItems.filter((item) => item.group === "account" && canAccess(user.role, item));

  const changeRole = (role: UserRole) => startRoleTransition(async () => {
    await setTemporaryRole(role);
    if (role === "client") router.push("/portal");
    else if (isRestrictedPath(path, role)) router.push("/kanban");
    else router.refresh();
  });

  React.useEffect(() => {
    function close(event: PointerEvent) { if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false); }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  return (
    <div className="h-dvh w-full overflow-hidden bg-white text-[#1a1a1a] flex">
      <aside className={cn("h-full shrink-0 border-r border-[#ebebeb] bg-[#fafafa] flex flex-col transition-[width] duration-200 z-30", collapsed ? "w-[64px]" : "w-[224px]")}>
        <div className={cn("h-[52px] shrink-0 border-b border-[#ebebeb] flex items-center", collapsed ? "justify-center" : "px-3")}>
          <Link href="/inicio" className="min-w-0 flex items-center gap-2.5 text-[#1a1a1a] no-underline hover:no-underline">
            {collapsed
              ? <span className="size-7 shrink-0 grid place-items-center"><Image src="/control-icon.svg" alt="Control" width={23} height={20} className="h-[20px] w-auto" priority /></span>
              : <><Image src="/control-wordmark.svg" alt="Control" width={106} height={24} className="h-[24px] w-auto" priority /><span className="rounded-full bg-[#ededed] px-2 py-0.5 text-[9px] font-medium text-[#666]">Interno</span></>}
          </Link>
        </div>

        <div className="px-2 py-2">
          <button type="button" className={cn("h-8 w-full border border-[#e6e6e6] bg-white rounded-md flex items-center text-[#777] shadow-[0_1px_1px_rgba(0,0,0,.03)]", collapsed ? "justify-center" : "px-2 gap-2")}>
            <Search className="size-3.5" />
            {!collapsed && <><span className="text-[11.5px]">Buscar</span><kbd className="ml-auto border border-[#e6e6e6] rounded px-1.5 text-[9px] text-[#888]">F</kbd></>}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-3">
          <NavGroup
            items={operational}
            path={path}
            collapsed={collapsed}
            teamBoards={teamBoards}
            clientBoards={clientBoards}
            kanbanOpen={kanbanOpen}
            clientAreaOpen={clientAreaOpen}
            onToggleKanban={() => setKanbanOpen((v) => !v)}
            onToggleClientArea={() => setClientAreaOpen((v) => !v)}
            canEditBoards={canEditBoards}
            onCreateBoard={(kind) => setCreateDialogKind(kind)}
            activeSlug={activeSlug}
          />
          {adminItems.length > 0 && (
            <NavGroup items={adminItems} path={path} collapsed={collapsed} activeSlug={activeSlug} />
          )}
        </div>

        {accountItems.length > 0 && <div className="border-t border-[#e9e9e9] px-2 py-2"><NavGroup items={accountItems} path={path} collapsed={collapsed} activeSlug={activeSlug} /></div>}

        <div ref={accountRef} className="relative border-t border-[#e9e9e9]">
          {accountOpen && (
            <div className={cn("absolute bottom-[58px] z-50 w-[204px] overflow-hidden rounded-lg border border-[#dedede] bg-white p-1.5 shadow-[0_12px_32px_rgba(0,0,0,.12)]", collapsed ? "left-2" : "left-2")}>
              <div className="border-b border-[#ededed] px-2.5 py-2">
                <b className="block truncate text-[10.5px] font-medium">{user.name}</b>
                <span className="mt-0.5 block truncate text-[8.5px] text-[#999]">{user.email}</span>
              </div>
              <Link href="/configuracoes" onClick={() => setAccountOpen(false)} className="mt-1 flex h-8 items-center gap-2 rounded-md px-2.5 text-[10.5px] text-[#555] hover:bg-[#f2f2f2] hover:text-[#111]">
                <Settings className="size-3.5" />Configurações
              </Link>
              <form action={signOut}>
                <button type="submit" className="flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-[10.5px] text-[#555] hover:bg-[#f2f2f2] hover:text-[#111]">
                  <LogOut className="size-3.5" />Sair
                </button>
              </form>
              {user.canSwitchRole && (
                <div className="mt-1 border-t border-[#ededed] px-2.5 pt-2">
                  <label className="text-[8px] uppercase tracking-[.08em] text-[#999]">Visualizar como</label>
                  <select aria-label="Visualizar como" value={user.role} disabled={rolePending} onChange={(event) => changeRole(event.target.value as UserRole)} className="mt-1 h-7 w-full rounded border border-[#ddd] bg-white px-2 text-[9.5px] outline-none">
                    <option value="admin">Administrador</option>
                    <option value="manager">Gestão</option>
                    <option value="member">Colaborador</option>
                  </select>
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setAccountOpen((value) => !value)}
            aria-expanded={accountOpen}
            className={cn("min-h-[62px] w-full flex items-center text-left hover:bg-[#f1f1f1] transition-colors", collapsed ? "justify-center px-2" : "px-3 gap-2.5")}
          >
            <Avatar size="sm" initials={user.initials} imageUrl={user.avatarUrl} colorKey="av-5" className="border-0 shrink-0 overflow-hidden" />
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-[11.5px] font-medium">{user.name}</b>
                  <span className="block text-[9.5px] text-[#888]">
                    {{ admin: "Administrador", manager: "Gestão", member: "Colaborador", client: "Cliente" }[user.role]}
                  </span>
                </div>
                <ChevronDown className={cn("size-3 text-[#999] transition-transform", accountOpen && "rotate-180")} />
              </>
            )}
          </button>
        </div>
      </aside>

      <section className="min-w-0 flex-1 h-full flex flex-col bg-white">
        <TopBar path={path} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} overdueCount={overdueCount} pendingMaterialCount={pendingMaterialCount} />
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">{children}</div>
      </section>

      <CreateBoardDialog
        open={createDialogKind !== null}
        onOpenChange={(v) => { if (!v) setCreateDialogKind(null); }}
        kind={createDialogKind ?? "TEAM"}
        clients={clients}
      />
    </div>
  );
}

/* ------------------------- NavGroup ------------------------- */

type NavGroupProps = {
  items: typeof navigationItems;
  path: string;
  collapsed: boolean;
  activeSlug: string | null;
  teamBoards?: BoardMenuItem[];
  clientBoards?: BoardMenuItem[];
  kanbanOpen?: boolean;
  clientAreaOpen?: boolean;
  onToggleKanban?: () => void;
  onToggleClientArea?: () => void;
  canEditBoards?: boolean;
  onCreateBoard?: (kind: "TEAM" | "CLIENT") => void;
};

function NavGroup({
  items, path, collapsed, activeSlug,
  teamBoards = [], clientBoards = [], kanbanOpen = false, clientAreaOpen = false,
  onToggleKanban, onToggleClientArea, canEditBoards = false, onCreateBoard,
}: NavGroupProps) {
  return (
    <nav className="grid gap-px">
      {items.map((item) => {
        const Icon = iconMap[item.icon];
        const rawActive = (item.matchPrefixes ?? [item.href]).some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
        // Kanban e Área do cliente compartilham prefixo "/board". Desambigua pelo kind do slug ativo.
        const isBoardRoute = path.startsWith("/board/");
        const isKanbanItem = item.icon === "kanban";
        const isClientAreaItem = item.icon === "clientArea";
        const currentIsClientBoard = clientBoards.some((b) => b.slug === activeSlug);
        const active = rawActive
          && !(isBoardRoute && isKanbanItem && currentIsClientBoard)
          && !(isBoardRoute && isClientAreaItem && !currentIsClientBoard);
        const content = (
          <>
            <span className={cn("size-6 shrink-0 rounded-md border grid place-items-center transition-colors", active ? "bg-[#1a1a1a] border-[#1a1a1a] text-white" : "bg-white border-[#e4e4e4] text-[#666]")}>
              <Icon className="size-[13px]" strokeWidth={1.8} />
            </span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </>
        );

        // Kanban → dropdown com boards TEAM
        if (item.icon === "kanban" && !collapsed) {
          return (
            <div key={item.href}>
              <button
                type="button"
                onClick={onToggleKanban}
                aria-expanded={kanbanOpen}
                className={cn("w-full h-9 rounded-md flex items-center px-2 gap-2 text-[11.5px] font-medium transition-colors hover:bg-[#eeeeee]", active ? "text-[#171717]" : "text-[#666] hover:text-[#171717]")}
              >
                {content}
                <ChevronDown className={cn("size-3 ml-auto text-[#999] transition-transform", kanbanOpen && "rotate-180")} />
              </button>
              {kanbanOpen && (
                <BoardDropdown
                  boards={teamBoards}
                  activeSlug={activeSlug}
                  canCreate={canEditBoards}
                  onCreate={() => onCreateBoard?.("TEAM")}
                />
              )}
            </div>
          );
        }

        // Área do cliente → dropdown com boards CLIENT
        if (item.icon === "clientArea" && !collapsed) {
          return (
            <div key={item.href}>
              <button
                type="button"
                onClick={onToggleClientArea}
                aria-expanded={clientAreaOpen}
                className={cn("w-full h-9 rounded-md flex items-center px-2 gap-2 text-[11.5px] font-medium transition-colors hover:bg-[#eeeeee]", active ? "text-[#171717]" : "text-[#666] hover:text-[#171717]")}
              >
                {content}
                <ChevronDown className={cn("size-3 ml-auto text-[#999] transition-transform", clientAreaOpen && "rotate-180")} />
              </button>
              {clientAreaOpen && (
                <BoardDropdown
                  boards={clientBoards}
                  activeSlug={activeSlug}
                  canCreate={canEditBoards}
                  onCreate={() => onCreateBoard?.("CLIENT")}
                />
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            aria-current={active ? "page" : undefined}
            className={cn("h-9 rounded-md flex items-center text-[11.5px] font-medium no-underline hover:no-underline transition-colors hover:bg-[#eeeeee]", collapsed ? "justify-center" : "px-2 gap-2", active ? "text-[#171717]" : "text-[#666] hover:text-[#171717]")}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}

function BoardDropdown({
  boards, activeSlug, canCreate, onCreate,
}: {
  boards: BoardMenuItem[];
  activeSlug: string | null;
  canCreate: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="ml-[19px] pl-[19px] border-l border-[#e3e3e3] py-1 grid gap-px">
      {boards.length === 0 && (
        <span className="h-7 -ml-1 px-1 flex items-center text-[10.5px] text-[#999]">Nenhum quadro</span>
      )}
      {boards.map((board) => {
        const selected = activeSlug === board.slug;
        return (
          <Link
            key={board.slug}
            href={`/board/${board.slug}`}
            className={cn("h-7 -ml-1 px-1 rounded flex items-center gap-2 text-[10.5px] no-underline hover:no-underline transition-colors hover:bg-[#eeeeee]", selected ? "font-semibold text-[#171717]" : "text-[#777] hover:text-[#222]")}
          >
            <FolderKanban className="size-3" />
            <span className="truncate">{board.name.replace(/^Time /, "")}</span>
            <span className="ml-auto mr-1 text-[9px] tabular text-[#999]">{board.cardsCount}</span>
          </Link>
        );
      })}
      {canCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="h-7 -ml-1 px-1 rounded flex items-center gap-2 text-[10.5px] text-[#777] hover:text-[#222] hover:bg-[#eeeeee]"
        >
          <Plus className="size-3" /><span>Criar novo</span>
        </button>
      ) : (
        <span className="h-7 -ml-1 px-1 flex items-center gap-2 text-[10.5px] text-[#c0c0c0] cursor-not-allowed" title="Somente admin/gestão">
          <Plus className="size-3" /><span>Criar novo</span>
        </span>
      )}
    </div>
  );
}

/* ------------------------- TopBar ------------------------- */

function TopBar({ path, collapsed, onToggle, overdueCount, pendingMaterialCount }: { path: string; collapsed: boolean; onToggle: () => void; overdueCount: number; pendingMaterialCount: number }) {
  const current = navigationItems.find((item) => (item.matchPrefixes ?? [item.href]).some((prefix) => path === prefix || path.startsWith(`${prefix}/`)));
  const currentLabel = path === "/configuracoes" ? "Configurações" : current?.label ?? "Visão geral";
  return (
    <header className="h-[52px] shrink-0 border-b border-[#ebebeb] bg-white flex items-center px-4 gap-3">
      <button type="button" onClick={onToggle} aria-label={collapsed ? "Expandir menu" : "Recolher menu"} className="size-7 rounded-md grid place-items-center text-[#777] hover:bg-[#f2f2f2]">
        {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
      </button>
      <span className="h-4 w-px bg-[#ededed]" />
      <div className="flex items-center gap-2 text-[11.5px]">
        <span className="text-[#888]">Workspace</span>
        <span className="text-[#bbb]">/</span>
        <b className="font-medium text-[#222]">{currentLabel}</b>
      </div>
      <div className="ml-auto"><NotificationCenter overdueCount={overdueCount} pendingMaterialCount={pendingMaterialCount} /></div>
    </header>
  );
}

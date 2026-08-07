import Link from "next/link";
import { Bell, KeyRound, Settings2, ShieldCheck, SlidersHorizontal, UserRound } from "lucide-react";
import type { CurrentUser } from "@/lib/current-user";
import { SettingsPreferences } from "./SettingsPreferences";

const roleLabel = { admin: "Administrador", manager: "Gestão", member: "Colaborador", client: "Cliente" } as const;

export function AccountSettings({ user, standalone = false }: { user: CurrentUser; standalone?: boolean }) {
  return <main className={`${standalone ? "min-h-dvh" : "min-h-0 flex-1"} overflow-y-auto bg-[#f7f7f7]`}>
    <header className="border-b border-[#e5e5e5] bg-white px-6 py-7 lg:px-10"><div className="mx-auto max-w-[1040px]">{standalone && <Link href="/portal" className="mb-5 inline-flex text-[10px] text-[#777] hover:text-[#111]">← Voltar ao quadro</Link>}<p className="text-[9px] font-medium uppercase tracking-[.14em] text-[#999]">Sua conta</p><h1 className="mt-2 text-[25px] font-semibold tracking-[-.04em]">Configurações</h1><p className="mt-1 text-[11px] text-[#888]">Perfil, preferências pessoais, notificações e segurança.</p></div></header>
    <div className="mx-auto grid max-w-[1040px] gap-4 p-5 lg:grid-cols-[1fr_1.35fr] lg:p-8">
      <div className="space-y-4">
        <SettingsSection icon={UserRound} title="Perfil" description="Informações utilizadas na equipe e nas tarefas."><div className="flex items-center gap-3 rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#1c1c1c] text-[10px] font-semibold text-white">{user.initials}</span><div className="min-w-0"><b className="block truncate text-[11.5px] font-medium">{user.name}</b><span className="block truncate text-[9.5px] text-[#888]">{user.email}</span></div><span className="ml-auto rounded bg-[#e9e9e9] px-2 py-1 text-[8.5px] font-medium text-[#666]">{roleLabel[user.role]}</span></div><p className="mt-3 text-[9.5px] leading-4 text-[#888]">Nome, e-mail e papel são administrados pelo responsável do workspace para manter os acessos consistentes.</p></SettingsSection>
        <SettingsSection icon={ShieldCheck} title="Segurança" description="Proteja seu acesso ao workspace."><Link href="/definir-senha" className="flex h-10 items-center gap-2 rounded-md border border-[#dedede] bg-white px-3 text-[10.5px] font-medium text-[#444] hover:bg-[#f5f5f5] hover:text-[#111]"><KeyRound className="size-3.5" />Alterar minha senha<span className="ml-auto text-[#aaa]">→</span></Link><p className="mt-3 text-[9.5px] leading-4 text-[#888]">As senhas são gerenciadas pelo Supabase Auth e nunca ficam visíveis para administradores.</p></SettingsSection>
        {user.role === "admin" && <SettingsSection icon={SlidersHorizontal} title="Configurações internas" description="Estrutura exclusiva do administrador."><Link href="/admin" className="flex h-10 items-center gap-2 rounded-md bg-[#171717] px-3 text-[10.5px] font-medium text-white hover:bg-[#303030]">Abrir Painel Admin<span className="ml-auto">→</span></Link><p className="mt-3 text-[9.5px] leading-4 text-[#888]">Gerencie usuários, papéis, portais de clientes e configurações gerais da operação.</p></SettingsSection>}
      </div>
      <div className="space-y-4"><SettingsSection icon={Bell} title="Notificações" description="Escolha o que merece interromper você."><SettingsPreferences kind="notifications" /></SettingsSection><SettingsSection icon={Settings2} title="Preferências do workspace" description="Ajuste sua experiência sem alterar a equipe."><SettingsPreferences kind="workspace" /></SettingsSection></div>
    </div>
  </main>;
}

function SettingsSection({ icon: Icon, title, description, children }: { icon: typeof UserRound; title: string; description: string; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-lg border border-[#e2e2e2] bg-white"><header className="flex items-center gap-3 border-b border-[#e9e9e9] px-4 py-3.5"><span className="grid size-7 place-items-center rounded-md border border-[#e3e3e3] bg-[#fafafa]"><Icon className="size-3.5 text-[#666]" strokeWidth={1.6} /></span><div><h2 className="text-[11px] font-semibold">{title}</h2><p className="text-[8.5px] text-[#999]">{description}</p></div></header><div className="p-4">{children}</div></section>;
}

import Link from "next/link";
import { KeyRound, LogOut, ShieldCheck, UserRound } from "lucide-react";
import type { CurrentUser } from "@/lib/current-user";
import { signOut } from "@/app/actions/auth";
import { ProfileAppearance } from "./ProfileAppearance";

const roleLabel = { admin: "Administrador", manager: "Gestão", member: "Colaborador", client: "Cliente" } as const;

export function AccountSettings({ user, standalone = false }: { user: CurrentUser; standalone?: boolean }) {
  return <main className={`${standalone ? "min-h-dvh" : "min-h-0 flex-1"} overflow-y-auto bg-[#f7f7f7]`}>
    <header className="border-b border-[#e5e5e5] bg-white px-6 py-7 lg:px-10"><div className="mx-auto max-w-[860px]">{standalone && <Link href="/portal" className="mb-5 inline-flex text-[10px] text-[#777] hover:text-[#111]">← Voltar ao quadro</Link>}<p className="text-[9px] font-medium uppercase tracking-[.14em] text-[#999]">Sua conta</p><h1 className="mt-2 text-[25px] font-semibold tracking-[-.04em]">Configurações</h1><p className="mt-1 text-[11px] text-[#888]">Seu perfil, aparência do sistema e acesso à conta.</p></div></header>
    <div className="mx-auto grid max-w-[860px] gap-4 p-5 lg:grid-cols-[1.18fr_.82fr] lg:p-8"><section className="overflow-hidden rounded-xl border border-[#e2e2e2] bg-white"><header className="flex items-center gap-3 border-b border-[#e9e9e9] px-4 py-3.5"><span className="grid size-7 place-items-center rounded-md border border-[#e3e3e3] bg-[#fafafa]"><ShieldCheck className="size-3.5 text-[#666]" strokeWidth={1.6} /></span><div><h2 className="text-[11px] font-semibold">Credenciais</h2><p className="text-[8.5px] text-[#999]">Informações de acesso administradas pelo workspace.</p></div></header><div className="grid gap-3 p-4"><ReadOnlyField label="Email" value={user.email} /><ReadOnlyField label="Senha" value="••••••••••••" icon={KeyRound} /><div className="rounded-lg border border-[#e6e6e6] bg-[#fafafa] p-3"><p className="text-[9.5px] leading-4 text-[#888]">Por segurança, senhas nunca são exibidas em texto real e não podem ser alteradas por usuários comuns. Se precisar de uma nova senha, solicite ao administrador.</p></div><div className="mt-1 flex items-center justify-between border-t border-[#ededed] pt-3"><span className="text-[9.5px] text-[#888]">Perfil: <b className="font-medium text-[#555]">{roleLabel[user.role]}</b></span><form action={signOut}><button className="flex h-8 items-center gap-1.5 rounded-md border border-[#dedede] px-2.5 text-[9.5px] font-medium text-[#555] hover:bg-[#f3f3f3] hover:text-[#222]"><LogOut className="size-3.5" />Sair</button></form></div></div></section><ProfileAppearance user={user} /></div>
  </main>;
}

function ReadOnlyField({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof UserRound }) {
  return <label className="grid gap-1"><span className="text-[9px] font-medium uppercase tracking-[.08em] text-[#888]">{label}</span><span className="flex h-9 items-center gap-2 rounded-md border border-[#e1e1e1] bg-[#fafafa] px-3 text-[10.5px] text-[#666]">{Icon && <Icon className="size-3.5 text-[#999]" />}{value}</span></label>;
}

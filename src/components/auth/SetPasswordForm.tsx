"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SetPasswordForm() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (password.length < 8) return setError("Use pelo menos 8 caracteres.");
    if (password !== confirmation) return setError("As senhas não coincidem.");
    setPending(true); setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password, data: { must_change_password: false } });
    setPending(false);
    if (updateError) return setError("O convite expirou ou não é mais válido. Solicite um novo acesso.");
    router.replace("/inicio");
    router.refresh();
  }

  return <form onSubmit={submit} className="mt-8 grid gap-4">
    <label className="grid gap-1.5 text-[11px] font-medium text-[#555]">Nova senha<input required name="password" type="password" autoComplete="new-password" minLength={8} className="h-12 rounded-lg border border-[#dedede] bg-white px-3.5 text-[13px] outline-none focus:border-[#222] focus:ring-3 focus:ring-black/10" /></label>
    <label className="grid gap-1.5 text-[11px] font-medium text-[#555]">Confirmar senha<input required name="confirmation" type="password" autoComplete="new-password" minLength={8} className="h-12 rounded-lg border border-[#dedede] bg-white px-3.5 text-[13px] outline-none focus:border-[#222] focus:ring-3 focus:ring-black/10" /></label>
    {error && <p className="rounded-md border border-[#e1caca] bg-[#fff8f8] px-3 py-2.5 text-[11px] text-[#9c3434]">{error}</p>}
    <button disabled={pending} className="mt-1 h-12 rounded-lg bg-[#111] text-[13px] font-medium text-white transition-colors hover:bg-[#2a2a2a] disabled:opacity-50">{pending ? "Salvando…" : "Criar minha senha"}</button>
  </form>;
}

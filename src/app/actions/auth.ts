"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SignInResult =
  | { ok: true }
  | { ok: false; error: string };

// Autenticação real via Supabase Auth (email + senha).
// A conta precisa existir tanto no Supabase (para credencial) quanto na tabela
// Person (para perfil/role/times/etc.) — a criação normalmente acontece pelo
// painel de Admin ou pelo seed, cruzando por email.
export async function signIn(_prev: SignInResult | null, formData: FormData): Promise<SignInResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, error: "Informe email e senha." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Mensagem genérica evita enumeração de emails cadastrados.
    return { ok: false, error: "Email ou senha inválidos." };
  }

  // Cruza com Person para decidir destino conforme o papel.
  const person = await prisma.person.findUnique({ where: { email } });
  if (!person) {
    await supabase.auth.signOut();
    return { ok: false, error: "Acesso ainda não liberado para este usuário." };
  }

  redirect(person.role === "client" ? "/portal" : "/inicio");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

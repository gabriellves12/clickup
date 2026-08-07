import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "./navigation";

const ROLE_OVERRIDE_COOKIE = "app-role";
const VALID_ROLES = new Set<UserRole>(["admin", "manager", "member", "client"]);

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: UserRole;
  clientId: string | null;
  canSwitchRole: boolean;
};

// Retorna o usuário logado (Supabase Auth + perfil na tabela Person) ou null.
// O layout autenticado usa isso para redirecionar para /login quando não há sessão.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // Sem envs configuradas ainda? Não tenta autenticar (dev inicial).
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  // Middleware já executa `supabase.auth.getUser()` a cada request e revalida
  // a sessão. Aqui usamos `getSession()` que só lê + valida o JWT do cookie
  // (sem network) — elimina ~200ms por request no layout.
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const authUser = session?.user;
  if (!authUser?.email) return null;

  const person = await prisma.person.findUnique({
    where: { email: authUser.email.toLowerCase() },
  });
  if (!person) return null;

  // Override temporário de papel (Modo Admin/Membro no rodapé da sidebar).
  // Só admins podem trocar de papel para testar visões.
  const cookieStore = await cookies();
  const overrideRole = cookieStore.get(ROLE_OVERRIDE_COOKIE)?.value as UserRole | undefined;

  const baseRole: UserRole = VALID_ROLES.has(person.role as UserRole)
    ? (person.role as UserRole)
    : "member";

  const role: UserRole =
    baseRole === "admin" && overrideRole && VALID_ROLES.has(overrideRole)
      ? overrideRole
      : baseRole;

  return {
    id: person.id,
    name: person.name,
    email: person.email,
    initials: person.initials,
    role,
    clientId: person.clientId,
    canSwitchRole: baseRole === "admin",
  };
});

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/kanban");
  return user;
}

export async function requireOperationalManager() {
  const user = await requireCurrentUser();
  if (user.role !== "admin" && user.role !== "manager") {
    throw new Error("Você não tem permissão para alterar tarefas.");
  }
  return user;
}

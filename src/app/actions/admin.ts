"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/current-user";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const roles = new Set(["admin", "manager", "member", "client"]);
const statuses = new Set(["ATIVO", "ENCERRADO"]);
const contracts = new Set(["FIXO", "FREELA"]);

type AccessInput = {
  name: string;
  email: string;
  role: string;
  clientId?: string | null;
  password: string;
};

const initialsFor = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

function cleanEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (!email.includes("@") || email.length > 160) throw new Error("Informe um email válido.");
  return email;
}

function validatePassword(password: string) {
  if (password.length < 8) throw new Error("A senha precisa ter pelo menos 8 caracteres.");
}

function ensureRole(role: string) {
  if (!roles.has(role)) throw new Error("Perfil de acesso inválido.");
  return role;
}

async function validateClientAssignment(role: string, clientId?: string | null) {
  if (role !== "client") return null;
  if (!clientId) throw new Error("Selecione o cliente que receberá este acesso.");
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true, portalUserLimit: true, _count: { select: { users: { where: { role: "client", accessEnabled: true } } } } } });
  if (!client) throw new Error("Cliente não encontrado.");
  return client;
}

async function authUserForEmail(email: string) {
  const auth = createSupabaseAdminClient();
  const { data, error } = await auth.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`Não foi possível acessar as credenciais: ${error.message}`);
  return { auth, user: data.users.find((user) => user.email?.toLowerCase() === email) };
}

function refreshAdmin() {
  revalidatePath("/admin");
  revalidatePath("/area-cliente");
  revalidatePath("/", "layout");
}

export async function createAdminUser(input: AccessInput) {
  await requireAdmin();
  const name = input.name.trim();
  if (name.length < 2 || name.length > 100) throw new Error("Informe o nome completo da pessoa.");
  const email = cleanEmail(input.email);
  const role = ensureRole(input.role);
  validatePassword(input.password);
  const client = await validateClientAssignment(role, input.clientId);
  if (client && client._count.users >= client.portalUserLimit) throw new Error("O limite de acessos deste cliente já foi atingido.");
  if (await prisma.person.findUnique({ where: { email }, select: { id: true } })) throw new Error("Já existe uma pessoa cadastrada com este email.");

  const auth = createSupabaseAdminClient();
  const { data, error } = await auth.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name, role, must_change_password: true },
  });
  if (error || !data.user) throw new Error(error?.message ?? "Não foi possível criar a credencial.");

  try {
    await prisma.person.create({ data: { name, email, initials: initialsFor(name), role, clientId: client?.id ?? null, accessEnabled: true } });
  } catch (error) {
    await auth.auth.admin.deleteUser(data.user.id);
    throw error;
  }
  refreshAdmin();
}

export async function updateAdminUser(input: Omit<AccessInput, "password"> & { id: string; accessEnabled: boolean }) {
  const current = await requireAdmin();
  const person = await prisma.person.findUnique({ where: { id: input.id } });
  if (!person) throw new Error("Pessoa não encontrada.");
  const name = input.name.trim();
  if (name.length < 2 || name.length > 100) throw new Error("Informe o nome completo da pessoa.");
  const email = cleanEmail(input.email);
  const role = ensureRole(input.role);
  if (person.id === current.id && (role !== "admin" || !input.accessEnabled)) throw new Error("Você não pode remover ou bloquear seu próprio acesso de administrador.");
  const client = await validateClientAssignment(role, input.clientId);
  if (client && person.clientId !== client.id && client._count.users >= client.portalUserLimit) throw new Error("O limite de acessos deste cliente já foi atingido.");
  if (email !== person.email && await prisma.person.findUnique({ where: { email }, select: { id: true } })) throw new Error("Já existe uma pessoa cadastrada com este email.");

  const { auth, user } = await authUserForEmail(person.email);
  if (!user) throw new Error("A credencial desta pessoa não foi encontrada. Crie o acesso novamente.");
  const { error } = await auth.auth.admin.updateUserById(user.id, {
    email,
    email_confirm: true,
    ban_duration: input.accessEnabled ? "none" : "876000h",
    user_metadata: { name, role, must_change_password: Boolean(user.user_metadata?.must_change_password) },
  });
  if (error) throw new Error(error.message);
  await prisma.person.update({ where: { id: person.id }, data: { name, email, initials: initialsFor(name), role, clientId: client?.id ?? null, accessEnabled: input.accessEnabled } });
  refreshAdmin();
}

export async function resetAdminUserPassword(input: { id: string; password: string }) {
  await requireAdmin();
  validatePassword(input.password);
  const person = await prisma.person.findUnique({ where: { id: input.id }, select: { email: true } });
  if (!person) throw new Error("Pessoa não encontrada.");
  const { auth, user } = await authUserForEmail(person.email);
  if (!user) throw new Error("A credencial desta pessoa não foi encontrada.");
  const { error } = await auth.auth.admin.updateUserById(user.id, { password: input.password, user_metadata: { ...user.user_metadata, must_change_password: true } });
  if (error) throw new Error(error.message);
  refreshAdmin();
}

type ClientInput = {
  name: string;
  tipoContrato: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  contractUrl?: string | null;
  whatsappUrl?: string | null;
  portalUserLimit: number;
};

function clientData(input: ClientInput) {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 100) throw new Error("Informe o nome da empresa.");
  if (!contracts.has(input.tipoContrato)) throw new Error("Tipo de contrato inválido.");
  if (!statuses.has(input.status)) throw new Error("Status de cliente inválido.");
  const parseDate = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.valueOf())) throw new Error("Data inválida.");
    return date;
  };
  return {
    name,
    initials: initialsFor(name),
    tipoContrato: input.tipoContrato,
    status: input.status,
    startDate: parseDate(input.startDate),
    endDate: parseDate(input.endDate),
    contractUrl: input.contractUrl?.trim() || null,
    whatsappUrl: input.whatsappUrl?.trim() || null,
    portalUserLimit: Math.max(1, Math.min(20, Number(input.portalUserLimit) || 1)),
  };
}

export async function createManagedClient(input: ClientInput) {
  await requireAdmin();
  const data = clientData(input);
  await prisma.client.create({ data: { ...data, linkTree: { create: {} } } });
  refreshAdmin();
}

export async function updateManagedClient(input: ClientInput & { id: string }) {
  await requireAdmin();
  const data = clientData(input);
  await prisma.client.update({ where: { id: input.id }, data });
  refreshAdmin();
}

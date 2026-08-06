"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/current-user";

export async function updatePortalUserLimit(formData: FormData) {
  await requireAdmin();
  const clientId = String(formData.get("clientId") ?? "");
  const limit = Math.max(1, Math.min(20, Number(formData.get("limit") ?? 1)));
  await prisma.client.update({ where: { id: clientId }, data: { portalUserLimit: limit } });
  revalidatePath("/area-cliente");
}

export async function createPortalUser(formData: FormData) {
  await requireAdmin();
  const clientId = String(formData.get("clientId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (name.length < 2 || !email.includes("@")) throw new Error("Nome ou email inválido.");
  const client = await prisma.client.findUnique({ where: { id: clientId }, include: { users: { where: { role: "client" } } } });
  if (!client) throw new Error("Cliente não encontrado.");
  if (client.users.length >= client.portalUserLimit) throw new Error("Limite de usuários deste cliente atingido.");
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  await prisma.person.create({ data: { name, email, initials, role: "client", clientId } });
  revalidatePath("/area-cliente");
}

"use server";

import { cookies } from "next/headers";
import type { UserRole } from "@/lib/navigation";
import { prisma } from "@/lib/prisma";

export async function setTemporaryRole(role: UserRole) {
  if (!["admin", "manager", "member"].includes(role)) throw new Error("Papel inválido");
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;
  const person = sessionId ? await prisma.person.findUnique({ where: { id: sessionId }, select: { role: true } }) : null;
  if (person?.role !== "admin") throw new Error("Apenas o administrador pode simular papéis.");
  cookieStore.set("app-role", role, { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 24 * 30 });
}

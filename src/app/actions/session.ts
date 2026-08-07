"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/lib/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function setTemporaryRole(role: UserRole) {
  if (!["admin", "manager", "member"].includes(role)) throw new Error("Papel inválido");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const person = user?.email
    ? await prisma.person.findUnique({
        where: { email: user.email.toLowerCase() },
        select: { role: true },
      })
    : null;
  if (person?.role !== "admin") throw new Error("Apenas o administrador pode simular papéis.");

  const cookieStore = await cookies();
  cookieStore.set("app-role", role, { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 24 * 30 });
}

export async function updateMyProfilePhoto(avatarUrl: string | null) {
  const { requireCurrentUser } = await import("@/lib/current-user");
  const user = await requireCurrentUser();
  if (avatarUrl && (!/^data:image\/(png|jpeg|webp);base64,/.test(avatarUrl) || avatarUrl.length > 700_000)) {
    throw new Error("Use uma imagem de até 500 KB em JPG, PNG ou WebP.");
  }
  await prisma.person.update({ where: { id: user.id }, data: { avatarUrl } });
  revalidatePath("/", "layout");
  revalidatePath("/configuracoes");
  revalidatePath("/portal/configuracoes");
}

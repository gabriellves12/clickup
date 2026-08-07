// Provisiona/atualiza usuários no Supabase Auth a partir das Person do banco.
//
// Roda depois de `npm run db:seed`. Requer:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   ADMIN_INITIAL_PASSWORD
//   MEMBER_INITIAL_PASSWORD (usada para Gestão e Colaborador)
//   CLIENT_INITIAL_PASSWORD
//
// Estratégia: todos são criados com email_confirm=true + senha por perfil.
// Não envia email — evita rate limit do Supabase Free
// e permite testar em ambiente dev com emails que ainda não são reais.
// Depois de logar, cada um deve trocar a senha em Configurações.

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const prisma = new PrismaClient();
  const people = await prisma.person.findMany({ orderBy: { name: "asc" } });

  if (process.argv.includes("--dry-run")) {
    const byRole = people.reduce<Record<string, number>>((counts, person) => {
      counts[person.role] = (counts[person.role] ?? 0) + 1;
      return counts;
    }, {});
    console.log(`\nPrévia: ${people.length} usuário(s) — ${Object.entries(byRole).map(([role, count]) => `${role}: ${count}`).join(", ")}.\n`);
    await prisma.$disconnect();
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("✗ Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local antes de rodar.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const passwords = {
    admin: process.env.ADMIN_INITIAL_PASSWORD,
    manager: process.env.MEMBER_INITIAL_PASSWORD,
    member: process.env.MEMBER_INITIAL_PASSWORD,
    client: process.env.CLIENT_INITIAL_PASSWORD,
  } as const;
  if (Object.values(passwords).some((password) => !password)) {
    console.error("✗ Configure ADMIN_INITIAL_PASSWORD, MEMBER_INITIAL_PASSWORD e CLIENT_INITIAL_PASSWORD em .env.local.");
    process.exit(1);
  }
  console.log(`\nProvisionando ${people.length} usuário(s):\n`);

  let created = 0;
  let updated = 0;
  let failed = 0;

  // Lista todos os usuários de uma vez para saber se já existem
  const { data: existing } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const byEmail = new Map(existing?.users?.map((u) => [u.email?.toLowerCase(), u]) ?? []);

  for (const person of people) {
    const email = person.email.toLowerCase();
    const found = byEmail.get(email);
    const password = passwords[person.role as keyof typeof passwords] ?? passwords.member;

    const mustChange = person.role !== "admin";
    if (found) {
      const { error } = await supabase.auth.admin.updateUserById(found.id, {
        password,
        email_confirm: true,
        user_metadata: { name: person.name, role: person.role, must_change_password: mustChange },
      });
      if (error) { console.error(`✗ ${email}: ${error.message}`); failed++; }
      else { console.log(`↻ ${email} (${person.role})`); updated++; }
    } else {
      const { error } = await supabase.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { name: person.name, role: person.role, must_change_password: mustChange },
      });
      if (error) { console.error(`✗ ${email}: ${error.message}`); failed++; }
      else { console.log(`+ ${email} (${person.role})`); created++; }
    }
  }

  console.log(`\n✓ ${created} criado(s), ${updated} atualizado(s), ${failed} falhou(aram).\n`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });

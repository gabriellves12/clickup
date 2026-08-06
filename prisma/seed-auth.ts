// Provisiona/atualiza usuários no Supabase Auth a partir das Person do banco.
//
// Roda depois de `npm run db:seed`. Requer:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   ADMIN_INITIAL_PASSWORD
//
// Estratégia: todos são criados com email_confirm=true + senha inicial
// (mesma senha para todos). Não envia email — evita rate limit do Supabase Free
// e permite testar em ambiente dev com emails que ainda não são reais.
// Depois de logar, cada um deve trocar a senha em Configurações.

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("✗ Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local antes de rodar.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (!initialPassword) {
    console.error("✗ Configure ADMIN_INITIAL_PASSWORD em .env.local.");
    process.exit(1);
  }

  const people = await prisma.person.findMany({ orderBy: { name: "asc" } });
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

    const mustChange = person.role !== "admin";
    if (found) {
      const { error } = await supabase.auth.admin.updateUserById(found.id, {
        password: initialPassword,
        email_confirm: true,
        user_metadata: { name: person.name, role: person.role, must_change_password: mustChange },
      });
      if (error) { console.error(`✗ ${email}: ${error.message}`); failed++; }
      else { console.log(`↻ ${email} (${person.role})`); updated++; }
    } else {
      const { error } = await supabase.auth.admin.createUser({
        email, password: initialPassword, email_confirm: true,
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

// Provisiona/atualiza usuários no Supabase Auth a partir das Person do banco.
//
// Roda depois de `npm run db:seed`. Requer:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Uso:
//   npm run auth:seed                     # senha padrão para todos
//   npm run auth:seed -- --password=abc   # define senha custom
//
// A senha padrão é `Thinkcontrol@2026` — troque em produção e peça reset.

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? "Thinkcontrol@2026";

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

  // Sobrescreve senha padrão via --password=xxx
  const cliPassword = process.argv.find((arg) => arg.startsWith("--password="))?.split("=")[1];
  const password = cliPassword ?? DEFAULT_PASSWORD;

  const people = await prisma.person.findMany({ orderBy: { name: "asc" } });
  console.log(`\nProvisionando ${people.length} usuário(s) com senha "${password}":\n`);

  let created = 0;
  let updated = 0;
  let failed = 0;

  // Lista todos os usuários de uma vez para saber se já existem
  const { data: existing } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const byEmail = new Map(existing?.users?.map((u) => [u.email?.toLowerCase(), u]) ?? []);

  for (const person of people) {
    const email = person.email.toLowerCase();
    const found = byEmail.get(email);

    if (found) {
      const { error } = await supabase.auth.admin.updateUserById(found.id, {
        password,
        user_metadata: { name: person.name, role: person.role },
      });
      if (error) { console.error(`✗ ${email}: ${error.message}`); failed++; }
      else { console.log(`↻ ${email} (${person.role})`); updated++; }
    } else {
      const { error } = await supabase.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { name: person.name, role: person.role },
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

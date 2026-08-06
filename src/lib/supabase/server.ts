import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Cliente Supabase para uso em Server Components, Route Handlers e Server Actions.
// Cookie storage é ligado ao request atual — Supabase renova sessão via cookies
// automaticamente quando necessário.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll pode falhar dentro de Server Component puro (sem middleware).
            // Middleware.ts abaixo é o único lugar que precisa persistir cookies;
            // aqui ignoramos com segurança.
          }
        },
      },
    },
  );
}

// Cliente admin — usa service role, bypass RLS. NUNCA importar de client component.
export function createSupabaseAdminClient() {
  // Import dinâmico do createClient normal (não SSR) para não puxar cookie storage.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

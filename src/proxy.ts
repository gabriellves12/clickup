import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Proxy — só faz refresh de sessão Supabase quando há cookie de sessão presente
// e a rota está dentro do app autenticado. Rotas públicas (login, definir senha,
// static) passam direto — evita hop desnecessário pro Supabase.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas — nunca precisam de refresh de sessão.
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/definir-senha") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Sem cookies do Supabase ainda? Nenhuma sessão para refrescar.
  // Cookies do Supabase seguem o padrão sb-<ref>-auth-token.
  const hasSupabaseCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  if (!hasSupabaseCookie) {
    return NextResponse.next();
  }

  // Se envs não estão configuradas (dev inicial), passa direto.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Refresh do token acontece automaticamente aqui — só quando há sessão.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff2?)$).*)",
  ],
};

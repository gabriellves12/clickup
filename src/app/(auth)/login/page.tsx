import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ImageIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Entrar · Thinkcontrol" };

const bannerPath = "/login-banner-v2.webp";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "client" ? "/portal" : "/inicio");

  const hasBanner = existsSync(path.join(process.cwd(), "public", bannerPath));

  return (
    <main className="min-h-dvh bg-white p-2.5 sm:p-4">
      <div className="mx-auto grid min-h-[calc(100dvh-20px)] overflow-hidden rounded-[18px] border border-[#e7e7e7] bg-white sm:min-h-[calc(100dvh-32px)] lg:grid-cols-[minmax(440px,0.7fr)_minmax(560px,1.3fr)]">
        <section className="flex min-h-[620px] flex-col px-6 py-7 sm:px-10 sm:py-9 lg:px-[clamp(48px,6vw,92px)] lg:py-12">
          <header>
            <Image
              src="/control-wordmark.svg"
              alt="Thinkcontrol"
              width={176}
              height={40}
              className="h-9 w-auto"
              priority
            />
          </header>

          <div className="flex flex-1 items-center py-14">
            <div className="w-full max-w-[390px]">
              <h1 className="text-[34px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#111] sm:text-[40px]">
                Bem-vindo<br />de volta.
              </h1>
              <p className="mt-4 max-w-[340px] text-[13px] leading-5 text-[#747474]">
                Entre com seu acesso para acompanhar tarefas, clientes e entregas da operação.
              </p>

              <div className="mt-9">
                <LoginForm />
              </div>
            </div>
          </div>

          <footer className="flex items-center justify-between gap-4 border-t border-[#ededed] pt-5 text-[10px] text-[#999]">
            <span>© {new Date().getFullYear()} Thinkcontrol</span>
            <span>Acesso restrito à equipe</span>
          </footer>
        </section>

        <aside className="relative order-first aspect-[2097/1800] min-h-[260px] overflow-hidden border-b border-[#e7e7e7] bg-black lg:order-none lg:aspect-auto lg:min-h-0 lg:border-b-0 lg:border-l">
          {hasBanner ? (
            <Image
              src={bannerPath}
              alt="Banner Thinkcontrol"
              fill
              priority
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center p-8">
              <div className="text-center text-[#aaa]">
                <span className="mx-auto grid size-10 place-items-center rounded-full border border-[#d9d9d9] bg-white">
                  <ImageIcon className="size-4" strokeWidth={1.5} />
                </span>
                <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.15em] text-[#888]">
                  Espaço reservado para o banner
                </p>
                <p className="mt-1.5 text-[10px] text-[#aaa]">
                  login-banner.webp · recomendado 1600 × 1800 px
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

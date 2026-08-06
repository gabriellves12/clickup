import Image from "next/image";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";

export const metadata = { title: "Definir senha · Thinkcontrol" };

export default function SetPasswordPage() {
  return <main className="grid min-h-dvh place-items-center bg-[#f5f5f5] p-5">
    <section className="w-full max-w-[430px] rounded-2xl border border-[#e3e3e3] bg-white p-7 shadow-[0_12px_40px_rgba(0,0,0,.06)] sm:p-10">
      <Image src="/control-wordmark.svg" alt="Thinkcontrol" width={152} height={35} className="h-8 w-auto" priority />
      <p className="mt-10 text-[9px] font-medium uppercase tracking-[.15em] text-[#999]">Primeiro acesso</p>
      <h1 className="mt-2 text-[28px] font-semibold tracking-[-.04em]">Crie sua senha.</h1>
      <p className="mt-2 text-[12px] leading-5 text-[#777]">Essa senha será pessoal e não ficará visível para administradores ou outros usuários.</p>
      <SetPasswordForm />
    </section>
  </main>;
}

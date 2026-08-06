import type { LucideIcon } from "lucide-react";

export function PlaceholderPage({ eyebrow, title, description, icon: Icon }: { eyebrow: string; title: string; description: string; icon: LucideIcon }) {
  return (
    <main className="flex-1 min-h-0 overflow-y-auto px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-[1120px]">
        <div className="max-w-2xl">
          <span className="text-[10px] font-semibold tracking-[.18em] uppercase text-text-3">{eyebrow}</span>
          <h1 className="mt-2 text-[30px] font-semibold tracking-[-.04em] text-text">{title}</h1>
          <p className="mt-2 text-[14px] leading-6 text-text-2">{description}</p>
        </div>
        <section className="mt-10 min-h-[360px] rounded-[24px] border border-dashed border-border-strong bg-surface-2/55 grid place-items-center p-8 text-center">
          <div className="max-w-sm">
            <span className="mx-auto size-14 rounded-2xl border border-border bg-surface shadow-e2 grid place-items-center text-text-2"><Icon className="size-5" strokeWidth={1.7} /></span>
            <h2 className="mt-5 text-[15px] font-semibold tracking-tight">Em construção — em breve</h2>
            <p className="mt-2 text-[12px] leading-5 text-text-3">A navegação já está pronta. O conteúdo desta área será desenvolvido na próxima etapa.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

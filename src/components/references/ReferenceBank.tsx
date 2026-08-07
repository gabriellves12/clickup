import { ArrowUpRight, FolderKanban, LayoutPanelTop, Megaphone, Sparkles } from "lucide-react";
import { IcFigma } from "@/components/icons";

const boards = [
  { title: "Lançamentos", description: "Campanhas, aquecimentos e páginas de conversão.", icon: Megaphone, index: "01" },
  { title: "Institucional", description: "Posicionamento, presença de marca e comunicação.", icon: FolderKanban, index: "02" },
  { title: "Sites & Landing Pages", description: "Arquitetura, UX e direções para páginas web.", icon: LayoutPanelTop, index: "03" },
  { title: "Criativos", description: "Anúncios, social media, thumbnails e peças de impacto.", icon: Sparkles, index: "04" },
];

// Ícone monocromático do Pinterest (fill = currentColor).
function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.09 2.46 7.61 5.98 9.15-.08-.78-.15-1.97.03-2.82.17-.77 1.09-4.9 1.09-4.9s-.28-.56-.28-1.38c0-1.29.75-2.26 1.68-2.26.79 0 1.18.6 1.18 1.31 0 .8-.51 1.99-.77 3.09-.22.93.47 1.69 1.39 1.69 1.66 0 2.94-1.76 2.94-4.29 0-2.24-1.61-3.81-3.92-3.81-2.67 0-4.24 2-4.24 4.07 0 .81.31 1.68.7 2.15.08.09.09.17.07.27-.07.29-.24.93-.27 1.06-.04.17-.14.21-.32.13-1.2-.56-1.95-2.31-1.95-3.72 0-3.03 2.2-5.81 6.34-5.81 3.33 0 5.91 2.37 5.91 5.54 0 3.3-2.08 5.96-4.98 5.96-.97 0-1.89-.51-2.2-1.11 0 0-.48 1.83-.6 2.28-.22.83-.81 1.87-1.2 2.5.9.28 1.86.43 2.85.43 5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
    </svg>
  );
}

export function ReferenceBank({ figmaUrl, pinterestUrl }: { figmaUrl: string; pinterestUrl: string }) {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#fafafa] text-[#1a1a1a] scrollbar-clean">
      <header className="border-b border-[#ebebeb] bg-white px-6 py-5 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-[9px] font-semibold uppercase tracking-[.17em] text-[#888]">Operação · Repertório criativo</p>
          <h1 className="mt-2 text-[25px] font-semibold tracking-[-.045em]">Banco de referências</h1>
          <p className="mt-1 text-[11.5px] text-[#777]">Cada quadro pode ser aberto no Pinterest (curadoria visual) ou no Figma (arquivo de trabalho).</p>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] p-5 lg:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          {boards.map(({ title, description, icon: Icon, index }) => (
            <article
              key={title}
              className="group relative overflow-hidden rounded-xl border border-[#e6e6e6] bg-white transition-all hover:-translate-y-0.5 hover:border-[#c8c8c8] hover:shadow-[0_12px_28px_rgba(0,0,0,.08)]"
            >
              {/* Preview do Pinterest (thumbnail via link) */}
              <a
                href={pinterestUrl}
                target="_blank"
                rel="noreferrer"
                className="relative block h-[180px] overflow-hidden bg-[#f5f5f5] no-underline hover:no-underline"
                aria-label={`Ver ${title} no Pinterest`}
              >
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-90 transition-opacity group-hover:opacity-100"
                  style={{
                    background: `
                      radial-gradient(at 20% 20%, rgba(230,30,55,.10), transparent 55%),
                      radial-gradient(at 80% 40%, rgba(230,30,55,.08), transparent 55%),
                      radial-gradient(at 40% 80%, rgba(0,0,0,.06), transparent 55%),
                      linear-gradient(135deg, #fafafa 0%, #efefef 100%)
                    `,
                  }}
                />
                <div className="relative flex h-full items-center justify-between px-6">
                  <div className="grid gap-1">
                    <span className="text-[8.5px] font-semibold uppercase tracking-[.14em] text-[#e60023]/85">Pré-visualização</span>
                    <span className="text-[11px] font-medium text-[#333]">Curadoria no Pinterest</span>
                  </div>
                  <span className="grid size-12 place-items-center rounded-full bg-[#e60023] text-white shadow-[0_6px_16px_rgba(230,0,35,.35)]">
                    <PinterestIcon className="size-6" />
                  </span>
                </div>
                <span className="absolute right-4 top-4 grid size-7 place-items-center rounded-full bg-white/85 text-[#333] opacity-0 transition-opacity group-hover:opacity-100">
                  <ArrowUpRight className="size-3.5" />
                </span>
              </a>

              {/* Conteúdo */}
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#e6e6e6] bg-[#fafafa] text-[#444]">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <h2 className="truncate text-[15px] font-semibold tracking-[-.035em]">{title}</h2>
                      <span className="text-[10px] font-medium tabular text-[#bbb]">{index}</span>
                    </div>
                    <p className="mt-1 text-[10.5px] leading-4 text-[#777]">{description}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <a
                    href={pinterestUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-[#e60023] px-3 text-[10.5px] font-medium !text-white no-underline hover:no-underline hover:!text-white hover:bg-[#c50019] transition-colors"
                  >
                    <PinterestIcon className="size-3.5" />
                    Pinterest
                  </a>
                  <a
                    href={figmaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-[#e0e0e0] bg-white px-3 text-[10.5px] font-medium text-[#333] no-underline hover:no-underline hover:border-[#c0c0c0] hover:bg-[#fafafa] transition-colors"
                  >
                    <IcFigma className="size-3.5" />
                    Figma
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="mt-5 flex items-start gap-3 rounded-lg border border-[#e6e6e6] bg-white p-4">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#f5f5f5] text-[#555]">
            <PinterestIcon className="size-3.5" />
          </span>
          <div>
            <h3 className="text-[10.5px] font-semibold">Curadoria + arquivo de trabalho</h3>
            <p className="mt-1 text-[10px] leading-4 text-[#777]">
              O botão vermelho abre o Pinterest com as referências salvas. O botão branco leva ao Figma correspondente para o time trabalhar.
              Enquanto cada quadro não tem sua própria board no Pinterest/Figma, os quatro atalhos usam a mesma URL — basta trocar quando cada arquivo for criado.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

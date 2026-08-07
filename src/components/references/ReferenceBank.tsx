import { ArrowUpRight, FolderKanban, LayoutPanelTop, Megaphone, Sparkles } from "lucide-react";
import { IcFigma } from "@/components/icons";

const boards = [
  { title: "Lançamentos", description: "Campanhas, aquecimentos e páginas de conversão.", icon: Megaphone, index: "01" },
  { title: "Institucional", description: "Posicionamento, presença de marca e comunicação.", icon: FolderKanban, index: "02" },
  { title: "Sites & Landing Pages", description: "Arquitetura, UX e direções para páginas web.", icon: LayoutPanelTop, index: "03" },
  { title: "Criativos", description: "Anúncios, social media, thumbnails e peças de impacto.", icon: Sparkles, index: "04" },
];

export function ReferenceBank({ figmaUrl }: { figmaUrl: string }) {
  return <main className="min-h-0 flex-1 overflow-y-auto bg-[#f7f7f6] text-[#1e1e1c] scrollbar-clean">
    <header className="border-b border-[#e1e1de] bg-white px-6 py-5 lg:px-8"><div className="mx-auto max-w-[1200px]"><p className="text-[9px] font-semibold uppercase tracking-[.17em] text-[#85857f]">Operação · Repertório criativo</p><h1 className="mt-2 text-[25px] font-semibold tracking-[-.045em]">Banco de referências</h1><p className="mt-1 text-[11.5px] text-[#777772]">Escolha o quadro certo e acesse as referências pelo Figma.</p></div></header>
    <div className="mx-auto max-w-[1200px] p-5 lg:p-7"><div className="grid gap-4 sm:grid-cols-2">{boards.map(({ title, description, icon: Icon, index }) => <a key={title} href={figmaUrl} target="_blank" rel="noreferrer" className="group relative min-h-[220px] overflow-hidden rounded-xl border border-[#dededb] bg-white p-6 transition-all hover:-translate-y-1 hover:border-[#b5b5af] hover:shadow-[0_12px_28px_rgba(0,0,0,.08)]"><span className="absolute right-5 top-4 text-[38px] font-semibold tracking-[-.08em] text-[#f0f0ed]">{index}</span><span className="grid size-9 place-items-center rounded-lg border border-[#e2e2de] bg-[#f6f6f4] text-[#353532]"><Icon className="size-4" /></span><div className="relative mt-12"><h2 className="text-[20px] font-semibold tracking-[-.04em]">{title}</h2><p className="mt-2 max-w-[265px] text-[10.5px] leading-4 text-[#7c7c76]">{description}</p></div><span className="absolute bottom-5 left-6 inline-flex items-center gap-1.5 text-[10px] font-medium text-[#4c4c47]">Abrir no Figma <IcFigma className="size-3.5" /><ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" /></span></a>)}</div><aside className="mt-5 flex gap-3 rounded-lg border border-[#dededb] bg-white p-4"><span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#eeeeeb] text-[#555]"><IcFigma className="size-3.5" /></span><div><h2 className="text-[10.5px] font-semibold">Organização por quadro</h2><p className="mt-1 text-[10px] leading-4 text-[#777772]">Os quatro atalhos usam o mesmo Figma temporariamente. Quando cada quadro tiver seu arquivo próprio, basta trocar o link correspondente.</p></div></aside></div>
  </main>;
}

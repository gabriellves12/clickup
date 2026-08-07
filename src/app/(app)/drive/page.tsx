import { ArrowUpRight, FolderUp, Info } from "lucide-react";

// Preview publico do folder do Drive. Nao integra com Google API — apenas
// mostra o conteudo em iframe e permite abrir no Drive real em nova aba.
const DRIVE_FOLDER_ID = "10X4Wp_hPFnG57F5EhH8hEETBEVGHRN26";
const DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${DRIVE_FOLDER_ID}`;
const DRIVE_EMBED_URL = `https://drive.google.com/embeddedfolderview?id=${DRIVE_FOLDER_ID}#grid`;

export default function DrivePage() {
  return (
    <main className="min-h-full bg-white flex flex-col">
      <header className="border-b border-[#e8e8e8] px-6 py-6 lg:px-10">
        <div className="mx-auto max-w-[1320px] flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-[#181818] text-white">
              <FolderUp className="size-[17px]" strokeWidth={1.7} />
            </span>
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[.14em] text-[#8a8a8a]">Arquivos</p>
              <h1 className="mt-1 text-[26px] font-semibold tracking-[-.045em] text-[#181818]">Drive</h1>
              <p className="mt-1 text-[11.5px] text-[#777]">Pré-visualização do drive interno. Uploads e edições acontecem no Google Drive.</p>
            </div>
          </div>
          <a
            href={DRIVE_FOLDER_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#181818] px-3.5 text-[11px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,.14)] transition-colors hover:bg-[#333] no-underline hover:no-underline"
          >
            Abrir no Drive <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1320px] flex-1 px-6 pb-8 pt-5 lg:px-10 lg:pb-10">
        <div className="mb-4 flex items-start gap-2 rounded-md border border-[#e4e4e4] bg-[#fafafa] px-3 py-2.5">
          <Info className="mt-0.5 size-3.5 shrink-0 text-[#666]" />
          <p className="text-[10.5px] leading-4 text-[#666]">
            Esta é uma visualização somente-leitura do folder compartilhado. Para adicionar, mover ou renomear arquivos, use o botão <b>Abrir no Drive</b> acima.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e4e4e4] bg-white">
          <iframe
            src={DRIVE_EMBED_URL}
            title="Drive interno — pré-visualização"
            className="block w-full"
            style={{ height: "calc(100vh - 260px)", minHeight: "480px" }}
            loading="lazy"
          />
        </div>
      </div>
    </main>
  );
}

import Image from "next/image";

// Fallback global das rotas autenticadas. Aparece imediatamente ao clicar num
// link, antes do RSC/dados chegarem — dá feedback visual instantâneo mesmo
// quando o layout está aquecendo o pool.
export default function AppLoading() {
  return (
    <div className="flex-1 min-h-0 grid place-items-center">
      <div
        className="grid place-items-center opacity-70"
        style={{ animation: "brandBreathe 1.6s ease-in-out infinite" }}
        aria-live="polite"
        role="status"
      >
        <Image src="/control-wordmark.svg" alt="" width={140} height={32} className="h-8 w-auto" priority />
        <span className="sr-only">Carregando…</span>
      </div>
    </div>
  );
}

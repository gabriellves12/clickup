import { BrandLoader } from "./BrandLoader";

// Splash renderizado no root layout. Aparece em todo carregamento inicial (F5),
// não em navegações client-side. Se auto-esconde por CSS após ~900ms sem depender
// de JS — evita flash e não conflita com hidratação.
export function GlobalSplash() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] bg-bg grid place-items-center pointer-events-none"
      style={{
        animation: "splashOut 1000ms cubic-bezier(.4,0,.2,1) 350ms forwards",
      }}
    >
      <BrandLoader />
    </div>
  );
}

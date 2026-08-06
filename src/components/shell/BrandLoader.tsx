import Image from "next/image";

// Marca respirando. Usado em dois lugares:
// 1) GlobalSplash (F5 em qualquer rota)
// 2) LoginForm quando o submit está pending
export function BrandLoader() {
  return (
    <div className="grid place-items-center" role="status" aria-live="polite">
      <div
        className="grid place-items-center"
        style={{ animation: "brandBreathe 1.6s ease-in-out infinite" }}
      >
        <Image
          src="/control-wordmark.svg"
          alt="Thinkcontrol"
          width={168}
          height={38}
          className="h-9 w-auto"
          priority
        />
      </div>
    </div>
  );
}

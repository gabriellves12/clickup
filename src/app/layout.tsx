import type { Metadata } from "next";
import { GlobalSplash } from "@/components/shell/GlobalSplash";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thinkcontrol",
  description: "Workspace interno de operação e gestão.",
  icons: { icon: "/control-icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try { document.documentElement.dataset.theme = localStorage.getItem('control-theme') === 'dark' ? 'dark' : 'light'; } catch {}" }} />
        <link
          rel="preload"
          href="/fonts/GoogleSansFlex-Regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/GoogleSansFlex-Medium.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-dvh bg-bg text-text">
        <GlobalSplash />
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { GlobalSplash } from "@/components/shell/GlobalSplash";
import "./globals.css";

export const metadata: Metadata = {
  title: "Control — Operation OS",
  description: "Workspace interno de operação e gestão.",
  icons: { icon: "/control-icon.svg" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get("theme")?.value;
  const dataTheme = cookieTheme === "dark" || cookieTheme === "light" ? cookieTheme : undefined;

  return (
    <html lang="pt-BR" data-theme={dataTheme} suppressHydrationWarning>
      <head>
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

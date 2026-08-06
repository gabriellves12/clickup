"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/primitives";
import { IcMoon, IcSun } from "@/components/icons";

function readInitial(): "dark" | "light" | undefined {
  if (typeof document === "undefined") return undefined;
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  return undefined;
}

export function ThemeToggle() {
  const router = useRouter();
  const [theme, setTheme] = React.useState<"dark" | "light" | undefined>(readInitial);

  React.useEffect(() => {
    if (theme) return;
    // Sincroniza com a preferência do SO se ainda não escolhemos manualmente
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    setTheme(mql.matches ? "dark" : "light");
  }, [theme]);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    // Persiste 1 ano — cookie autoritativo lido no root layout
    document.cookie = `theme=${next}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    try { localStorage.setItem("theme", next); } catch {}
    // Não precisa router.refresh(): a mudança visual é imediata via data-theme
  }

  return (
    <IconButton onClick={toggle} aria-label="Alternar tema">
      {theme === "dark" ? <IcSun /> : <IcMoon />}
    </IconButton>
  );
}

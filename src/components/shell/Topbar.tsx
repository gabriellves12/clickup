"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { TEAMS } from "@/lib/board-config";
import { ThemeToggle } from "./ThemeToggle";
import { Badge } from "@/components/ui/primitives";

export function Topbar() {
  const path = usePathname();
  const activeSlug = path?.startsWith("/board/") ? path.split("/")[2] : undefined;

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-bg/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-6 px-6">
        <Link href="/" className="flex items-center gap-2.5 text-text no-underline hover:no-underline">
          <span
            aria-hidden
            className="grid size-[22px] place-items-center rounded-md text-[11px] font-semibold text-bg"
            style={{ background: "linear-gradient(135deg, var(--text), var(--text-2))" }}
          >
            H
          </span>
          <span className="text-[14px] font-semibold tracking-tight">Control</span>
          <Badge tone="neutral" className="ml-1">interno · v0.1</Badge>
        </Link>

        <nav className="ml-6 flex items-center gap-1">
          {TEAMS.map((t) => (
            <Link
              key={t.slug}
              href={`/board/${t.slug}`}
              className={cn(
                "px-2.5 h-8 inline-flex items-center rounded-md text-[13px] font-medium tracking-tight",
                "transition-colors duration-100",
                activeSlug === t.slug
                  ? "bg-surface-2 text-text no-underline hover:no-underline"
                  : "text-text-2 hover:bg-surface-2 hover:text-text no-underline hover:no-underline"
              )}
            >
              {t.name}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

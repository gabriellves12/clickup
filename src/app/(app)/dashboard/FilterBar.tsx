"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  periodHref, shiftPeriod, toIsoDate, buildRange,
  type PeriodKind, type PeriodRange,
} from "./period";

const OPTIONS: { kind: PeriodKind; label: string }[] = [
  { kind: "day",   label: "Dia"    },
  { kind: "week",  label: "Semana" },
  { kind: "month", label: "Mês"    },
  { kind: "year",  label: "Ano"    },
];

export function FilterBar({ range }: { range: PeriodRange }) {
  const prev = shiftPeriod(range, -1);
  const next = shiftPeriod(range, 1);
  const now = buildRange(range.kind, new Date());
  const isCurrent = now.ref.getTime() === range.ref.getTime();

  const exportHref = `/api/dashboard/export?period=${range.kind}&ref=${toIsoDate(range.ref)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Pills de tipo de período */}
      <div className="inline-flex h-9 items-center gap-0.5 rounded-full border border-[#e4e4e4] bg-white p-0.5">
        {OPTIONS.map((opt) => {
          const active = range.kind === opt.kind;
          return (
            <Link
              key={opt.kind}
              href={periodHref(opt.kind, range.ref)}
              scroll={false}
              className={cn(
                "h-8 px-3 rounded-full text-[11.5px] font-medium tracking-tight inline-flex items-center transition-colors no-underline hover:no-underline",
                active ? "bg-[#171717] text-white shadow-sm" : "text-[#666] hover:text-[#171717]",
              )}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      {/* Navegação anterior / label / próximo */}
      <div className="inline-flex h-9 items-center rounded-md border border-[#e4e4e4] bg-white">
        <Link
          href={periodHref(prev.kind, prev.ref)}
          scroll={false}
          aria-label="Período anterior"
          className="grid size-8 place-items-center text-[#666] hover:text-[#171717]"
        >
          <ChevronLeft className="size-3.5" />
        </Link>
        <span className="px-3 text-[11.5px] font-medium text-[#222] first-letter:capitalize whitespace-nowrap">
          {range.label}
        </span>
        <Link
          href={periodHref(next.kind, next.ref)}
          scroll={false}
          aria-label="Próximo período"
          className="grid size-8 place-items-center text-[#666] hover:text-[#171717]"
        >
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      {!isCurrent && (
        <Link
          href={periodHref(range.kind, new Date())}
          scroll={false}
          className="h-9 px-3 rounded-md text-[11px] font-medium text-[#666] hover:text-[#171717] hover:bg-[#f2f2f2] no-underline hover:no-underline"
        >
          Voltar para agora
        </Link>
      )}

      <div className="ml-auto flex items-center gap-2">
        <a
          href={exportHref}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#171717] px-3 text-[11.5px] font-medium text-white no-underline hover:no-underline hover:bg-[#0c0c0c] transition-colors"
        >
          <Download className="size-3.5" strokeWidth={1.8} />
          Exportar CSV
        </a>
      </div>
    </div>
  );
}

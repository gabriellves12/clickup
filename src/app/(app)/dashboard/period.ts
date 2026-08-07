// Helpers puros para o filtro de período do dashboard.
// A URL do dashboard suporta ?period=day|week|month|year&ref=YYYY-MM-DD.

export type PeriodKind = "day" | "week" | "month" | "year";

export type PeriodRange = {
  kind: PeriodKind;
  ref: Date;           // data de referência (dentro do período)
  start: Date;         // início inclusivo
  end: Date;           // fim exclusivo
  label: string;       // "05 nov · 2026" / "Semana 12–18 nov" / "Novembro 2026" / "2026"
  compareLabel: string;// "vs 04 nov" / "vs semana anterior" / etc
};

export function parsePeriod(
  searchParams: { period?: string | string[]; ref?: string | string[] } | undefined,
): PeriodRange {
  const kind = normalizeKind(pickFirst(searchParams?.period));
  const ref = parseRef(pickFirst(searchParams?.ref));
  return buildRange(kind, ref);
}

export function buildRange(kind: PeriodKind, ref: Date): PeriodRange {
  const r = truncate(kind, ref);
  const start = r;
  const end = addPeriod(kind, r, 1);
  return {
    kind, ref: r, start, end,
    label: formatLabel(kind, r),
    compareLabel: formatCompareLabel(kind),
  };
}

export function shiftPeriod(range: PeriodRange, delta: 1 | -1): PeriodRange {
  return buildRange(range.kind, addPeriod(range.kind, range.ref, delta));
}

export function isCurrentPeriod(range: PeriodRange): boolean {
  const now = truncate(range.kind, new Date());
  return now.getTime() === range.ref.getTime();
}

export function periodHref(kind: PeriodKind, ref: Date): string {
  const iso = toIsoDate(ref);
  return `/dashboard?period=${kind}&ref=${iso}`;
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ------------------------------ interno ------------------------------ */

function pickFirst(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function normalizeKind(raw: string | undefined): PeriodKind {
  if (raw === "day" || raw === "week" || raw === "year") return raw;
  return "month";
}

function parseRef(raw: string | undefined): Date {
  if (!raw) return new Date();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return new Date();
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

function truncate(kind: PeriodKind, ref: Date): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  if (kind === "day") return d;
  if (kind === "week") {
    const dayOfWeek = d.getDay(); // 0 = domingo
    d.setDate(d.getDate() - dayOfWeek);
    return d;
  }
  if (kind === "month") return new Date(d.getFullYear(), d.getMonth(), 1);
  return new Date(d.getFullYear(), 0, 1); // year
}

function addPeriod(kind: PeriodKind, ref: Date, delta: number): Date {
  const d = new Date(ref);
  if (kind === "day") d.setDate(d.getDate() + delta);
  else if (kind === "week") d.setDate(d.getDate() + delta * 7);
  else if (kind === "month") d.setMonth(d.getMonth() + delta);
  else d.setFullYear(d.getFullYear() + delta);
  return d;
}

function formatLabel(kind: PeriodKind, ref: Date): string {
  if (kind === "day") {
    return ref.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  }
  if (kind === "week") {
    const end = new Date(ref); end.setDate(ref.getDate() + 6);
    const sameMonth = ref.getMonth() === end.getMonth();
    if (sameMonth) {
      const startDay = String(ref.getDate()).padStart(2, "0");
      const endDay = String(end.getDate()).padStart(2, "0");
      return `${startDay}–${endDay} de ${ref.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`;
    }
    const s = ref.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    const e = end.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
    return `${s} – ${e}`;
  }
  if (kind === "month") {
    return ref.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }
  return String(ref.getFullYear());
}

function formatCompareLabel(kind: PeriodKind): string {
  if (kind === "day") return "dia anterior";
  if (kind === "week") return "semana anterior";
  if (kind === "month") return "mês anterior";
  return "ano anterior";
}

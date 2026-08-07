import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/current-user";
import { parsePeriod, toIsoDate } from "@/app/(app)/dashboard/period";

// GET /api/dashboard/export?period=month&ref=YYYY-MM-DD
// Retorna CSV com as demandas do período (por createdAt) para análise externa.
export async function GET(request: Request) {
  await requireAdmin();

  const url = new URL(request.url);
  const range = parsePeriod({
    period: url.searchParams.get("period") ?? undefined,
    ref: url.searchParams.get("ref") ?? undefined,
  });

  const cards = await prisma.card.findMany({
    where: { createdAt: { gte: range.start, lt: range.end } },
    include: {
      client: { select: { name: true } },
      responsible: { select: { name: true } },
      team: { select: { name: true, slug: true } },
      demandType: { select: { prefix: true, name: true } },
      product: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const DAY = 86400000;

  const headers = [
    "id", "titulo", "cliente", "produto", "responsavel", "time", "tipo_demanda",
    "tipo_projeto", "prioridade", "status", "prazo", "criado_em", "atualizado_em",
    "atrasado", "dias_atraso", "tempo_ate_finalizacao_dias",
  ];

  const rows = cards.map((c) => {
    const isFinished = c.status === "FINALIZADO";
    const isOverdue = !isFinished && !!c.deadline && c.deadline < today;
    const daysLate = isOverdue && c.deadline
      ? Math.floor((today.getTime() - c.deadline.getTime()) / DAY)
      : 0;
    const cycleDays = isFinished
      ? Math.max(0, Math.round((c.updatedAt.getTime() - c.createdAt.getTime()) / DAY))
      : "";
    return [
      c.id,
      c.title,
      c.client.name,
      c.product?.name ?? "",
      c.responsible.name,
      c.team.name,
      c.demandType ? `${c.demandType.prefix} · ${c.demandType.name}` : "",
      c.tipoProjeto,
      c.priority,
      c.status,
      c.deadline ? toIsoDate(c.deadline) : "",
      toIsoDate(c.createdAt),
      toIsoDate(c.updatedAt),
      isOverdue ? "sim" : "nao",
      daysLate,
      cycleDays,
    ];
  });

  const csv = [headers, ...rows].map(toCsvRow).join("\n");
  const filename = `dashboard-${range.kind}-${toIsoDate(range.ref)}.csv`;

  return new NextResponse("﻿" + csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}

function toCsvRow(values: (string | number)[]): string {
  return values.map((raw) => {
    const s = String(raw ?? "");
    if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }).join(",");
}

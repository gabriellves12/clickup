"use client";

import * as React from "react";

const notificationOptions = [
  ["assigned", "Nova tarefa atribuída", "Quando uma demanda passar para sua responsabilidade."],
  ["deadline", "Prazo próximo", "Aviso 24 horas antes do vencimento."],
  ["approval", "Aprovação e alteração", "Quando uma demanda voltar do cliente ou for aprovada."],
  ["weekly", "Resumo semanal", "Síntese das entregas, atrasos e próximos prazos."],
] as const;

export function SettingsPreferences({ kind }: { kind: "notifications" | "workspace" }) {
  const [notifications, setNotifications] = React.useState<Record<string, boolean>>({ assigned: true, deadline: true, approval: true, weekly: false });
  const [density, setDensity] = React.useState("comfortable");
  const [board, setBoard] = React.useState("design");
  const hydrated = React.useRef(false);

  React.useEffect(() => {
    const saved = localStorage.getItem("control-preferences");
    if (!saved) { hydrated.current = true; return; }
    try {
      const value = JSON.parse(saved);
      queueMicrotask(() => {
        if (value.notifications) setNotifications(value.notifications);
        if (value.density) setDensity(value.density);
        if (value.board) setBoard(value.board);
        hydrated.current = true;
      });
    } catch { hydrated.current = true; }
  }, []);
  React.useEffect(() => { if (hydrated.current) localStorage.setItem("control-preferences", JSON.stringify({ notifications, density, board })); }, [notifications, density, board]);

  if (kind === "notifications") return <div className="divide-y divide-[#ededed]">{notificationOptions.map(([key, label, description]) => <label key={key} className="flex cursor-pointer items-center gap-3 py-3 first:pt-0 last:pb-0"><span className="min-w-0 flex-1"><b className="block text-[10.5px] font-medium">{label}</b><small className="mt-0.5 block text-[8.5px] leading-4 text-[#999]">{description}</small></span><button type="button" role="switch" aria-checked={notifications[key]} onClick={() => setNotifications((current) => ({ ...current, [key]: !current[key] }))} className={`relative h-5 w-9 rounded-full transition-colors ${notifications[key] ? "bg-[#222]" : "bg-[#d8d8d8]"}`}><span className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform ${notifications[key] ? "translate-x-4.5" : "translate-x-0.5"}`} /></button></label>)}</div>;

  return <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-[9.5px] font-medium text-[#666]">Quadro inicial<select value={board} onChange={(event) => setBoard(event.target.value)} className="h-9 rounded-md border border-[#ddd] bg-white px-2.5 text-[10.5px] text-[#222] outline-none focus:border-[#555]"><option value="design">Design</option><option value="web-design">Web</option><option value="inicio">Resumo semanal</option></select></label><label className="grid gap-1.5 text-[9.5px] font-medium text-[#666]">Densidade dos cards<select value={density} onChange={(event) => setDensity(event.target.value)} className="h-9 rounded-md border border-[#ddd] bg-white px-2.5 text-[10.5px] text-[#222] outline-none focus:border-[#555]"><option value="comfortable">Confortável</option><option value="compact">Compacta</option></select></label><p className="col-span-full text-[8.5px] leading-4 text-[#999]">As preferências são salvas neste dispositivo. A sincronização entre dispositivos será ativada com o perfil do Supabase.</p></div>;
}

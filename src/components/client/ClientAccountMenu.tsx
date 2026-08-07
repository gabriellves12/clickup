"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { signOut } from "@/app/actions/auth";

export function ClientAccountMenu({ name, email, clientName }: { name: string; email: string; clientName: string }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { const close = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener("pointerdown", close); return () => document.removeEventListener("pointerdown", close); }, []);
  return <div ref={ref} className="relative ml-auto">{open && <div className="absolute right-0 top-11 z-50 w-[210px] overflow-hidden rounded-lg border border-[#ddd] bg-white p-1.5 shadow-[0_12px_32px_rgba(0,0,0,.12)]"><div className="border-b border-[#eee] px-2.5 py-2"><b className="block truncate text-[10.5px] font-medium">{name}</b><span className="block truncate text-[8.5px] text-[#999]">{email}</span></div><Link href="/portal/configuracoes" className="mt-1 flex h-8 items-center gap-2 rounded-md px-2.5 text-[10.5px] text-[#555] hover:bg-[#f2f2f2]"><Settings className="size-3.5" />Configurações</Link><form action={signOut}><button className="flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-[10.5px] text-[#555] hover:bg-[#f2f2f2]"><LogOut className="size-3.5" />Sair</button></form></div>}<button type="button" onClick={() => setOpen((value) => !value)} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-[#f4f4f4]"><span className="hidden text-right sm:block"><b className="block text-[10.5px] font-medium">{name}</b><small className="text-[9px] text-[#999]">{clientName}</small></span><span className="grid size-8 place-items-center rounded-full bg-[#171717] text-white"><UserRound className="size-3.5" /></span><ChevronDown className={`size-3 text-[#999] transition-transform ${open ? "rotate-180" : ""}`} /></button></div>;
}

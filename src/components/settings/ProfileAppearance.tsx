"use client";

import * as React from "react";
import { Check, ImagePlus, LoaderCircle, Moon, Sun } from "lucide-react";
import type { CurrentUser } from "@/lib/current-user";
import { updateMyProfilePhoto } from "@/app/actions/session";

export function ProfileAppearance({ user }: { user: CurrentUser }) {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const [photo, setPhoto] = React.useState<string | null>(user.avatarUrl);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => { queueMicrotask(() => setTheme(localStorage.getItem("control-theme") === "dark" ? "dark" : "light")); }, []);

  function changeTheme(value: "light" | "dark") {
    setTheme(value);
    localStorage.setItem("control-theme", value);
    document.documentElement.dataset.theme = value;
  }

  function selectPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 500_000) {
      setError("Escolha uma imagem (JPG, PNG ou WebP) de até 500 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : null;
      setPhoto(value);
      setError(null);
      startTransition(async () => {
        try { await updateMyProfilePhoto(value); }
        catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar a foto."); setPhoto(user.avatarUrl); }
      });
    };
    reader.readAsDataURL(file);
  }

  return <div className="grid gap-4">
    <section className="rounded-xl border border-[#e3e3e3] bg-white p-4">
      <div className="flex items-center gap-3"><span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[#181818] text-[12px] font-semibold text-white">{photo ? <img src={photo} alt="" className="size-full object-cover" /> : user.initials}</span><div className="min-w-0 flex-1"><b className="block truncate text-[11px] font-medium">{user.name}</b><span className="mt-0.5 block truncate text-[9.5px] text-[#888]">{user.email}</span></div><label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-[#dedede] px-2.5 text-[9.5px] font-medium text-[#555] hover:bg-[#f3f3f3] hover:text-[#222]"><ImagePlus className="size-3.5" />Foto<input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectPhoto} className="sr-only" /></label></div>
      {pending && <p className="mt-3 flex items-center gap-1.5 text-[9px] text-[#888]"><LoaderCircle className="size-3 animate-spin" />Salvando foto…</p>}
      {error && <p className="mt-3 text-[9px] text-[#777]">{error}</p>}
    </section>
    <section className="rounded-xl border border-[#e3e3e3] bg-white p-4"><div><p className="text-[10.5px] font-medium text-[#333]">Aparência</p><p className="mt-1 text-[9.5px] text-[#888]">Escolha como o sistema aparece neste dispositivo.</p></div><div className="mt-3 grid grid-cols-2 gap-2"><ThemeButton active={theme === "light"} icon={Sun} label="Web" onClick={() => changeTheme("light")} /><ThemeButton active={theme === "dark"} icon={Moon} label="Escuro" onClick={() => changeTheme("dark")} /></div></section>
  </div>;
}

function ThemeButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Sun; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-[10px] font-medium transition-colors ${active ? "border-[#181818] bg-[#181818] text-white" : "border-[#e2e2e2] text-[#666] hover:bg-[#f5f5f5]"}`}><Icon className="size-3.5" />{label}{active && <Check className="ml-auto size-3" />}</button>;
}

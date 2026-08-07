// Ícones essenciais como componentes SVG inline (evita bundle do lucide).
// Tamanho controlado por classe (default 16px).
import { cn } from "@/lib/cn";

type IProps = React.SVGProps<SVGSVGElement> & { className?: string };

const base = (className?: string) =>
  cn("shrink-0", className || "size-4");

export const IcPlus = (p: IProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={base(p.className)} {...p}><path d="M12 5v14M5 12h14"/></svg>
);
export const IcMore = (p: IProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={base(p.className)} {...p}><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>
);
export const IcTrash = (p: IProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={base(p.className)} {...p}><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
);
export const IcEdit = (p: IProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={base(p.className)} {...p}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
);
export const IcClose = (p: IProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={base(p.className)} {...p}><path d="M18 6L6 18M6 6l12 12"/></svg>
);
export const IcChevronDown = (p: IProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={base(p.className)} {...p}><path d="M6 9l6 6 6-6"/></svg>
);
export const IcExternal = (p: IProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={base(p.className)} {...p}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
);
export const IcAlert = (p: IProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={base(p.className)} {...p}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
);
export const IcKanban = (p: IProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={base(p.className)} {...p}><rect x="3" y="3" width="7" height="18" rx="1.5"/><rect x="14" y="3" width="7" height="10" rx="1.5"/><rect x="14" y="17" width="7" height="4" rx="1.5"/></svg>
);
export const IcLink = (p: IProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={base(p.className)} {...p}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
);
export const IcDrive = (p: IProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={base(p.className)} {...p}><path d="M8 3l8 0 5 9-4 8-8 0-5-9z"/><path d="M8 3l5 9M16 3l-5 9M9 20l4 -8"/></svg>
);
export const IcFigma = (p: IProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={base(p.className)} {...p}><path d="M12 2h-4a3 3 0 000 6h4z"/><path d="M12 8h-4a3 3 0 000 6h4z"/><path d="M12 14h-4a3 3 0 100 6 3 3 0 003-3z"/><path d="M12 2h4a3 3 0 010 6h-4z"/><circle cx="15" cy="11" r="3"/></svg>
);
export const IcInstagram = (p: IProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={base(p.className)} {...p}><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".7" fill="currentColor"/></svg>
);
export const IcPhotos = (p: IProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={base(p.className)} {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
);
export const IcCloudflare = (p: IProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={base(p.className)} {...p}><path d="M17 18H7a4 4 0 01-.7-7.94A6 6 0 0117.9 8 4.5 4.5 0 0117 18z"/></svg>
);
export const IcServer = (p: IProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={base(p.className)} {...p}><rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M7 8h.01M7 17h.01"/></svg>
);
export const IcWordpress = (p: IProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={base(p.className)} {...p}><circle cx="12" cy="12" r="9"/><path d="M6 10l4 8M15 9l-3 9M18 8l-2 10"/></svg>
);
export const IcBox = (p: IProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={base(p.className)} {...p}><path d="M3 7l9-4 9 4v10l-9 4-9-4V7z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg>
);
export const IcFolder = (p: IProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={base(p.className)} {...p}><path d="M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V6z"/></svg>
);
export const IcGrip = (p: IProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={base(p.className)} {...p}><circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg>
);

export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const map: Record<string, React.ComponentType<IProps>> = {
    drive: IcDrive, figma: IcFigma, photos: IcPhotos, instagram: IcInstagram,
    product: IcBox, cloudflare: IcCloudflare, hosting: IcServer,
    wordpress: IcWordpress, custom: IcLink, link: IcLink,
  };
  const C = map[category] ?? IcLink;
  return <C className={className} />;
}

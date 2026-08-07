// Configurações estáticas do domínio (não vão pro banco).
// Quadros e colunas de status vivem no banco (models Team + TeamStatus) —
// consulte `src/lib/teams.ts`.

export type StatusKey = string;

export interface StatusDef {
  key: StatusKey;
  label: string;
  tone?: string | null;
}

export interface TeamConfig {
  slug: string;
  name: string;
  flow: StatusDef[];
}

export const TIPO_PROJETO_OPTIONS = [
  { value: "PADRAO",  label: "Padrão (post, arte, reels…)" },
  { value: "PAGINA",  label: "Página (site, landing, one-page)" },
];

export interface LinkCategoryDef {
  key: string;
  label: string;
  icon: "drive" | "figma" | "photos" | "instagram" | "product" | "cloudflare" | "hosting" | "wordpress" | "link";
}

export const LINK_CATEGORIES: LinkCategoryDef[] = [
  { key: "drive",      label: "Drive geral",  icon: "drive" },
  { key: "figma",      label: "Figma",        icon: "figma" },
  { key: "photos",     label: "Fotos",        icon: "photos" },
  { key: "instagram",  label: "Instagram",    icon: "instagram" },
  { key: "product",    label: "Produtos",     icon: "product" },
  { key: "cloudflare", label: "Cloudflare",   icon: "cloudflare" },
  { key: "hosting",    label: "Hospedagem",   icon: "hosting" },
  { key: "wordpress",  label: "WordPress",    icon: "wordpress" },
  { key: "custom",     label: "Outro link",   icon: "link" },
];

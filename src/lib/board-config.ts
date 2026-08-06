// Fonte única de verdade para as colunas de fluxo por time.
// Adicione novos times aqui e o board renderiza sem tocar em UI.

export type StatusKey = string;

export interface StatusDef {
  key: StatusKey;
  label: string;
  tone?: "neutral" | "info" | "doing" | "review" | "done" | "warn";
}

export interface TeamConfig {
  slug: string;
  name: string;
  flow: StatusDef[]; // ordem em que aparecem no board
}

export const TEAMS: TeamConfig[] = [
  {
    slug: "design",
    name: "Time Design",
    flow: [
      { key: "EM_PRODUCAO",         label: "Em Produção",          tone: "doing" },
      { key: "APROVACAO_INTERNA",   label: "Aprovação Interna",    tone: "review" },
      { key: "APROVACAO_CLIENTE",   label: "Aprovação do Cliente", tone: "review" },
      { key: "ALTERACAO",           label: "Alteração",            tone: "warn" },
      { key: "FINALIZADO",          label: "Finalizado",           tone: "done" },
    ],
  },
  {
    slug: "web-design",
    name: "Time Web Design",
    flow: [
      { key: "PROPAGACAO_DNS",      label: "Propagação de DNS",    tone: "info" },
      { key: "IMPLEMENTACAO",       label: "Implementação",        tone: "doing" },
      { key: "OTIMIZACAO",          label: "Otimização",           tone: "doing" },
      { key: "APROVACAO_INTERNA",   label: "Aprovação Interna",    tone: "review" },
      { key: "APROVACAO_CLIENTE",   label: "Aprovação do Cliente", tone: "review" },
      { key: "ALTERACAO",           label: "Alteração",            tone: "warn" },
      { key: "FINALIZADO",          label: "Finalizado",           tone: "done" },
    ],
  },
];

export function findTeam(slug: string): TeamConfig | undefined {
  return TEAMS.find((t) => t.slug === slug);
}

// Regra de roteamento automático
export const WEB_TEAM_SLUG = "web-design";
export const DESIGN_TEAM_SLUG = "design";
export function targetTeamSlugFor(tipoProjeto: string): string {
  return tipoProjeto === "PAGINA" ? WEB_TEAM_SLUG : DESIGN_TEAM_SLUG;
}

export const TIPO_PROJETO_OPTIONS = [
  { value: "PADRAO",  label: "Padrão (post, arte, reels…)" },
  { value: "PAGINA",  label: "Página (site, landing, one-page)" },
];

// Categorias da árvore de links do cliente
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

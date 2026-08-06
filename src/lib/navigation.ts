export type UserRole = "admin" | "manager" | "member" | "client";
export type NavigationIcon = "home" | "kanban" | "clients" | "clientArea" | "crm" | "drive" | "dashboard" | "settings" | "admin";

export type NavigationItem = {
  label: string;
  description: string;
  href: string;
  icon: NavigationIcon;
  rolesAllowed: UserRole[];
  group: "operational" | "admin" | "account";
  matchPrefixes?: string[];
};

const internal: UserRole[] = ["admin", "manager", "member"];

export const navigationItems: NavigationItem[] = [
  { label: "Início", description: "Resumo da sua semana", href: "/inicio", icon: "home", rolesAllowed: internal, group: "operational" },
  { label: "Kanban", description: "Quadros e demandas", href: "/kanban", icon: "kanban", rolesAllowed: internal, group: "operational", matchPrefixes: ["/kanban", "/board"] },
  { label: "Clientes", description: "Histórico e relacionamentos", href: "/clientes", icon: "clients", rolesAllowed: internal, group: "operational" },
  { label: "Drive", description: "Arquivos internos", href: "/drive", icon: "drive", rolesAllowed: internal, group: "operational" },
  { label: "CRM", description: "Leads e ativações", href: "/crm", icon: "crm", rolesAllowed: ["admin"], group: "admin" },
  { label: "Dashboard de Dados", description: "Indicadores da operação", href: "/dashboard", icon: "dashboard", rolesAllowed: ["admin"], group: "admin" },
  { label: "Área do cliente", description: "Visualizar os portais dos clientes", href: "/area-cliente", icon: "clientArea", rolesAllowed: ["admin", "manager"], group: "admin" },
  { label: "Configurações", description: "Preferências do sistema", href: "/configuracoes", icon: "settings", rolesAllowed: internal, group: "account" },
  { label: "Painel de Admin", description: "Gestão da operação", href: "/admin", icon: "admin", rolesAllowed: ["admin"], group: "account" },
];

export const canAccess = (role: UserRole, item: NavigationItem) => item.rolesAllowed.includes(role);
export const isRestrictedPath = (pathname: string, role: UserRole) => {
  const item = navigationItems.find((entry) => (entry.matchPrefixes ?? [entry.href]).some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)));
  return item ? !item.rolesAllowed.includes(role) : false;
};

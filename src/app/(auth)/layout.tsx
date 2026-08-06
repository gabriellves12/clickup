// Layout minimal para rotas de auth — sem AppShell, sem carregamento de teams.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-bg text-text">{children}</div>;
}

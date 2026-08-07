import { getClientsList, getClientsOverview } from "@/lib/clients-data";
import { ClientsList } from "@/components/clients/ClientsList";
import { requireCurrentUser } from "@/lib/current-user";

function KpiCard({ label, value, hint, tone }: {
  label: string; value: React.ReactNode; hint?: string; tone?: "danger";
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 grid gap-1">
      <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-text-3">
        {label}
      </div>
      <div className={
        "text-[24px] font-semibold tracking-[-0.02em] tabular " +
        (tone === "danger" ? "text-danger" : "text-text")
      }>
        {value}
      </div>
      {hint && <div className="text-[11px] text-text-3">{hint}</div>}
    </div>
  );
}

export default async function ClientsPage() {
  const [user, overview, clients] = await Promise.all([requireCurrentUser(), getClientsOverview(), getClientsList()]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-clean">
      <div className="px-6 lg:px-8 pt-6 pb-4">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-text-3">
              Relacionamento
            </div>
            <h1 className="text-[26px] font-semibold tracking-[-0.025em] text-text mt-1">
              Clientes
            </h1>
            <p className="text-[12.5px] text-text-2 mt-1">
              Visão consolidada da parceria com cada cliente. Responsáveis e entregáveis vêm direto do Kanban.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-8 pb-6 grid gap-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <KpiCard label="Total" value={overview.total} />
          <KpiCard label="Ativos" value={overview.ativos} />
          <KpiCard label="Fixos" value={overview.fixos} />
          <KpiCard label="Freelas" value={overview.freelas} />
          <KpiCard label="Encerrados" value={overview.encerrados} hint="Parceria finalizada" />
        </div>

        <ClientsList
          clients={clients}
          canViewCredentials={user.role === "admin"}
          canManageLinks={user.role === "admin" || user.role === "manager"}
          canViewWhatsapp={user.role === "admin" || user.role === "manager"}
        />
      </div>
    </div>
  );
}

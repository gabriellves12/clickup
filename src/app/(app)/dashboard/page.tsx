import { BarChart3 } from "lucide-react";
import { PlaceholderPage } from "@/components/shell/PlaceholderPage";
import { requireAdmin } from "@/lib/current-user";

export default async function DashboardPage() {
  await requireAdmin();
  return <PlaceholderPage eyebrow="Admin · Inteligência" title="Dashboard de Dados" description="KPIs de contratos, oportunidades, entregas, atrasos e reprovações da operação." icon={BarChart3} />;
}

import { ContactRound } from "lucide-react";
import { PlaceholderPage } from "@/components/shell/PlaceholderPage";
import { requireAdmin } from "@/lib/current-user";

export default async function CrmPage() {
  await requireAdmin();
  return <PlaceholderPage eyebrow="Admin · Comercial" title="CRM" description="Gestão de leads, novas ativações, indicações e cadências de follow-up." icon={ContactRound} />;
}

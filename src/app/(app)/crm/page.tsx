import { requireAdmin } from "@/lib/current-user";
import { CrmWorkspace } from "@/components/crm/CrmWorkspace";

export default async function CrmPage() {
  await requireAdmin();
  return <CrmWorkspace />;
}

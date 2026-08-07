import { requireAdmin } from "@/lib/current-user";
import { AccessDirectory } from "@/components/accesses/AccessDirectory";

export default async function AccessesPage() {
  await requireAdmin();
  return <AccessDirectory />;
}

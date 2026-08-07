import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/current-user";
import { AccessDirectory } from "@/components/accesses/AccessDirectory";
import { accessDirectory } from "@/lib/access-directory";

export default async function AccessesPage() {
  const user = await requireCurrentUser();
  if (user.role !== "admin" && user.role !== "manager") redirect("/kanban");
  return <AccessDirectory initialEntries={accessDirectory} />;
}

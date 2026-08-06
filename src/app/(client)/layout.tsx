import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/current-user";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCurrentUser();
  if (user.role !== "client" || !user.clientId) redirect("/inicio");
  return children;
}

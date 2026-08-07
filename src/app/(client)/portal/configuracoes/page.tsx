import { requireCurrentUser } from "@/lib/current-user";
import { AccountSettings } from "@/components/settings/AccountSettings";

export default async function ClientSettingsPage() {
  const user = await requireCurrentUser();
  return <AccountSettings user={user} standalone />;
}

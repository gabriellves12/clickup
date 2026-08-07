import { ConversationHub } from "@/components/conversations/ConversationHub";
import { requireAdmin } from "@/lib/current-user";

export default async function ConversationsPage() {
  await requireAdmin();
  return <ConversationHub />;
}

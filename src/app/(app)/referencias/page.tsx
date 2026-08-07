import { ReferenceBank } from "@/components/references/ReferenceBank";

export default function ReferencesPage() {
  return <ReferenceBank pinterestUrl={process.env.NEXT_PUBLIC_PINTEREST_OPERATION_URL ?? "https://br.pinterest.com/gabriellves12/ref-web/"} />;
}

import { ReferenceBank } from "@/components/references/ReferenceBank";

export default function ReferencesPage() {
  return <ReferenceBank figmaUrl={process.env.NEXT_PUBLIC_REFERENCE_FIGMA_URL ?? "https://www.figma.com/"} />;
}

import { ReferenceBank } from "@/components/references/ReferenceBank";

export default function ReferencesPage() {
  return (
    <ReferenceBank
      figmaUrl={process.env.NEXT_PUBLIC_REFERENCE_FIGMA_URL ?? "https://www.figma.com/"}
      pinterestUrl={process.env.NEXT_PUBLIC_REFERENCE_PINTEREST_URL ?? "https://br.pinterest.com/gabriellves12/"}
    />
  );
}

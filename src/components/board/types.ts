import type { StatusDef } from "@/lib/board-config";

export interface PersonLite {
  id: string; name: string; initials: string; color: string;
}
export interface ClientLite { id: string; name: string; initials: string; }

export interface CardLite {
  id: string;
  title: string;
  description: string | null;
  status: string;
  tipoProjeto: string;
  pendenteMaterial: boolean;
  deadline: string | null; // ISO
  order: number;
  clientId: string;
  responsibleId: string;
  productId: string | null;
  demandTypeId: string | null;
  variation: string[];
  briefing: string | null;
  copyUrl: string | null;
  referenceUrl: string | null;
  attachmentDriveUrl: string | null;
  externalMaterials: string | null;
  useExternalMaterials: boolean;
  startDate: string | null;
  priority: string;
  client: ClientLite;
  responsible: PersonLite;
}

export interface ProductLite {
  id: string; name: string; clientId: string; driveUrl: string | null;
  figmaUrl: string | null; photosUrl: string | null; observations: string | null;
}

export interface DemandTypeLite {
  id: string; name: string; prefix: string; variationMode: string;
  variations: string[]; routeToWeb: boolean; order: number;
}

export interface LinkItemLite {
  id: string;
  category: string;
  label: string;
  url: string | null;
  observation: string | null;
  parentId: string | null;
  order: number;
}

export interface ClientWithLinks extends ClientLite {
  links: LinkItemLite[];
}

export interface BoardMember { person: PersonLite; order: number; }

export interface BoardData {
  team: { id: string; slug: string; name: string };
  flow: StatusDef[];
  members: BoardMember[];
  cards: CardLite[];
  clients: ClientWithLinks[];
  allPeople: PersonLite[];
  products: ProductLite[];
  demandTypes: DemandTypeLite[];
}

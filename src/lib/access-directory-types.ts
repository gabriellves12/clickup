export type AccessKind = "ferramenta" | "referência" | "biblioteca" | "ia";
export type AccessState = "cofre" | "aberto" | "solicitar";

export type AccessDirectoryEntry = {
  id: string;
  name: string;
  kind: AccessKind;
  area: string;
  owner: string;
  url: string;
  access: AccessState;
  reviewedAt: string;
  description: string;
  username: string;
  secret: string;
};

// Paletas monocromáticas com hue variado — usadas para diferenciar visualmente
// etapas do kanban, pessoas e etiquetas de cliente sem escapar do design system.

export type StageColor = {
  key: string;
  headerBg: string;
  headerText: string;
  border: string;
  columnBg: string;   // fundo da coluna (bem suave)
  dot: string;        // cor sólida do dot no header
  badgeBg: string;    // usado em badges do CardDialog
  badgeText: string;
};

// Cor "azul leve" fixa para colunas de pessoas
export const PERSON_COLUMN_COLOR: StageColor = {
  key: "person",
  headerBg: "#eaf2ff",
  headerText: "#1d3d7a",
  border: "#cddbf3",
  columnBg: "#f5f8ff",
  dot: "#3f6fce",
  badgeBg: "#eaf2ff",
  badgeText: "#1d3d7a",
};

// Paleta cíclica para etapas — ordem estável, sem cores muito próximas.
const STAGE_PALETTE: Omit<StageColor, "key">[] = [
  { headerBg: "#eef7ee", headerText: "#215c2a", border: "#c9e3cd", columnBg: "#f5faf5", dot: "#3a7d43", badgeBg: "#eef7ee", badgeText: "#215c2a" }, // verde suave
  { headerBg: "#fff4e5", headerText: "#7a4611", border: "#f2d9b3", columnBg: "#fdf8f0", dot: "#c17a1e", badgeBg: "#fff4e5", badgeText: "#7a4611" }, // âmbar
  { headerBg: "#f4ecff", headerText: "#4a2a86", border: "#dccbf5", columnBg: "#f9f5ff", dot: "#7a4bcf", badgeBg: "#f4ecff", badgeText: "#4a2a86" }, // roxo
  { headerBg: "#fdecee", headerText: "#8a1c2b", border: "#f2c8ce", columnBg: "#fdf5f6", dot: "#c73a4c", badgeBg: "#fdecee", badgeText: "#8a1c2b" }, // vermelho suave
  { headerBg: "#eaf2ff", headerText: "#1d3d7a", border: "#cddbf3", columnBg: "#f5f8ff", dot: "#3f6fce", badgeBg: "#eaf2ff", badgeText: "#1d3d7a" }, // azul
  { headerBg: "#eefbfa", headerText: "#0f5a55", border: "#c5eee9", columnBg: "#f4fbfa", dot: "#2d8f86", badgeBg: "#eefbfa", badgeText: "#0f5a55" }, // teal
  { headerBg: "#fbeef7", headerText: "#75225e", border: "#efc9e2", columnBg: "#fdf5fa", dot: "#b83e91", badgeBg: "#fbeef7", badgeText: "#75225e" }, // rosa
  { headerBg: "#f0f0f0", headerText: "#333333", border: "#dcdcdc", columnBg: "#f7f7f7", dot: "#666666", badgeBg: "#f0f0f0", badgeText: "#333333" }, // neutro
];

// Mapeamento estável tone→índice quando o TeamStatus define tom explícito.
const TONE_INDEX: Record<string, number> = {
  doing: 0, review: 1, info: 4, done: 0, warn: 3, neutral: 7,
};

export function colorForStage(index: number, tone?: string | null): StageColor {
  const idx = tone && TONE_INDEX[tone] !== undefined ? TONE_INDEX[tone] : index % STAGE_PALETTE.length;
  return { key: `stage-${idx}`, ...STAGE_PALETTE[idx] };
}

// ---------------------- Cliente (etiqueta com cor) ----------------------

const CLIENT_PALETTE = [
  { bg: "#e0f2fe", text: "#075985", ring: "#7dd3fc" }, // sky
  { bg: "#dcfce7", text: "#166534", ring: "#86efac" }, // green
  { bg: "#fef3c7", text: "#854d0e", ring: "#fde68a" }, // amber
  { bg: "#ede9fe", text: "#5b21b6", ring: "#c4b5fd" }, // violet
  { bg: "#ffe4e6", text: "#9f1239", ring: "#fda4af" }, // rose
  { bg: "#cffafe", text: "#155e75", ring: "#67e8f9" }, // cyan
  { bg: "#fce7f3", text: "#9d174d", ring: "#f9a8d4" }, // pink
  { bg: "#ecfccb", text: "#3f6212", ring: "#bef264" }, // lime
  { bg: "#fed7aa", text: "#7c2d12", ring: "#fdba74" }, // orange
  { bg: "#e2e8f0", text: "#334155", ring: "#94a3b8" }, // slate
];

// Hash determinística simples (djb2) — mesmo id sempre resulta na mesma cor.
function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

export type ClientColor = { bg: string; text: string; ring: string };

export function colorForClient(id: string): ClientColor {
  const idx = hashString(id) % CLIENT_PALETTE.length;
  return CLIENT_PALETTE[idx];
}

// ---------------------- Prioridade ----------------------

export type PriorityColor = { bg: string; text: string; label: string };

const PRIORITY: Record<string, PriorityColor> = {
  LOW:    { bg: "#f0f0f0", text: "#555555", label: "Baixa" },
  NORMAL: { bg: "#e0e7ff", text: "#3730a3", label: "Normal" },
  HIGH:   { bg: "#fef3c7", text: "#854d0e", label: "Alta" },
  URGENT: { bg: "#fee2e2", text: "#991b1b", label: "Urgente" },
};

export function colorForPriority(value: string | null | undefined): PriorityColor {
  if (!value) return PRIORITY.NORMAL;
  return PRIORITY[value] ?? PRIORITY.NORMAL;
}

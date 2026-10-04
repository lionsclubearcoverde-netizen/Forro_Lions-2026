import type { MesaStatus } from "./types";

export const VALOR_MESA = 150.0;
export const VALOR_SENHA = 40.0;

export const FORMAS_PAGAMENTO = [
  "Dinheiro",
  "PIX",
  "Cartão de Crédito",
  "Cartão de Débito",
] as const;

export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

/**
 * Paleta unificada por status — usada no mapa, badges, modais e relatórios.
 * Contrastes ajustados para leitura tanto sobre a cor (textOn) quanto em chips claros (chip).
 */
export interface StatusStyle {
  /** Cor sólida (fundo de mesas/badges preenchidos). */
  solid: string;
  /** Texto legível sobre `solid`. */
  textOn: string;
  /** Fundo claro de chips/etiquetas. */
  chipBg: string;
  /** Texto escuro de chips/etiquetas. */
  chipText: string;
  /** Rótulo em português. */
  label: string;
}

export const STATUS_STYLES: Record<MesaStatus, StatusStyle> = {
  livre: {
    solid: "#059669", // emerald-600
    textOn: "#ffffff",
    chipBg: "#d1fae5",
    chipText: "#065f46",
    label: "Livre",
  },
  reservada: {
    solid: "#d97706", // amber-600 (legível com texto branco, ao contrário do amarelo antigo)
    textOn: "#ffffff",
    chipBg: "#fef3c7",
    chipText: "#92400e",
    label: "Reservada",
  },
  paga: {
    solid: "#4f46e5", // indigo-600
    textOn: "#ffffff",
    chipBg: "#e0e7ff",
    chipText: "#3730a3",
    label: "Paga",
  },
};

/** @deprecated Use STATUS_STYLES[status].solid — mantido p/ compatibilidade com PDFs antigos. */
export const STATUS_COLORS: Record<string, string> = {
  livre: STATUS_STYLES.livre.solid,
  reservada: STATUS_STYLES.reservada.solid,
  paga: STATUS_STYLES.paga.solid,
};

export const EVENTO_NOME = "Forró do Lions 2026";
export const ORGANIZACAO = "Lions Clube Arcoverde";

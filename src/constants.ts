export const VALOR_MESA = 150.0;
export const VALOR_SENHA = 40.0;

export const FORMAS_PAGAMENTO = [
  "Dinheiro",
  "PIX",
  "Cartão de Crédito",
  "Cartão de Débito",
] as const;

export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

export const STATUS_COLORS: Record<string, string> = {
  livre: "#4CAF50",
  reservada: "#FFC107",
  paga: "#2196F3",
};

export const EVENTO_NOME = "Forró do Lions 2026";
export const ORGANIZACAO = "Lions Clube Arcoverde";

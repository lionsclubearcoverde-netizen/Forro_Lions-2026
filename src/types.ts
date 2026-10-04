import type { Session, User } from "@supabase/supabase-js";

export type MesaStatus = "livre" | "reservada" | "paga";

export type Setor = "inferior" | "esquerda" | "direita";

export interface Mesa {
  id: number;
  numero: number;
  setor: Setor;
  linha: number;
  coluna: number;
  status: MesaStatus;
  responsavel?: string | null;
  telefone?: string | null;
  forma_pagamento?: string | null;
  valor_pago: number;
  data_reserva?: string | null;
  data_pagamento?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Senha {
  id: number;
  nome: string;
  telefone: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  forma_pagamento: string;
  data_venda: string;
  created_by?: string | null;
  created_at: string;
}

export interface Stats {
  totalMesas: number;
  livres: number;
  reservadas: number;
  pagas: number;
  arrecadadoMesas: number;
  arrecadadoSenhas: number;
  totalGeral: number;
}

/** Tipos de sessão/auth re-exportados para evitar `any` na aplicação. */
export type AppSession = Session;
export type AppUser = User;

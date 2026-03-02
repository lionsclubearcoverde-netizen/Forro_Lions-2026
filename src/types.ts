export type MesaStatus = 'livre' | 'reservada' | 'paga';

export interface Mesa {
  id: number;
  numero: number;
  setor: 'inferior' | 'esquerda' | 'direita';
  linha: number;
  coluna: number;
  status: MesaStatus;
  responsavel?: string;
  telefone?: string;
  forma_pagamento?: string;
  valor_pago: number;
  data_reserva?: string;
  data_pagamento?: string;
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

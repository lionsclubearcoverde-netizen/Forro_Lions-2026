import { supabase } from "../integrations/supabase/client";
import type { Mesa, Senha, Stats, AppSession } from "../types";
import { round2 } from "../lib/utils";

/** Erro de API normalizado com código do PostgREST quando disponível. */
export class ApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

function throwIfError(error: { message: string; code?: string } | null): void {
  if (error) throw new ApiError(error.message, error.code);
}

export const api = {
  // ------------------------------------------------------------------ Mesas
  async getMesas(): Promise<Mesa[]> {
    const { data, error } = await supabase
      .from("mesas")
      .select("*")
      .order("numero", { ascending: true });

    throwIfError(error);
    return (data ?? []) as Mesa[];
  },

  /**
   * Atualiza o status/dados de uma mesa respeitando transições válidas:
   * livre -> reservada -> paga | qualquer -> livre (liberação explícita).
   * O valor da mesa vem do servidor via trigger quando não informado.
   */
  async updateMesa(id: number, data: Partial<Mesa>): Promise<void> {
    const { error } = await supabase
      .from("mesas")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id);

    throwIfError(error);
  },

  async subscribeToMesas(onChange: () => void): Promise<() => void> {
    const channel = supabase
      .channel("mesas-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mesas" },
        onChange
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },

  // ----------------------------------------------------------------- Senhas
  async getSenhas(): Promise<Senha[]> {
    const { data, error } = await supabase
      .from("senhas")
      .select("*")
      .order("created_at", { ascending: false });

    throwIfError(error);
    return (data ?? []) as Senha[];
  },

  async addSenha(data: Pick<Senha, "nome" | "telefone" | "quantidade" | "forma_pagamento">): Promise<void> {
    const { error } = await supabase.from("senhas").insert([data]);
    throwIfError(error);
  },

  async deleteSenha(id: number): Promise<void> {
    const { error } = await supabase.from("senhas").delete().eq("id", id);
    throwIfError(error);
  },

  async subscribeToSenhas(onChange: () => void): Promise<() => void> {
    const channel = supabase
      .channel("senhas-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "senhas" },
        onChange
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },

  // ------------------------------------------------------------------ Stats
  /** Busca apenas as colunas necessárias para os indicadores (evita payload excessivo). */
  async getStats(): Promise<Stats> {
    const [mesasRes, senhasRes] = await Promise.all([
      supabase.from("mesas").select("status, valor_pago"),
      supabase.from("senhas").select("valor_total"),
    ]);

    throwIfError(mesasRes.error);
    throwIfError(senhasRes.error);

    const mesas = (mesasRes.data ?? []) as Pick<Mesa, "status" | "valor_pago">[];
    const senhas = (senhasRes.data ?? []) as Pick<Senha, "valor_total">[];

    const arrecadadoMesas = mesas
      .filter((m) => m.status === "paga")
      .reduce((acc, m) => acc + (m.valor_pago || 0), 0);
    const arrecadadoSenhas = senhas.reduce((acc, s) => acc + (s.valor_total || 0), 0);

    return {
      totalMesas: mesas.length,
      livres: mesas.filter((m) => m.status === "livre").length,
      reservadas: mesas.filter((m) => m.status === "reservada").length,
      pagas: mesas.filter((m) => m.status === "paga").length,
      arrecadadoMesas: round2(arrecadadoMesas),
      arrecadadoSenhas: round2(arrecadadoSenhas),
      totalGeral: round2(arrecadadoMesas + arrecadadoSenhas),
    };
  },

  // ------------------------------------------------------------------- Auth
  async login(email: string, password: string): Promise<AppSession> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    throwIfError(error);
    if (!data.session) throw new ApiError("Não foi possível criar a sessão.");
    return data.session;
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    throwIfError(error);
  },

  async getSession(): Promise<AppSession | null> {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  onAuthStateChange(callback: (session: AppSession | null) => void): () => void {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
    return () => subscription.unsubscribe();
  },
};

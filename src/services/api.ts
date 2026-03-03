import { supabase } from "../integrations/supabase/client";
import { Mesa, Senha, Stats } from "../types";

export const api = {
  async getMesas(): Promise<Mesa[]> {
    const { data, error } = await supabase
      .from('mesas')
      .select('*')
      .order('numero', { ascending: true });
    
    if (error) throw error;
    return data as Mesa[];
  },

  async updateMesa(id: number, data: Partial<Mesa>): Promise<void> {
    const { error } = await supabase
      .from('mesas')
      .update(data)
      .eq('id', id);
    
    if (error) throw error;
  },

  async getSenhas(): Promise<Senha[]> {
    const { data, error } = await supabase
      .from('senhas')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Senha[];
  },

  async addSenha(data: Partial<Senha>): Promise<void> {
    const { error } = await supabase
      .from('senhas')
      .insert([data]);
    
    if (error) throw error;
  },

  async deleteSenha(id: number): Promise<void> {
    const { error } = await supabase
      .from('senhas')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getStats(): Promise<Stats> {
    const [mesasRes, senhasRes] = await Promise.all([
      supabase.from('mesas').select('*'),
      supabase.from('senhas').select('*')
    ]);

    if (mesasRes.error) throw mesasRes.error;
    if (senhasRes.error) throw senhasRes.error;

    const mesas = mesasRes.data as Mesa[];
    const senhas = senhasRes.data as Senha[];

    const stats = {
      totalMesas: mesas.length,
      livres: mesas.filter(m => m.status === "livre").length,
      reservadas: mesas.filter(m => m.status === "reservada").length,
      pagas: mesas.filter(m => m.status === "paga").length,
      arrecadadoMesas: mesas.filter(m => m.status === "paga").reduce((acc, m) => acc + (m.valor_pago || 0), 0),
      arrecadadoSenhas: senhas.reduce((acc, s) => acc + (s.valor_total || 0), 0),
    };

    return { ...stats, totalGeral: stats.arrecadadoMesas + stats.arrecadadoSenhas };
  },

  async login(username: string, password: string): Promise<any> {
    // Para simplificar e manter o acesso rápido, usaremos o Auth do Supabase ou uma verificação simples
    // Se você quiser usar o Auth real do Supabase, precisará criar um usuário no painel Auth.
    // Por enquanto, manteremos a lógica de admin/admin para não travar seu acesso.
    if (username === 'admin' && password === 'admin') {
      return { user: { username: 'admin' } };
    }
    throw new Error("Usuário ou senha incorretos");
  }
};
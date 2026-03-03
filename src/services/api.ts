import { Mesa, Senha, Stats } from "../types";

const API_URL = "/api";

export const api = {
  async getMesas(): Promise<Mesa[]> {
    const res = await fetch(`${API_URL}/mesas`);
    return res.json();
  },

  async updateMesa(id: number, data: Partial<Mesa>): Promise<void> {
    await fetch(`${API_URL}/mesas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async getSenhas(): Promise<Senha[]> {
    const res = await fetch(`${API_URL}/senhas`);
    return res.json();
  },

  async addSenha(data: Partial<Senha>): Promise<void> {
    await fetch(`${API_URL}/senhas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async deleteSenha(id: number): Promise<void> {
    await fetch(`${API_URL}/senhas/${id}`, {
      method: "DELETE",
    });
  },

  async getStats(): Promise<Stats> {
    const res = await fetch(`${API_URL}/stats`);
    return res.json();
  },

  async login(username: string, password: string): Promise<any> {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    
    let data;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { message: text || "Erro desconhecido no servidor" };
    }

    if (!res.ok) {
      throw new Error(data.message || `Erro ${res.status}`);
    }
    return data;
  }
};
import { Mesa, Senha, Stats } from "../types";

const API_URL = "/api";

async function handleResponse(res: Response) {
  let data;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    data = await res.json();
  } else {
    const text = await res.text();
    // Se for o erro da Vercel, extrai uma mensagem amigável
    if (text.includes("A server error occurred")) {
      data = { message: "O servidor da Vercel encontrou um erro interno. Verifique os logs no painel da Vercel." };
    } else {
      data = { message: text || "Erro desconhecido no servidor" };
    }
  }

  if (!res.ok) {
    throw new Error(data.message || `Erro ${res.status}`);
  }
  return data;
}

export const api = {
  async getMesas(): Promise<Mesa[]> {
    const res = await fetch(`${API_URL}/mesas`);
    return handleResponse(res);
  },

  async updateMesa(id: number, data: Partial<Mesa>): Promise<void> {
    const res = await fetch(`${API_URL}/mesas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getSenhas(): Promise<Senha[]> {
    const res = await fetch(`${API_URL}/senhas`);
    return handleResponse(res);
  },

  async addSenha(data: Partial<Senha>): Promise<void> {
    const res = await fetch(`${API_URL}/senhas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteSenha(id: number): Promise<void> {
    const res = await fetch(`${API_URL}/senhas/${id}`, {
      method: "DELETE",
    });
    return handleResponse(res);
  },

  async getStats(): Promise<Stats> {
    const res = await fetch(`${API_URL}/stats`);
    return handleResponse(res);
  },

  async login(username: string, password: string): Promise<any> {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(res);
  }
};
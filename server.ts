import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// --- BANCO DE DADOS EM MEMÓRIA ---
let mesas: any[] = [];
const SECTORS = ['inferior', 'esquerda', 'direita'];

for (let i = 1; i <= 60; i++) {
  const linha = Math.floor((i - 1) / 10);
  const coluna = (i - 1) % 10;
  
  mesas.push({
    id: i,
    numero: i,
    setor: SECTORS[Math.floor(Math.random() * 3)],
    linha: linha,
    coluna: coluna,
    status: 'livre',
    responsavel: '',
    telefone: '',
    forma_pagamento: '',
    valor_pago: 0,
    data_reserva: null,
    data_pagamento: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
}

let senhas: any[] = [];
const usuarios = [
  { username: 'admin', password: 'admin' }
];

// --- ROTAS DA API ---
app.get("/api/health", (req, res) => res.json({ status: "ok", mode: "standalone" }));

app.get("/api/mesas", (req, res) => res.json(mesas));

app.put("/api/mesas/:id", (req, res) => {
  const { id } = req.params;
  const index = mesas.findIndex(m => m.id === parseInt(id));
  if (index !== -1) {
    mesas[index] = { ...mesas[index], ...req.body, updated_at: new Date().toISOString() };
    res.json({ success: true });
  } else {
    res.status(404).json({ message: "Mesa não encontrada" });
  }
});

app.get("/api/senhas", (req, res) => {
  res.json(senhas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
});

app.post("/api/senhas", (req, res) => {
  const novaSenha = { id: Date.now(), ...req.body, created_at: new Date().toISOString() };
  senhas.push(novaSenha);
  res.json({ success: true });
});

app.delete("/api/senhas/:id", (req, res) => {
  const { id } = req.params;
  senhas = senhas.filter(s => s.id !== parseInt(id));
  res.json({ success: true });
});

app.get("/api/stats", (req, res) => {
  const stats = {
    totalMesas: mesas.length,
    livres: mesas.filter(m => m.status === "livre").length,
    reservadas: mesas.filter(m => m.status === "reservada").length,
    pagas: mesas.filter(m => m.status === "paga").length,
    arrecadadoMesas: mesas.filter(m => m.status === "paga").reduce((acc, m) => acc + (m.valor_pago || 0), 0),
    arrecadadoSenhas: senhas.reduce((acc, s) => acc + (s.valor_total || 0), 0),
  };
  res.json({ ...stats, totalGeral: stats.arrecadadoMesas + stats.arrecadadoSenhas });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = usuarios.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ success: true, user: { username: user.username } });
  } else {
    res.status(401).json({ message: "Usuário ou senha incorretos" });
  }
});

// Servir arquivos estáticos do React em produção
const distPath = path.resolve(__dirname, "dist");
app.use(express.static(distPath));

// Rota "catch-all" para o React Router
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(distPath, "index.html"));
  }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

export default app;
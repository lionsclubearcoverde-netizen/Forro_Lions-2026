import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

// --- BANCO DE DADOS EM MEMÓRIA (Persiste enquanto o Vite estiver rodando) ---
let mesas: any[] = [];
const SECTORS = ['inferior', 'esquerda', 'direita'];
if (mesas.length === 0) {
  for (let i = 1; i <= 60; i++) {
    mesas.push({
      id: i,
      numero: i,
      setor: SECTORS[Math.floor(Math.random() * 3)],
      linha: Math.floor((i - 1) / 10),
      coluna: (i - 1) % 10,
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
}
let senhas: any[] = [];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url?.startsWith('/api')) return next();

            res.setHeader('Content-Type', 'application/json');
            
            // GET /api/mesas
            if (req.url === '/api/mesas' && req.method === 'GET') {
              return res.end(JSON.stringify(mesas));
            }

            // PUT /api/mesas/:id
            if (req.url.startsWith('/api/mesas/') && req.method === 'PUT') {
              const id = parseInt(req.url.split('/').pop() || '0');
              let body = '';
              req.on('data', chunk => body += chunk);
              req.on('end', () => {
                const data = JSON.parse(body);
                const index = mesas.findIndex(m => m.id === id);
                if (index !== -1) {
                  mesas[index] = { ...mesas[index], ...data, updated_at: new Date().toISOString() };
                  res.end(JSON.stringify({ success: true }));
                } else {
                  res.statusCode = 404;
                  res.end(JSON.stringify({ message: 'Mesa não encontrada' }));
                }
              });
              return;
            }

            // GET /api/senhas
            if (req.url === '/api/senhas' && req.method === 'GET') {
              return res.end(JSON.stringify(senhas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())));
            }

            // POST /api/senhas
            if (req.url === '/api/senhas' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => body += chunk);
              req.on('end', () => {
                const novaSenha = { id: Date.now(), ...JSON.parse(body), created_at: new Date().toISOString() };
                senhas.push(novaSenha);
                res.end(JSON.stringify({ success: true }));
              });
              return;
            }

            // DELETE /api/senhas/:id
            if (req.url.startsWith('/api/senhas/') && req.method === 'DELETE') {
              const id = parseInt(req.url.split('/').pop() || '0');
              senhas = senhas.filter(s => s.id !== id);
              return res.end(JSON.stringify({ success: true }));
            }

            // GET /api/stats
            if (req.url === '/api/stats' && req.method === 'GET') {
              const stats = {
                totalMesas: mesas.length,
                livres: mesas.filter(m => m.status === "livre").length,
                reservadas: mesas.filter(m => m.status === "reservada").length,
                pagas: mesas.filter(m => m.status === "paga").length,
                arrecadadoMesas: mesas.filter(m => m.status === "paga").reduce((acc, m) => acc + (m.valor_pago || 0), 0),
                arrecadadoSenhas: senhas.reduce((acc, s) => acc + (s.valor_total || 0), 0),
              };
              return res.end(JSON.stringify({ ...stats, totalGeral: stats.arrecadadoMesas + stats.arrecadadoSenhas }));
            }

            // POST /api/login
            if (req.url === '/api/login' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => body += chunk);
              req.on('end', () => {
                const { username, password } = JSON.parse(body);
                if (username === 'admin' && password === 'admin') {
                  res.end(JSON.stringify({ success: true, user: { username: 'admin' } }));
                } else {
                  res.statusCode = 401;
                  res.end(JSON.stringify({ message: 'Usuário ou senha incorretos' }));
                }
              });
              return;
            }

            next();
          });
        }
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("lions.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS mesas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero INTEGER UNIQUE,
    setor TEXT,
    linha INTEGER,
    coluna INTEGER,
    status TEXT DEFAULT 'livre',
    responsavel TEXT,
    telefone TEXT,
    forma_pagamento TEXT,
    valor_pago REAL DEFAULT 0,
    data_reserva TEXT,
    data_pagamento TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS senhas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    telefone TEXT,
    quantidade INTEGER,
    valor_unitario REAL DEFAULT 40.0,
    valor_total REAL,
    forma_pagamento TEXT,
    data_venda DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );
`);

// Seed Mesas if empty or if we want to force re-seed for the new layout
const checkMesa = db.prepare("SELECT * FROM mesas WHERE numero = 60").get() as any;
if (!checkMesa || checkMesa.setor !== 'direita' || checkMesa.coluna !== 11) {
  db.prepare("DELETE FROM mesas").run();
  const insertMesa = db.prepare(`
    INSERT INTO mesas (numero, setor, linha, coluna) VALUES (?, ?, ?, ?)
  `);

  // Bottom Block (1-40)
  // Rows 0-3, Cols 0-9
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 10; c++) {
      const numero = (r + 1) * 10 - c;
      insertMesa.run(numero, "inferior", r, c);
    }
  }

  // Left Column (41-45)
  // Col 0, Rows 4-8
  for (let r = 0; r < 5; r++) {
    insertMesa.run(41 + r, "esquerda", 4 + r, 0);
  }

  // Right Block (46-60)
  // Cols 9-11, Rows 4-8
  for (let c = 0; c < 3; c++) {
    for (let r = 0; r < 5; r++) {
      const numero = 46 + c * 5 + r;
      insertMesa.run(numero, "direita", 4 + r, 9 + c);
    }
  }
}

// Seed Admin if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM usuarios").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO usuarios (username, password) VALUES (?, ?)").run("admin", "forro2026");
} else {
  // Ensure admin password is updated to the requested one
  db.prepare("UPDATE usuarios SET password = ? WHERE username = ?").run("forro2026", "admin");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/mesas", (req, res) => {
    const mesas = db.prepare("SELECT * FROM mesas ORDER BY numero").all();
    res.json(mesas);
  });

  app.put("/api/mesas/:id", (req, res) => {
    const { id } = req.params;
    const { status, responsavel, telefone, forma_pagamento, valor_pago, data_reserva, data_pagamento } = req.body;
    
    const update = db.prepare(`
      UPDATE mesas SET 
        status = ?, 
        responsavel = ?, 
        telefone = ?, 
        forma_pagamento = ?, 
        valor_pago = ?, 
        data_reserva = ?, 
        data_pagamento = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    update.run(status, responsavel, telefone, forma_pagamento, valor_pago, data_reserva, data_pagamento, id);
    res.json({ success: true });
  });

  app.get("/api/senhas", (req, res) => {
    const senhas = db.prepare("SELECT * FROM senhas ORDER BY created_at DESC").all();
    res.json(senhas);
  });

  app.post("/api/senhas", (req, res) => {
    const { nome, telefone, quantidade, valor_unitario, valor_total, forma_pagamento } = req.body;
    const insert = db.prepare(`
      INSERT INTO senhas (nome, telefone, quantidade, valor_unitario, valor_total, forma_pagamento)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insert.run(nome, telefone, quantidade, valor_unitario, valor_total, forma_pagamento);
    res.json({ success: true });
  });

  app.delete("/api/senhas/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM senhas WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/stats", (req, res) => {
    const totalMesas = db.prepare("SELECT COUNT(*) as count FROM mesas").get() as any;
    const livres = db.prepare("SELECT COUNT(*) as count FROM mesas WHERE status = 'livre'").get() as any;
    const reservadas = db.prepare("SELECT COUNT(*) as count FROM mesas WHERE status = 'reservada'").get() as any;
    const pagas = db.prepare("SELECT COUNT(*) as count FROM mesas WHERE status = 'paga'").get() as any;
    
    const arrecadadoMesas = db.prepare("SELECT SUM(valor_pago) as total FROM mesas WHERE status = 'paga'").get() as any;
    const arrecadadoSenhas = db.prepare("SELECT SUM(valor_total) as total FROM senhas").get() as any;

    res.json({
      totalMesas: totalMesas.count,
      livres: livres.count,
      reservadas: reservadas.count,
      pagas: pagas.count,
      arrecadadoMesas: arrecadadoMesas.total || 0,
      arrecadadoSenhas: arrecadadoSenhas.total || 0,
      totalGeral: (arrecadadoMesas.total || 0) + (arrecadadoSenhas.total || 0)
    });
  });

  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM usuarios WHERE username = ? AND password = ?").get(username, password);
    if (user) {
      res.json({ success: true, user: { username: (user as any).username } });
    } else {
      res.status(401).json({ success: false, message: "Credenciais inválidas" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

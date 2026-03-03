import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Client Initialization
const supabaseUrl = "https://wcruelvxcdatzhiftklx.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcnVlbHZ4Y2RhdHpoaWZ0a2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NDA1MzAsImV4cCI6MjA4ODAxNjUzMH0.fZS5PDYaslW-60tHd_DtkVRc4f4Qwk5pehLwaotUEY4";

const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(express.json());

// Função de inicialização do banco (Seeding)
async function seedDatabase() {
  try {
    const { count: mesaCount, error: countError } = await supabase.from("mesas").select("*", { count: "exact", head: true });
    
    if (countError) {
      console.error("[server] Erro ao acessar tabela mesas:", countError.message);
      return;
    }

    if (mesaCount === 0) {
      console.log("[server] Criando mesas iniciais...");
      const mesasToInsert = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 10; c++) {
          mesasToInsert.push({
            numero: (r + 1) * 10 - c,
            setor: "inferior",
            linha: r,
            coluna: c,
            status: "livre"
          });
        }
      }
      for (let r = 0; r < 5; r++) {
        mesasToInsert.push({ numero: 41 + r, setor: "esquerda", linha: 4 + r, coluna: 0, status: "livre" });
      }
      for (let c = 0; c < 3; c++) {
        for (let r = 0; r < 5; r++) {
          mesasToInsert.push({ numero: 46 + c * 5 + r, setor: "direita", linha: 4 + r, coluna: 9 + c, status: "livre" });
        }
      }
      await supabase.from("mesas").insert(mesasToInsert);
    }

    const { data: users } = await supabase.from("usuarios").select("*").eq("username", "admin");
    if (!users || users.length === 0) {
      console.log("[server] Criando usuário admin padrão...");
      await supabase.from("usuarios").insert([{ username: "admin", password: "forro2026" }]);
    }
  } catch (err) {
    console.error("[server] Erro crítico no seeding:", err);
  }
}

// API Routes
app.get("/api/mesas", async (req, res) => {
  const { data, error } = await supabase.from("mesas").select("*").order("numero", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put("/api/mesas/:id", async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from("mesas").update({ ...req.body, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.get("/api/senhas", async (req, res) => {
  const { data, error } = await supabase.from("senhas").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/senhas", async (req, res) => {
  const { error } = await supabase.from("senhas").insert([req.body]);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/api/senhas/:id", async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from("senhas").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.get("/api/stats", async (req, res) => {
  const { data: mesas } = await supabase.from("mesas").select("status, valor_pago");
  const { data: senhas } = await supabase.from("senhas").select("valor_total");
  const stats = {
    totalMesas: mesas?.length || 0,
    livres: mesas?.filter(m => m.status === "livre").length || 0,
    reservadas: mesas?.filter(m => m.status === "reservada").length || 0,
    pagas: mesas?.filter(m => m.status === "paga").length || 0,
    arrecadadoMesas: mesas?.filter(m => m.status === "paga").reduce((acc, m) => acc + (m.valor_pago || 0), 0) || 0,
    arrecadadoSenhas: senhas?.reduce((acc, s) => acc + (s.valor_total || 0), 0) || 0,
  };
  res.json({ ...stats, totalGeral: stats.arrecadadoMesas + stats.arrecadadoSenhas });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Usuário e senha são obrigatórios" });
  }

  try {
    // Tenta o login
    const { data, error } = await supabase
      .from("usuarios")
      .select("username")
      .eq("username", username.trim())
      .eq("password", password.trim())
      .maybeSingle();

    if (error) {
      return res.status(500).json({ success: false, message: `Erro Supabase: ${error.message}` });
    }

    if (!data) {
      // Se não encontrou o usuário, verifica se a tabela está vazia
      const { count } = await supabase.from("usuarios").select("*", { count: 'exact', head: true });
      
      if (count === 0) {
        // Se estiver vazia, cria o admin e tenta logar de novo
        await supabase.from("usuarios").insert([{ username: "admin", password: "forro2026" }]);
        if (username.trim() === "admin" && password.trim() === "forro2026") {
          return res.json({ success: true, user: { username: "admin" } });
        }
      }
      
      return res.status(401).json({ success: false, message: "Usuário ou senha incorretos" });
    }

    res.json({ success: true, user: { username: data.username } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Erro Interno: ${err.message}` });
  }
});

// Servir arquivos estáticos em produção
if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
  app.use(express.static(path.resolve(__dirname, "dist")));
}

// Inicialização local
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const startLocalServer = async () => {
    await seedDatabase();
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  };
  startLocalServer();
}

export default app;
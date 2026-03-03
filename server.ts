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

async function seedDatabase() {
  try {
    console.log("[server] Verificando banco de dados...");
    
    // Verificar mesas
    const { count: mesaCount } = await supabase.from("mesas").select("*", { count: "exact", head: true });
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

    // Verificar usuário admin - Usando select normal para evitar erros de single()
    const { data: users } = await supabase.from("usuarios").select("*").eq("username", "admin");
    if (!users || users.length === 0) {
      console.log("[server] Criando usuário admin padrão...");
      await supabase.from("usuarios").insert([{ username: "admin", password: "forro2026" }]);
    }
    
    console.log("[server] Banco de dados pronto.");
  } catch (err) {
    console.error("[server] Erro no seeding:", err);
  }
}

app.use(express.json());
app.use(express.static(path.resolve(__dirname, "public")));

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
  console.log(`[server] Tentativa de login para: ${username}`);
  
  // Garantir que o seed rodou (importante para Vercel Serverless)
  await seedDatabase();

  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("username", username.trim())
    .eq("password", password.trim());

  if (error) {
    console.error("[server] Erro na consulta de login:", error);
    return res.status(500).json({ success: false, message: "Erro no banco de dados: " + error.message });
  }

  if (!data || data.length === 0) {
    console.log("[server] Login falhou: usuário ou senha incorretos");
    return res.status(401).json({ success: false, message: "Credenciais inválidas" });
  }

  console.log("[server] Login bem-sucedido!");
  res.json({ success: true, user: { username: data[0].username } });
});

// Inicialização
const startServer = async () => {
  await seedDatabase();
  
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
};

startServer();

export default app;
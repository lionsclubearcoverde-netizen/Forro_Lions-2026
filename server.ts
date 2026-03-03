import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Client Initialization
const supabaseUrl = "https://wcruelvxcdatzhiftklx.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcnVlbHZ4Y2RhdHpoaWZ0a2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NDA1MzAsImV4cCI6MjA4ODAxNjUzMH0.fZS5PDYaslW-60tHd_DtkVRc4f4Qwk5pehLwaotUEY4";
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = 3000;

async function seedDatabase() {
  try {
    // Check if mesas exist
    const { count: mesaCount, error: mesaError } = await supabase.from("mesas").select("*", { count: "exact", head: true });
    
    if (mesaError) {
      console.error("[server] Erro ao verificar tabela mesas:", mesaError.message);
      return;
    }

    if (mesaCount === 0) {
      console.log("[server] Populando mesas iniciais...");
      const mesasToInsert = [];
      
      // Bottom Block (1-40)
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

      // Left Column (41-45)
      for (let r = 0; r < 5; r++) {
        mesasToInsert.push({
          numero: 41 + r,
          setor: "esquerda",
          linha: 4 + r,
          coluna: 0,
          status: "livre"
        });
      }

      // Right Block (46-60)
      for (let c = 0; c < 3; c++) {
        for (let r = 0; r < 5; r++) {
          mesasToInsert.push({
            numero: 46 + c * 5 + r,
            setor: "direita",
            linha: 4 + r,
            coluna: 9 + c,
            status: "livre"
          });
        }
      }

      await supabase.from("mesas").insert(mesasToInsert);
      console.log("[server] Mesas criadas com sucesso.");
    }

    // Seed Admin if empty
    const { count: userCount, error: userError } = await supabase.from("usuarios").select("*", { count: "exact", head: true });
    if (!userError && userCount === 0) {
      console.log("[server] Criando usuário admin padrão...");
      await supabase.from("usuarios").insert([{ username: "admin", password: "forro2026" }]);
    }
  } catch (err) {
    console.error("[server] Erro inesperado no seeding:", err);
  }
}

async function startServer() {
  app.use(express.json());

  // Seed database on startup
  seedDatabase().catch(console.error);

  // API Routes
  app.get("/api/mesas", async (req, res) => {
    const { data, error } = await supabase.from("mesas").select("*").order("numero", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.put("/api/mesas/:id", async (req, res) => {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase.from("mesas").update(updateData).eq("id", id);
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
    const { data: mesas, error: mesaError } = await supabase.from("mesas").select("status, valor_pago");
    const { data: senhas, error: senhaError } = await supabase.from("senhas").select("valor_total");

    if (mesaError || senhaError) {
      return res.status(500).json({ error: mesaError?.message || senhaError?.message });
    }

    const stats = {
      totalMesas: mesas?.length || 0,
      livres: mesas?.filter(m => m.status === "livre").length || 0,
      reservadas: mesas?.filter(m => m.status === "reservada").length || 0,
      pagas: mesas?.filter(m => m.status === "paga").length || 0,
      arrecadadoMesas: mesas?.filter(m => m.status === "paga").reduce((acc, m) => acc + (m.valor_pago || 0), 0) || 0,
      arrecadadoSenhas: senhas?.reduce((acc, s) => acc + (s.valor_total || 0), 0) || 0,
    };

    res.json({
      ...stats,
      totalGeral: stats.arrecadadoMesas + stats.arrecadadoSenhas
    });
  });

  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (error) {
      console.error("[server] Erro de login:", error.message);
      return res.status(401).json({ success: false, message: "Credenciais inválidas" });
    }

    if (data) {
      res.json({ success: true, user: { username: data.username } });
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

export default app;
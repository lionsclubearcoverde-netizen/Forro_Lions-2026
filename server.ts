import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Client Initialization
const supabaseUrl = process.env.SUPABASE_URL || "https://wcruelvxcdatzhiftklx.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
  if (!supabaseKey) {
    console.warn("SUPABASE_ANON_KEY is missing. Database seeding skipped.");
    return;
  }

  try {
    // Check if mesas exist
    const { count: mesaCount, error: mesaError } = await supabase.from("mesas").select("*", { count: "exact", head: true });
    
    if (mesaError) {
      console.error("Error checking mesas table:", mesaError.message);
      if (mesaError.code === 'PGRST116' || mesaError.message.includes('relation "mesas" does not exist')) {
        console.error("The 'mesas' table does not exist in Supabase. Please run the SQL setup script.");
      }
      return;
    }

    if (mesaCount === 0) {
      console.log("Seeding mesas to Supabase...");
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
    }

    // Seed Admin if empty
    const { count: userCount, error: userError } = await supabase.from("usuarios").select("*", { count: "exact", head: true });
    if (!userError && userCount === 0) {
      await supabase.from("usuarios").insert([{ username: "admin", password: "forro2026" }]);
    }
  } catch (err) {
    console.error("Unexpected error during seeding:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

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
    
    if (!supabaseKey) {
      return res.status(500).json({ 
        success: false, 
        message: "Configuração do Supabase incompleta. Verifique o segredo SUPABASE_ANON_KEY." 
      });
    }

    // Check if any users exist at all
    const { count, error: countError } = await supabase.from("usuarios").select("*", { count: "exact", head: true });
    
    if (!countError && count === 0) {
      console.log("No users found. Creating default admin...");
      await supabase.from("usuarios").insert([{ username: "admin", password: "forro2026" }]);
    }

    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (error) {
      console.error("Login error:", error.message);
      if (error.message.includes('relation "usuarios" does not exist')) {
        return res.status(500).json({ 
          success: false, 
          message: "A tabela 'usuarios' não existe no Supabase. Por favor, execute o script SQL de configuração." 
        });
      }
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

  if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default (req: any, res: any) => {
  // This is for Vercel serverless function compatibility
  // We'll need a slightly different structure for Vercel, 
  // but this is a good start for local/standard environments.
};

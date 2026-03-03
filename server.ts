import express from "express";
import { createClient } from "@supabase/supabase-js";

// Supabase Client
const supabaseUrl = "https://wcruelvxcdatzhiftklx.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcnVlbHZ4Y2RhdHpoaWZ0a2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NDA1MzAsImV4cCI6MjA4ODAxNjUzMH0.fZS5PDYaslW-60tHd_DtkVRc4f4Qwk5pehLwaotUEY4";

const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.get("/api/mesas", async (req, res) => {
  try {
    const { data, error } = await supabase.from("mesas").select("*").order("numero", { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/mesas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("mesas").update({ ...req.body, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/senhas", async (req, res) => {
  try {
    const { data, error } = await supabase.from("senhas").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/senhas", async (req, res) => {
  try {
    const { error } = await supabase.from("senhas").insert([req.body]);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.delete("/api/senhas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("senhas").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    const { data: mesas, error: e1 } = await supabase.from("mesas").select("status, valor_pago");
    const { data: senhas, error: e2 } = await supabase.from("senhas").select("valor_total");
    if (e1 || e2) throw (e1 || e2);

    const stats = {
      totalMesas: mesas?.length || 0,
      livres: mesas?.filter(m => m.status === "livre").length || 0,
      reservadas: mesas?.filter(m => m.status === "reservada").length || 0,
      pagas: mesas?.filter(m => m.status === "paga").length || 0,
      arrecadadoMesas: mesas?.filter(m => m.status === "paga").reduce((acc, m) => acc + (m.valor_pago || 0), 0) || 0,
      arrecadadoSenhas: senhas?.reduce((acc, s) => acc + (s.valor_total || 0), 0) || 0,
    };
    res.json({ ...stats, totalGeral: stats.arrecadadoMesas + stats.arrecadadoSenhas });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const { data, error } = await supabase
      .from("usuarios")
      .select("username")
      .eq("username", username?.trim())
      .eq("password", password?.trim())
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(401).json({ message: "Usuário ou senha incorretos" });

    res.json({ success: true, user: { username: data.username } });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default app;
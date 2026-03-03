import { createClient } from '@supabase/supabase-js';

// Na Vercel, você deve adicionar estas duas chaves exatamente com estes nomes:
// VITE_SUPABASE_URL
// VITE_SUPABASE_ANON_KEY

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://wcruelvxcdatzhiftklx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcnVlbHZ4Y2RhdHpoaWZ0a2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NDA1MzAsImV4cCI6MjA4ODAxNjUzMH0.fZS5PDYaslW-60tHd_DtkVRc4f4Qwk5pehLwaotUEY4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
import { createClient } from "@supabase/supabase-js";
import { env } from "../../lib/env";

/**
 * Cliente Supabase único para toda a aplicação.
 * As credenciais vêm exclusivamente das variáveis de ambiente (validadas em src/lib/env.ts).
 * Nunca faça commit de chaves reais — use .env.local (ignorado pelo git).
 */
export const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

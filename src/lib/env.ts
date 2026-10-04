import { z } from "zod";

/**
 * Validação centralizada das variáveis de ambiente.
 * O app falha cedo (com mensagem clara) se a configuração estiver incompleta,
 * em vez de silenciosamente usar chaves hardcoded inseguras.
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url("VITE_SUPABASE_URL deve ser uma URL válida."),
  VITE_SUPABASE_ANON_KEY: z
    .string()
    .min(20, "VITE_SUPABASE_ANON_KEY parece inválida (muito curta)."),
});

const parsed = envSchema.safeParse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  // Não derruba o app: loga com instruções claras. As chamadas ao Supabase
  // falharão com "Failed to fetch", e a tela de login exibirá a mensagem traduzida.
  console.error(
    `[Configuração inválida] Defina as variáveis abaixo em .env.local (dev) ou no painel de Environment Variables do seu host (Vercel/Netlify) e refaça o deploy:\n${issues}\n\nConsulte .env.example para referência.`
  );
}

export const env = {
  VITE_SUPABASE_URL: parsed.data?.VITE_SUPABASE_URL ?? "",
  VITE_SUPABASE_ANON_KEY: parsed.data?.VITE_SUPABASE_ANON_KEY ?? "",
};

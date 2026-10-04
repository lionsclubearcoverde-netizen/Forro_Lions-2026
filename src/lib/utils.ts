/**
 * Utilitários puros (sem dependência de DOM/React) — fáceis de testar.
 */

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata um número como moeda brasileira. Ex.: 1500 -> "R$ 1.500,00" */
export function formatBRL(value: number): string {
  return brlFormatter.format(Number.isFinite(value) ? value : 0);
}

/** Arredonda para 2 casas decimais evitando erros de ponto flutuante. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Converte uma string digitada em número seguro (aceita vírgula decimal). */
export function parseDecimal(input: string): number {
  const cleaned = input.trim().replace(/\s/g, "");
  if (!cleaned) return 0;
  // Aceita "150,00" e "150.00"; remove separador de milhar quando usa vírgula decimal.
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/** Retorna o percentual inteiro de `part` sobre `total`, protegido contra divisão por zero. */
export function percentage(part: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round((part / total) * 100);
}

/** Aplica máscara progressiva de telefone brasileiro: (00) 00000-0000 */
export function maskPhone(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Normaliza espaços de um nome digitado (trim + espaços duplos). */
export function normalizeName(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

/**
 * Traduz erros conhecidos do Supabase Auth / rede para mensagens claras em português.
 * "Failed to fetch" quase sempre é problema de configuração ou de rede — nunca credencial errada.
 */
export function translateAuthError(raw: string): string {
  const msg = raw.toLowerCase();

  if (msg.includes("failed to fetch") || msg.includes("networkerror") || msg.includes("load failed")) {
    return (
      "Não foi possível conectar ao servidor (Failed to fetch). Causas mais comuns:\n" +
      "1) A chave do Supabase não está configurada no ambiente de deploy — defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente (Vercel → Settings → Environment Variables) e faça novo deploy.\n" +
      "2) Sem conexão com a internet ou o acesso ao domínio *.supabase.co está bloqueado na sua rede.\n" +
      "3) URL do projeto incorreta."
    );
  }
  if (msg.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos. Verifique os dados digitados.";
  }
  if (msg.includes("email not confirmed")) {
    return "Este e-mail ainda não foi confirmado. Verifique sua caixa de entrada.";
  }
  if (msg.includes("rate limit") || msg.includes("too many requests")) {
    return "Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.";
  }
  if (msg.includes("fetch is not enabled") || msg.includes("unsupported")) {
    return "Navegador desatualizado. Atualize o navegador e tente novamente.";
  }
  return raw;
}

/** Extrai uma mensagem legível de qualquer erro lançado (Error, PostgrestError, string...). */
export function getErrorMessage(err: unknown, fallback = "Ocorreu um erro inesperado."): string {
  if (err instanceof Error) return translateAuthError(err.message);
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const record = err as Record<string, unknown>;
    for (const key of ["message", "error_description", "error"]) {
      const msg = record[key];
      if (typeof msg === "string" && msg) return msg;
    }
  }
  return fallback;
}

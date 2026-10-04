import { useState } from "react";
import type { FormEvent } from "react";
import { motion } from "motion/react";
import { KeyRound, LogIn, Eye, EyeOff, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import Field, { inputClass } from "./ui/Field";
import BrandMark from "./ui/BrandMark";
import Spinner from "./ui/Spinner";
import { getErrorMessage } from "../lib/utils";
import { EVENTO_NOME, ORGANIZACAO } from "../constants";

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      const message = getErrorMessage(err, "Credenciais inválidas.");
      toast.error(message, {
        id: "login-error",
        duration: message.includes("conectar") ? 12000 : 5000,
        style: { whiteSpace: "pre-line", maxWidth: "420px" },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-brand-950 p-4">
      {/* Fundo decorativo */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <BrandMark size={64} />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">
            Gestão Lions
          </h1>
          <p className="mt-1 text-sm font-medium text-brand-200">{EVENTO_NOME}</p>
        </div>

        <div className="card overflow-hidden !rounded-3xl">
          <div className="p-7 sm:p-9">
            <div className="mb-7">
              <h2 className="text-lg font-bold text-slate-900">Acesso da organização</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Área restrita à equipe de vendas do {ORGANIZACAO}.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <Field label="E-mail" icon={<KeyRound size={16} />} htmlFor="login-email">
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  className={inputClass}
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              <Field label="Senha" icon={<ShieldCheck size={16} />} htmlFor="login-senha">
                <input
                  id="login-senha"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className={`${inputClass} pr-10`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary min-h-12 w-full text-[15px]"
              >
                {loading ? (
                  <>
                    <Spinner size={18} />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Entrar
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/70 px-7 py-4 text-center">
            <p className="text-xs leading-relaxed text-slate-400">
              Seus dados são protegidos por autenticação Supabase com Row Level Security.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-brand-200/70">
          {ORGANIZACAO} · Sistema interno de gestão de mesas e senhas
        </p>
      </motion.div>
    </div>
  );
}

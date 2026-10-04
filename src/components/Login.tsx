import { useState } from "react";
import type { FormEvent } from "react";
import { motion } from "motion/react";
import { Shield, KeyRound, LogIn, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import Field, { inputClass } from "./ui/Field";
import { getErrorMessage } from "../lib/utils";

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
      toast.error(getErrorMessage(err, "Credenciais inválidas."), { id: "login-error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 sm:p-10">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-100">
                <Shield size={32} />
              </div>
              <h1 className="text-2xl font-black text-gray-900">Gestão Lions</h1>
              <p className="text-gray-500 text-sm mt-1">
                Acesso restrito à organização do evento.
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

              <Field label="Senha" icon={<Shield size={16} />} htmlFor="login-senha">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={18} />
                    Entrar
                  </>
                )}
              </button>
            </form>
          </div>
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Seus dados são protegidos por autenticação Supabase com Row Level Security.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

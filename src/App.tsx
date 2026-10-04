import { useState, useEffect, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ToastProvider from "./components/ToastProvider";
import { api } from "./services/api";
import LoadingState from "./components/ui/LoadingState";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restaura a sessão persistida e acompanha mudanças de estado de auth.
    api.getSession().then((s) => {
      setSession(s);
      setLoading(false);
    });

    const unsubscribe = api.onAuthStateChange((newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogin = useCallback(async (email: string, password: string) => {
    const newSession = await api.login(email, password);
    setSession(newSession);
  }, []);

  const handleLogout = useCallback(() => {
    setSession(null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState label="Verificando sessão..." />
      </div>
    );
  }

  return (
    <>
      {session?.user ? (
        <Dashboard user={session.user} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
      <ToastProvider />
    </>
  );
}

import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { api } from "../services/api";
import type { Stats, AppUser } from "../types";
import MesaMap from "./MesaMap";
import SenhasModule from "./SenhasModule";
import Relatorios from "./Relatorios";
import { MapIcon, Ticket, BarChart3, LogOut, LayoutDashboard } from "lucide-react";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import LoadingState from "./ui/LoadingState";
import ErrorState from "./ui/ErrorState";
import { useRealtime } from "../hooks/useRealtime";
import { formatBRL, percentage, getErrorMessage } from "../lib/utils";

type Tab = "dashboard" | "mapa" | "senhas" | "relatorios";

interface DashboardProps {
  user: AppUser;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getStats();
      setStats(data);
      setStatsError(null);
    } catch (err) {
      setStatsError(getErrorMessage(err));
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Mantém os indicadores atualizados quando qualquer operador altera dados.
  useRealtime("mesas", fetchStats);
  useRealtime("senhas", fetchStats);

  const handleLogout = async () => {
    if (!window.confirm("Deseja realmente sair do sistema?")) return;
    try {
      await api.logout();
      onLogout();
      toast.success("Você saiu do sistema.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao sair."));
    }
  };

  const tabs: Array<{ id: Tab; label: string; icon: ReactNode }> = [
    { id: "dashboard", label: "Visão Geral", icon: <LayoutDashboard size={18} /> },
    { id: "mapa", label: "Mapa de Mesas", icon: <MapIcon size={18} /> },
    { id: "senhas", label: "Venda de Senhas", icon: <Ticket size={18} /> },
    { id: "relatorios", label: "Relatórios", icon: <BarChart3 size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
            L
          </div>
          <h1 className="font-black text-xl tracking-tighter text-gray-900">Gestão Lions</h1>
        </div>

        <nav className="flex-1 space-y-2" aria-label="Navegação principal">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 truncate mb-3" title={user.email ?? ""}>
            {user.email}
          </p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm font-bold transition-colors"
          >
            <LogOut size={18} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Header Mobile */}
      <header className="md:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              L
            </div>
            <span className="font-black text-lg tracking-tighter">Gestão Lions</span>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Sair do sistema"
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <LogOut size={20} />
          </button>
        </div>
        <nav className="flex overflow-x-auto gap-2 pb-1" aria-label="Navegação principal">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto">
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
              <p className="text-gray-500">Acompanhe o desempenho das vendas em tempo real.</p>
            </div>

            {loadingStats ? (
              <LoadingState label="Calculando indicadores..." />
            ) : statsError ? (
              <ErrorState message={statsError} onRetry={fetchStats} />
            ) : stats ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Mesas Livres"
                    value={String(stats.livres)}
                    subtitle={`${percentage(stats.livres, stats.totalMesas)}% do total`}
                    color="green"
                  />
                  <StatCard
                    title="Reservadas"
                    value={String(stats.reservadas)}
                    subtitle={`${percentage(stats.reservadas, stats.totalMesas)}% do total`}
                    color="yellow"
                  />
                  <StatCard
                    title="Pagas"
                    value={String(stats.pagas)}
                    subtitle={`${percentage(stats.pagas, stats.totalMesas)}% do total`}
                    color="blue"
                  />
                  <StatCard
                    title="Arrecadação Total"
                    value={formatBRL(stats.totalGeral)}
                    subtitle={`Mesas: ${formatBRL(stats.arrecadadoMesas)} • Senhas: ${formatBRL(stats.arrecadadoSenhas)}`}
                    color="purple"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">
                      Ocupação de Mesas
                    </h3>
                    <div className="space-y-6">
                      <ProgressBar
                        label="Total Ocupado"
                        value={stats.reservadas + stats.pagas}
                        max={stats.totalMesas}
                        barClass="bg-blue-600"
                      />
                      <ProgressBar
                        label="Disponível"
                        value={stats.livres}
                        max={stats.totalMesas}
                        barClass="bg-green-500"
                      />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">
                      Distribuição Financeira
                    </h3>
                    <div className="space-y-6">
                      <ProgressBar
                        label="Vendas de Mesas"
                        value={Math.round(stats.arrecadadoMesas)}
                        max={Math.max(1, Math.round(stats.totalGeral))}
                        barClass="bg-blue-500"
                        isCurrency
                      />
                      <ProgressBar
                        label="Vendas de Senhas"
                        value={Math.round(stats.arrecadadoSenhas)}
                        max={Math.max(1, Math.round(stats.totalGeral))}
                        barClass="bg-purple-500"
                        isCurrency
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {activeTab === "mapa" && <MesaMap />}
        {activeTab === "senhas" && <SenhasModule />}
        {activeTab === "relatorios" && <Relatorios />}
      </main>
    </div>
  );
}

const CARD_COLORS: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-600",
  yellow: "bg-amber-50 text-amber-600",
  blue: "bg-blue-50 text-blue-600",
  purple: "bg-violet-50 text-violet-600",
};

function StatCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string;
  subtitle?: string;
  color: keyof typeof CARD_COLORS | string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${CARD_COLORS[color]}`}>
          <div className="w-2 h-2 bg-current rounded-full" />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </motion.div>
  );
}

function ProgressBar({
  label,
  value,
  max,
  barClass,
  isCurrency = false,
}: {
  label: string;
  value: number;
  max: number;
  barClass: string;
  isCurrency?: boolean;
}) {
  const pct = percentage(value, max);
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">
          {isCurrency ? formatBRL(value) : `${value} (${pct}%)`}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

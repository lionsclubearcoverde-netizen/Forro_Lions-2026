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
import BrandMark from "./ui/BrandMark";
import ConfirmDialog from "./ui/ConfirmDialog";
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
  const [confirmLogout, setConfirmLogout] = useState(false);

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

  const doLogout = async () => {
    setConfirmLogout(false);
    try {
      await api.logout();
      onLogout();
      toast.success("Você saiu do sistema.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao sair."));
    }
  };

  const tabs: Array<{ id: Tab; label: string; shortLabel: string; icon: ReactNode }> = [
    { id: "dashboard", label: "Visão Geral", shortLabel: "Início", icon: <LayoutDashboard size={18} /> },
    { id: "mapa", label: "Mapa de Mesas", shortLabel: "Mesas", icon: <MapIcon size={18} /> },
    { id: "senhas", label: "Venda de Senhas", shortLabel: "Senhas", icon: <Ticket size={18} /> },
    { id: "relatorios", label: "Relatórios", shortLabel: "Relatos", icon: <BarChart3 size={18} /> },
  ];

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Sidebar Desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200/80 bg-white p-6 md:flex lg:hidden xl:flex">
        <div className="mb-10 mt-1">
          <BrandMark size={40} withWordmark />
        </div>

        <nav className="flex-1 space-y-1.5" aria-label="Navegação principal">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={`flex w-full touch-target items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-brand-50 text-brand-700 shadow-[inset_0_0_0_1px] shadow-brand-100"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className={activeTab === tab.id ? "text-brand-600" : ""}>{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-100 pt-5">
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-black text-brand-700" aria-hidden="true">
              {(user.email ?? "?").slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-700" title={user.email ?? ""}>
                {user.email}
              </p>
              <p className="text-[11px] text-slate-400">Operador autorizado</p>
            </div>
          </div>
          <button
            onClick={() => setConfirmLogout(true)}
            className="btn btn-ghost w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut size={18} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Header Mobile (topo) + Bottom Navigation (celular) */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md md:hidden">
        <BrandMark size={34} withWordmark />
        <button
          onClick={() => setConfirmLogout(true)}
          aria-label="Sair do sistema"
          className="btn btn-ghost h-10 w-10 rounded-full !px-0 text-slate-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={19} />
        </button>
      </header>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={`flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-bold transition-colors ${
              activeTab === tab.id ? "text-brand-700" : "text-slate-400"
            }`}
          >
            <span
              className={`grid h-8 w-14 place-items-center rounded-full transition-colors ${
                activeTab === tab.id ? "bg-brand-100/80" : ""
              }`}
            >
              {tab.icon}
            </span>
            {tab.shortLabel}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:ml-64 md:min-h-dvh md:max-w-none md:pb-10 md:pt-10 lg:px-10 xl:pl-80 xl:pr-12">
        <div className="mx-auto max-w-6xl">
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              <div>
                <h1 className="page-title">Visão Geral</h1>
                <p className="page-subtitle">
                  Acompanhe o desempenho das vendas em tempo real.
                </p>
              </div>

              {loadingStats ? (
                <LoadingState label="Calculando indicadores..." />
              ) : statsError ? (
                <ErrorState message={statsError} onRetry={fetchStats} />
              ) : stats ? (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    <StatCard
                      title="Mesas Livres"
                      value={String(stats.livres)}
                      subtitle={`${percentage(stats.livres, stats.totalMesas)}% do total`}
                      accent="emerald"
                    />
                    <StatCard
                      title="Reservadas"
                      value={String(stats.reservadas)}
                      subtitle={`${percentage(stats.reservadas, stats.totalMesas)}% do total`}
                      accent="amber"
                    />
                    <StatCard
                      title="Pagas"
                      value={String(stats.pagas)}
                      subtitle={`${percentage(stats.pagas, stats.totalMesas)}% do total`}
                      accent="brand"
                    />
                    <StatCard
                      title="Arrecadação"
                      value={formatBRL(stats.totalGeral)}
                      subtitle={`Mesas ${formatBRL(stats.arrecadadoMesas)} · Senhas ${formatBRL(stats.arrecadadoSenhas)}`}
                      accent="violet"
                      compactValue
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                    <section className="card p-6">
                      <h3 className="section-label mb-6">Ocupação de Mesas</h3>
                      <div className="space-y-6">
                        <ProgressBar
                          label="Total Ocupado"
                          value={stats.reservadas + stats.pagas}
                          max={stats.totalMesas}
                          barClass="bg-gradient-to-r from-brand-500 to-brand-700"
                        />
                        <ProgressBar
                          label="Disponível"
                          value={stats.livres}
                          max={stats.totalMesas}
                          barClass="bg-gradient-to-r from-emerald-400 to-emerald-600"
                        />
                      </div>
                    </section>

                    <section className="card p-6">
                      <h3 className="section-label mb-6">Distribuição Financeira</h3>
                      <div className="space-y-6">
                        <ProgressBar
                          label="Vendas de Mesas"
                          value={Math.round(stats.arrecadadoMesas)}
                          max={Math.max(1, Math.round(stats.totalGeral))}
                          barClass="bg-gradient-to-r from-brand-400 to-brand-600"
                          isCurrency
                        />
                        <ProgressBar
                          label="Vendas de Senhas"
                          value={Math.round(stats.arrecadadoSenhas)}
                          max={Math.max(1, Math.round(stats.totalGeral))}
                          barClass="bg-gradient-to-r from-violet-400 to-violet-600"
                          isCurrency
                        />
                      </div>
                    </section>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {activeTab === "mapa" && <MesaMap />}
          {activeTab === "senhas" && <SenhasModule />}
          {activeTab === "relatorios" && <Relatorios />}
        </div>
      </main>

      {confirmLogout && (
        <ConfirmDialog
          title="Sair do sistema?"
          message="Você precisará informar suas credenciais novamente para voltar a operar as vendas."
          confirmLabel="Sair"
          tone="danger"
          onConfirm={doLogout}
          onCancel={() => setConfirmLogout(false)}
        />
      )}
    </div>
  );
}

const CARD_ACCENTS: Record<string, { iconBg: string; iconText: string; ring: string }> = {
  emerald: { iconBg: "bg-emerald-50", iconText: "text-emerald-600", ring: "ring-emerald-100" },
  amber: { iconBg: "bg-amber-50", iconText: "text-amber-600", ring: "ring-amber-100" },
  brand: { iconBg: "bg-brand-50", iconText: "text-brand-600", ring: "ring-brand-100" },
  violet: { iconBg: "bg-violet-50", iconText: "text-violet-600", ring: "ring-violet-100" },
};

function StatCard({
  title,
  value,
  subtitle,
  accent,
  compactValue = false,
}: {
  title: string;
  value: string;
  subtitle?: string;
  accent: keyof typeof CARD_ACCENTS;
  /** Reduz o tamanho do número quando o texto é longo (valores em R$ no celular). */
  compactValue?: boolean;
}) {
  const a = CARD_ACCENTS[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4 sm:p-6"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">
          {title}
        </h3>
        <div
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${a.iconBg} ${a.iconText} ring-1 ${a.ring}`}
        >
          <div className="h-2 w-2 rounded-full bg-current" />
        </div>
      </div>
      <div
        className={`font-display font-bold tracking-tight text-slate-900 tabular-nums ${
          compactValue ? "text-lg leading-tight sm:text-2xl" : "text-2xl sm:text-3xl"
        }`}
      >
        {value}
      </div>
      {subtitle && (
        <p className="mt-1 truncate text-[11px] text-slate-400 sm:text-xs" title={subtitle}>
          {subtitle}
        </p>
      )}
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

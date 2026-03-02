import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Stats } from "../types";
import { Users, Ticket, DollarSign, CheckCircle, Clock, LayoutGrid, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

const StatCard = ({ title, value, icon: Icon, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between"
  >
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={24} />
    </div>
  </motion.div>
);

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getStats();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) return <div className="flex items-center justify-center h-64">Carregando estatísticas...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Visão geral das vendas e ocupação do evento.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Mesas"
          value={stats.totalMesas}
          icon={LayoutGrid}
          color="bg-blue-50 text-blue-600"
          delay={0.1}
        />
        <StatCard
          title="Mesas Livres"
          value={stats.livres}
          icon={Clock}
          color="bg-green-50 text-green-600"
          delay={0.2}
        />
        <StatCard
          title="Mesas Reservadas"
          value={stats.reservadas}
          icon={Clock}
          color="bg-yellow-50 text-yellow-600"
          delay={0.3}
        />
        <StatCard
          title="Mesas Pagas"
          value={stats.pagas}
          icon={CheckCircle}
          color="bg-indigo-50 text-indigo-600"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-blue-600 p-8 rounded-3xl shadow-lg shadow-blue-200 text-white col-span-1 md:col-span-2 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-4 opacity-80">
              <TrendingUp size={20} />
              <span className="text-sm font-medium uppercase tracking-wider">Arrecadação Total</span>
            </div>
            <h2 className="text-5xl font-black">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.totalGeral)}
            </h2>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
              <p className="text-xs opacity-70 mb-1">Total com Mesas</p>
              <p className="text-xl font-bold">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.arrecadadoMesas)}
              </p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
              <p className="text-xs opacity-70 mb-1">Total com Senhas</p>
              <p className="text-xl font-bold">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.arrecadadoSenhas)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6">Distribuição de Ocupação</h3>
          <div className="flex-1 flex flex-col justify-center space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Pagas</span>
                <span className="font-bold text-indigo-600">{Math.round((stats.pagas / stats.totalMesas) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${(stats.pagas / stats.totalMesas) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Reservadas</span>
                <span className="font-bold text-yellow-600">{Math.round((stats.reservadas / stats.totalMesas) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div className="bg-yellow-500 h-full transition-all duration-1000" style={{ width: `${(stats.reservadas / stats.totalMesas) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Livres</span>
                <span className="font-bold text-green-600">{Math.round((stats.livres / stats.totalMesas) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full transition-all duration-1000" style={{ width: `${(stats.livres / stats.totalMesas) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

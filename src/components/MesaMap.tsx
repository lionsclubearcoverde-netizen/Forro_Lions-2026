import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../services/api";
import type { Mesa } from "../types";
import { toPng } from "html-to-image";
import { Download, Search, Users } from "lucide-react";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import MesaModal from "./MesaModal";
import LoadingState from "./ui/LoadingState";
import ErrorState from "./ui/ErrorState";
import StatusBadge from "./ui/StatusBadge";
import Spinner from "./ui/Spinner";
import { useRealtime } from "../hooks/useRealtime";
import { STATUS_STYLES, VALOR_MESA } from "../constants";
import { formatBRL, getErrorMessage } from "../lib/utils";

export default function MesaMap() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [exporting, setExporting] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const fetchMesas = useCallback(async () => {
    try {
      const data = await api.getMesas();
      setMesas(data);
      setError(null);
      // Mantém o modal sincronizado com a versão mais recente da mesa.
      setSelectedMesa((current) =>
        current ? (data.find((m) => m.id === current.id) ?? null) : null
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMesas();
  }, [fetchMesas]);

  // Sincronização em tempo real entre operadores.
  useRealtime("mesas", fetchMesas);

  const handleExport = async () => {
    if (mapRef.current === null || exporting) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(mapRef.current, {
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `mapa-mesas-lions-${new Date().toISOString().split("T")[0]}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Mapa exportado!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao exportar mapa."));
    } finally {
      setExporting(false);
    }
  };

  const term = searchTerm.trim().toLowerCase();
  const matchCount = term
    ? mesas.filter(
        (m) =>
          m.responsavel?.toLowerCase().includes(term) ||
          m.numero.toString() === term.replace(/\D/g, "")
      ).length
    : 0;

  const renderMesa = (mesa: Mesa) => {
    const isHighlighted =
      term.length > 0 &&
      ((mesa.responsavel?.toLowerCase().includes(term)) ||
        mesa.numero.toString().includes(term));
    const style = STATUS_STYLES[mesa.status];

    return (
      <motion.button
        key={mesa.id}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setSelectedMesa(mesa)}
        aria-label={`Mesa ${mesa.numero}, status ${style.label}${mesa.responsavel ? `, responsável ${mesa.responsavel}` : ""}`}
        className={`relative grid h-11 w-11 place-items-center rounded-[12px] font-display text-sm font-bold shadow-md transition-all sm:h-12 sm:w-12 sm:text-base ${
          isHighlighted
            ? "z-10 scale-110 ring-2 ring-slate-900 ring-offset-2"
            : "ring-1 ring-black/5"
        }`}
        style={{ backgroundColor: style.solid, color: style.textOn }}
      >
        {mesa.numero}
        {mesa.status !== "livre" && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-white text-[9px] font-black shadow ring-1 ring-black/5"
            style={{ color: style.solid }}
          >
            {mesa.status === "paga" ? "✓" : "R"}
          </span>
        )}
      </motion.button>
    );
  };

  if (loading) return <LoadingState label="Carregando mapa..." />;
  if (error) return <ErrorState message={error} onRetry={fetchMesas} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="page-title">Mapa de Mesas</h1>
          <p className="page-subtitle">
            Gestão visual conforme o layout oficial do evento. Toque em uma mesa para gerenciar.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative min-w-0 grow sm:w-64 sm:grow-0">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="search"
              inputMode="search"
              aria-label="Buscar mesa por nome ou número"
              placeholder="Buscar nome ou nº..."
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn btn-outline shrink-0"
          >
            {exporting ? <Spinner size={16} /> : <Download size={17} />}
            <span className="hidden sm:inline">Exportar PNG</span>
            <span className="sm:hidden">PNG</span>
          </button>
        </div>
      </div>

      {term && (
        <p className="text-sm font-medium text-brand-700" role="status">
          {matchCount > 0
            ? `${matchCount} mesa${matchCount > 1 ? "s" : ""} encontrada${matchCount > 1 ? "s" : ""} para "${searchTerm}".`
            : `Nenhuma mesa encontrada para "${searchTerm}".`}
        </p>
      )}

      {/* Resumo rápido por status (mobile-friendly) */}
      <div className="grid grid-cols-3 gap-3">
        {(["livre", "reservada", "paga"] as const).map((st) => (
          <div key={st} className="card flex flex-col items-center gap-1 p-3">
            <StatusBadge status={st} />
            <span className="font-display text-xl font-bold tabular-nums text-slate-900">
              {mesas.filter((m) => m.status === st).length}
            </span>
          </div>
        ))}
      </div>

      <div className="card overflow-x-auto p-3 sm:p-8">
        <div ref={mapRef} className="min-w-[760px] p-2 sm:min-w-[1000px]">
          <div className="grid grid-cols-12 grid-rows-10 gap-2">
            {/* Palco - Topo */}
            <div className="col-start-2 col-end-10 row-start-1 flex items-center justify-center rounded-xl border border-slate-300 bg-gradient-to-b from-slate-100 to-slate-50 font-display text-2xl font-extrabold uppercase tracking-[0.3em] text-slate-700 sm:text-3xl">
              Palco
            </div>

            {/* Salão de Dança - Centro */}
            <div className="col-start-2 col-end-10 row-start-2 row-end-7 flex items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/60">
              <span className="flex items-center gap-3 px-4 text-center font-display font-black uppercase tracking-[0.25em] text-slate-300">
                <Users size={28} strokeWidth={1.5} aria-hidden="true" />
                Salão de Dança
              </span>
            </div>

            {/* Mesas */}
            {mesas.map((mesa) => (
              <div
                key={mesa.id}
                style={{
                  gridColumnStart: mesa.coluna + 1,
                  gridRowStart: 10 - mesa.linha,
                }}
                className="flex items-center justify-center"
              >
                {renderMesa(mesa)}
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-slate-100 pt-6">
            {(["livre", "reservada", "paga"] as const).map((st) => (
              <div key={st} className="flex items-center gap-2">
                <span
                  className="h-3.5 w-3.5 rounded-md ring-1 ring-black/10"
                  style={{ backgroundColor: STATUS_STYLES[st].solid }}
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold text-slate-600">
                  {STATUS_STYLES[st].label}
                  {st === "livre" && ` (${formatBRL(VALOR_MESA)})`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedMesa && (
        <MesaModal
          mesa={selectedMesa}
          onClose={() => setSelectedMesa(null)}
          onUpdate={fetchMesas}
        />
      )}
    </div>
  );
}

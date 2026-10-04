import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../services/api";
import type { Mesa } from "../types";
import { toPng } from "html-to-image";
import { Download, Info, Search } from "lucide-react";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import MesaModal from "./MesaModal";
import LoadingState from "./ui/LoadingState";
import ErrorState from "./ui/ErrorState";
import { useRealtime } from "../hooks/useRealtime";
import { STATUS_COLORS, VALOR_MESA } from "../constants";
import { formatBRL, getErrorMessage } from "../lib/utils";

export default function MesaMap() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
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
    if (mapRef.current === null) return;
    try {
      const dataUrl = await toPng(mapRef.current, {
        cacheBust: true,
        backgroundColor: "#f9fafb",
      });
      const link = document.createElement("a");
      link.download = `mapa-mesas-lions-${new Date().toISOString().split("T")[0]}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Mapa exportado!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao exportar mapa."));
    }
  };

  const renderMesa = (mesa: Mesa) => {
    const term = searchTerm.trim().toLowerCase();
    const isHighlighted =
      term.length > 0 &&
      ((mesa.responsavel?.toLowerCase().includes(term)) ||
        mesa.numero.toString().includes(term));

    return (
      <motion.button
        key={mesa.id}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setSelectedMesa(mesa)}
        aria-label={`Mesa ${mesa.numero}, status ${mesa.status}${mesa.responsavel ? `, responsável ${mesa.responsavel}` : ""}`}
        className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-white font-bold shadow-sm transition-all border-2 ${
          isHighlighted ? "border-black scale-110 z-10" : "border-transparent"
        }`}
        style={{ backgroundColor: STATUS_COLORS[mesa.status] }}
      >
        <span className="text-sm sm:text-base">{mesa.numero}</span>
        {mesa.status !== "livre" && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
            <Info size={10} className="text-gray-600" />
          </div>
        )}
      </motion.button>
    );
  };

  if (loading) return <LoadingState label="Carregando mapa..." />;
  if (error) return <ErrorState message={error} onRetry={fetchMesas} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapa de Mesas</h1>
          <p className="text-gray-500">Gestão visual conforme o layout oficial do evento.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={18}
            />
            <input
              type="search"
              aria-label="Buscar mesa por nome ou número"
              placeholder="Buscar por nome ou nº..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download size={18} />
            Exportar PNG
          </button>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
        <div ref={mapRef} className="min-w-[1000px] p-4">
          <div className="grid grid-cols-12 grid-rows-10 gap-2">
            {/* Palco - Topo */}
            <div className="col-start-2 col-end-10 row-start-1 flex items-center justify-center border-2 border-black font-bold text-3xl uppercase tracking-widest bg-gray-50 rounded-xl">
              Palco
            </div>

            {/* Salão de Dança - Centro */}
            <div className="col-start-2 col-end-10 row-start-2 row-end-7 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
              <span className="text-gray-400 font-black text-xl uppercase tracking-widest text-center px-4">
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

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 border-t border-gray-100 pt-8">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: STATUS_COLORS.livre }}
                aria-hidden="true"
              ></div>
              <span className="text-sm font-medium text-gray-600">
                Livre ({formatBRL(VALOR_MESA)})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: STATUS_COLORS.reservada }}
                aria-hidden="true"
              ></div>
              <span className="text-sm font-medium text-gray-600">Reservada</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: STATUS_COLORS.paga }}
                aria-hidden="true"
              ></div>
              <span className="text-sm font-medium text-gray-600">Paga</span>
            </div>
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

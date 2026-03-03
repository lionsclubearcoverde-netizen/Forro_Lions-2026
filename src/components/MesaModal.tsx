import { useState } from "react";
import { Mesa, MesaStatus } from "../types";
import { api } from "../services/api";
import { VALOR_MESA, FORMAS_PAGAMENTO, STATUS_COLORS } from "../constants";
import { X, User, Phone, CreditCard, DollarSign, Calendar, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import toast from "react-hot-toast";

interface MesaModalProps {
  mesa: Mesa;
  onClose: () => void;
  onUpdate: () => void;
}

export default function MesaModal({ mesa, onClose, onUpdate }: MesaModalProps) {
  const [status, setStatus] = useState<MesaStatus>(mesa.status);
  const [responsavel, setResponsavel] = useState(mesa.responsavel || "");
  const [telefone, setTelefone] = useState(mesa.telefone || "");
  const [formaPagamento, setFormaPagamento] = useState(mesa.forma_pagamento || FORMAS_PAGAMENTO[0]);
  const [valorPago, setValorPago] = useState(mesa.valor_pago || VALOR_MESA);
  const [loading, setLoading] = useState(false);

  const handleSave = async (newStatus: MesaStatus) => {
    if (!responsavel && newStatus !== "livre") {
      toast.error("O nome do responsável é obrigatório.");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Salvando alterações...");
    try {
      const now = new Date().toISOString();
      const updateData: Partial<Mesa> = {
        status: newStatus,
        responsavel: newStatus === "livre" ? "" : responsavel,
        telefone: newStatus === "livre" ? "" : telefone,
        forma_pagamento: newStatus === "paga" ? formaPagamento : "",
        valor_pago: newStatus === "paga" ? valorPago : 0,
        data_reserva: newStatus === "reservada" ? now : mesa.data_reserva,
        data_pagamento: newStatus === "paga" ? now : mesa.data_pagamento,
      };

      await api.updateMesa(mesa.id, updateData);
      toast.success(`Mesa ${mesa.numero} atualizada com sucesso!`, { id: loadingToast });
      onUpdate();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar mesa.", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleLiberar = async () => {
    if (confirm("Deseja realmente liberar esta mesa? Todos os dados serão limpos.")) {
      await handleSave("livre");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl"
              style={{ backgroundColor: STATUS_COLORS[status] }}
            >
              {mesa.numero}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Mesa {mesa.numero}</h2>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Setor: {mesa.setor}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Responsável</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="Nome completo"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Forma de Pagamento</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm appearance-none bg-white"
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                >
                  {FORMAS_PAGAMENTO.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Valor</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="number"
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={valorPago}
                  onChange={(e) => setValorPago(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {mesa.data_reserva && (
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-xl">
              <Calendar size={14} />
              <span>Reservada em: {new Date(mesa.data_reserva).toLocaleString("pt-BR")}</span>
            </div>
          )}
          {mesa.data_pagamento && (
            <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-3 rounded-xl font-medium">
              <CheckCircle size={14} />
              <span>Paga em: {new Date(mesa.data_pagamento).toLocaleString("pt-BR")}</span>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 flex flex-wrap gap-3 justify-between">
          <button
            onClick={handleLiberar}
            disabled={loading || status === "livre"}
            className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
          >
            Liberar Mesa
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => handleSave("reservada")}
              disabled={loading || status === "paga"}
              className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-yellow-100 disabled:opacity-50"
            >
              Reservar
            </button>
            <button
              onClick={() => handleSave("paga")}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-blue-100 disabled:opacity-50"
            >
              Confirmar Pagamento
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
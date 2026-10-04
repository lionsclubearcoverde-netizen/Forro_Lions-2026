import { useState } from "react";
import type { Mesa, MesaStatus } from "../types";
import { api } from "../services/api";
import { VALOR_MESA, FORMAS_PAGAMENTO, STATUS_COLORS } from "../constants";
import { User, Phone, CreditCard, DollarSign, Calendar, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import Modal, { ModalCloseButton } from "./ui/Modal";
import Field, { inputClass, selectClass } from "./ui/Field";
import { formatBRL, maskPhone, normalizeName, parseDecimal, getErrorMessage } from "../lib/utils";

interface MesaModalProps {
  mesa: Mesa;
  onClose: () => void;
  onUpdate: () => void;
}

export default function MesaModal({ mesa, onClose, onUpdate }: MesaModalProps) {
  const [status, setStatus] = useState<MesaStatus>(mesa.status);
  const [responsavel, setResponsavel] = useState(mesa.responsavel || "");
  const [telefone, setTelefone] = useState(mesa.telefone || "");
  const [formaPagamento, setFormaPagamento] = useState<string>(
    mesa.forma_pagamento || FORMAS_PAGAMENTO[0]
  );
  const [valorPago, setValorPago] = useState<string>(String(mesa.valor_pago || VALOR_MESA));
  const [loading, setLoading] = useState(false);

  async function save(newStatus: MesaStatus) {
    if (newStatus !== "livre" && !normalizeName(responsavel)) {
      toast.error("O nome do responsável é obrigatório.");
      return;
    }
    if (newStatus === "paga" && parseDecimal(valorPago) <= 0) {
      toast.error("Informe um valor válido para o pagamento.");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Salvando alterações...");
    try {
      const now = new Date().toISOString();
      const updateData: Partial<Mesa> = {
        status: newStatus,
        responsavel: newStatus === "livre" ? "" : normalizeName(responsavel),
        telefone: newStatus === "livre" ? "" : telefone,
        forma_pagamento: newStatus === "paga" ? formaPagamento : "",
        valor_pago: newStatus === "paga" ? parseDecimal(valorPago) : 0,
        data_reserva: newStatus === "reservada" ? now : mesa.data_reserva,
        data_pagamento: newStatus === "paga" ? now : mesa.data_pagamento,
      };

      await api.updateMesa(mesa.id, updateData);
      toast.success(`Mesa ${mesa.numero} atualizada com sucesso!`, { id: loadingToast });
      onUpdate();
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao atualizar mesa."), { id: loadingToast });
    } finally {
      setLoading(false);
    }
  }

  const handleLiberar = () => {
    if (window.confirm(`Deseja realmente liberar a mesa ${mesa.numero}? Todos os dados serão limpos.`)) {
      save("livre");
    }
  };

  return (
    <Modal onClose={onClose} labelledBy="mesa-modal-title">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl"
            style={{ backgroundColor: STATUS_COLORS[status] }}
            aria-hidden="true"
          >
            {mesa.numero}
          </div>
          <div>
            <h2 id="mesa-modal-title" className="text-xl font-bold text-gray-900">
              Mesa {mesa.numero}
            </h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">
              Setor: {mesa.setor}
            </p>
          </div>
        </div>
        <ModalCloseButton onClose={onClose} />
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Responsável" icon={<User size={16} />} htmlFor="mesa-responsavel">
            <input
              id="mesa-responsavel"
              type="text"
              className={inputClass}
              placeholder="Nome completo"
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              maxLength={120}
            />
          </Field>
          <Field label="Telefone" icon={<Phone size={16} />} htmlFor="mesa-telefone">
            <input
              id="mesa-telefone"
              type="tel"
              inputMode="numeric"
              className={inputClass}
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={(e) => setTelefone(maskPhone(e.target.value))}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Forma de Pagamento" icon={<CreditCard size={16} />} htmlFor="mesa-pagamento">
            <select
              id="mesa-pagamento"
              className={selectClass}
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
            >
              {FORMAS_PAGAMENTO.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Valor" icon={<DollarSign size={16} />} htmlFor="mesa-valor">
            <input
              id="mesa-valor"
              type="text"
              inputMode="decimal"
              className={inputClass}
              value={valorPago}
              onChange={(e) => setValorPago(e.target.value)}
              onBlur={() => setValorPago(parseDecimal(valorPago).toFixed(2))}
            />
          </Field>
        </div>

        {mesa.data_reserva && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-xl">
            <Calendar size={14} aria-hidden="true" />
            <span>Reservada em: {new Date(mesa.data_reserva).toLocaleString("pt-BR")}</span>
          </div>
        )}
        {mesa.data_pagamento && (
          <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-3 rounded-xl font-medium">
            <CheckCircle size={14} aria-hidden="true" />
            <span>
              Paga em: {new Date(mesa.data_pagamento).toLocaleString("pt-BR")} ({formatBRL(mesa.valor_pago)})
            </span>
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
            onClick={() => save("reservada")}
            disabled={loading || status === "paga"}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-yellow-100 disabled:opacity-50"
          >
            Reservar
          </button>
          <button
            onClick={() => save("paga")}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-blue-100 disabled:opacity-50"
          >
            Confirmar Pagamento
          </button>
        </div>
      </div>
    </Modal>
  );
}

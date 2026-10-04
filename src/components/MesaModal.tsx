import { useState } from "react";
import type { Mesa, MesaStatus } from "../types";
import { api } from "../services/api";
import { VALOR_MESA, FORMAS_PAGAMENTO, STATUS_STYLES } from "../constants";
import { User, Phone, CreditCard, DollarSign, Calendar, CheckCircle, X } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "./ui/Modal";
import Field, { inputClass, selectClass } from "./ui/Field";
import ConfirmDialog from "./ui/ConfirmDialog";
import StatusBadge from "./ui/StatusBadge";
import Spinner from "./ui/Spinner";
import { formatBRL, maskPhone, normalizeName, parseDecimal, getErrorMessage } from "../lib/utils";

interface MesaModalProps {
  mesa: Mesa;
  onClose: () => void;
  onUpdate: () => void;
}

export default function MesaModal({ mesa, onClose, onUpdate }: MesaModalProps) {
  const [status] = useState<MesaStatus>(mesa.status);
  const [responsavel, setResponsavel] = useState(mesa.responsavel || "");
  const [telefone, setTelefone] = useState(mesa.telefone || "");
  const [formaPagamento, setFormaPagamento] = useState<string>(
    mesa.forma_pagamento || FORMAS_PAGAMENTO[0]
  );
  const [valorPago, setValorPago] = useState<string>(String(mesa.valor_pago || VALOR_MESA));
  const [loading, setLoading] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);

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
      if (newStatus === "livre") onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao atualizar mesa."), { id: loadingToast });
    } finally {
      setLoading(false);
    }
  }

  const style = STATUS_STYLES[status];

  return (
    <>
      <Modal onClose={onClose} labelledBy="mesa-modal-title">
        {/* Cabeçalho com cor de status */}
        <div
          className="flex items-center justify-between gap-3 px-6 py-5"
          style={{ backgroundColor: style.solid }}
        >
          <div className="flex items-center gap-4 text-white">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 font-display text-xl font-black ring-1 ring-white/25 backdrop-blur-sm">
              {mesa.numero}
            </div>
            <div>
              <h2 id="mesa-modal-title" className="font-display text-lg font-bold leading-tight">
                Mesa {mesa.numero}
              </h2>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/75">
                Setor {mesa.setor} · {style.label}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                inputMode="tel"
                className={inputClass}
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={(e) => setTelefone(maskPhone(e.target.value))}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-100">
              <Calendar size={14} aria-hidden="true" className="text-slate-400" />
              <span>Reservada em: {new Date(mesa.data_reserva).toLocaleString("pt-BR")}</span>
            </div>
          )}
          {mesa.data_pagamento && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100">
              <CheckCircle size={14} aria-hidden="true" />
              <span>
                Paga em: {new Date(mesa.data_pagamento).toLocaleString("pt-BR")} ·{" "}
                {formatBRL(mesa.valor_pago)}
              </span>
            </div>
          )}
        </div>

        {/* Ações fixas na base do painel (alcançáveis no celular) */}
        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/95 p-4 backdrop-blur-sm sm:px-6">
          <button
            onClick={() => setConfirmRelease(true)}
            disabled={loading || status === "livre"}
            className="btn min-h-11 bg-transparent text-red-600 hover:bg-red-50 sm:min-h-10"
          >
            Liberar Mesa
          </button>
          <div className="flex flex-1 gap-3 sm:flex-none">
            <button
              onClick={() => save("reservada")}
              disabled={loading || status === "paga"}
              className="btn btn-outline flex-1 border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100 sm:px-6"
            >
              {loading ? <Spinner size={16} /> : null}
              Reservar
            </button>
            <button
              onClick={() => save("paga")}
              disabled={loading}
              className="btn btn-primary flex-1 sm:px-6"
            >
              {loading ? <Spinner size={16} /> : <CheckCircle size={16} />}
              Confirmar Pagto.
            </button>
          </div>
        </div>
      </Modal>

      {confirmRelease && (
        <ConfirmDialog
          title={`Liberar mesa ${mesa.numero}?`}
          message={
            <>
              Todos os dados da reserva/pagamento serão apagados e a mesa voltará a ficar{" "}
              <StatusBadge status="livre" /> .
            </>
          }
          confirmLabel="Liberar Mesa"
          tone="danger"
          onConfirm={() => save("livre")}
          onCancel={() => setConfirmRelease(false)}
        />
      )}
    </>
  );
}

// Import separado para manter o ícone do botão fechar visível acima.
import { X } from "lucide-react";

import { useState, useEffect, useCallback } from "react";
import type { FormEvent } from "react";
import { api } from "../services/api";
import type { Senha } from "../types";
import { VALOR_SENHA, FORMAS_PAGAMENTO } from "../constants";
import { Ticket, Plus, Trash2, Search, User, Phone, CreditCard, Users, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import Modal, { ModalCloseButton } from "./ui/Modal";
import ConfirmDialog from "./ui/ConfirmDialog";
import Spinner from "./ui/Spinner";
import Field, { inputClass, selectClass } from "./ui/Field";
import LoadingState from "./ui/LoadingState";
import ErrorState from "./ui/ErrorState";
import { useRealtime } from "../hooks/useRealtime";
import { formatBRL, maskPhone, normalizeName, getErrorMessage } from "../lib/utils";

const PAGE_SIZE = 25;

export default function SenhasModule() {
  const [senhas, setSenhas] = useState<Senha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [senhaToDelete, setSenhaToDelete] = useState<Senha | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [formaPagamento, setFormaPagamento] = useState<string>(FORMAS_PAGAMENTO[0]);

  const fetchSenhas = useCallback(async () => {
    try {
      const data = await api.getSenhas();
      setSenhas(data);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSenhas();
  }, [fetchSenhas]);

  useRealtime("senhas", fetchSenhas);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const nomeLimpo = normalizeName(nome);
    if (!nomeLimpo || quantidade < 1) {
      toast.error("Informe o nome e uma quantidade válida.");
      return;
    }

    setSaving(true);
    const loadingToast = toast.loading("Registrando venda...");
    try {
      await api.addSenha({
        nome: nomeLimpo,
        telefone,
        quantidade,
        forma_pagamento: formaPagamento,
      });
      toast.success("Venda registrada com sucesso!", { id: loadingToast });
      setIsAdding(false);
      setNome("");
      setTelefone("");
      setQuantidade(1);
      setFormaPagamento(FORMAS_PAGAMENTO[0]);
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao salvar venda."), { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (senha: Senha) => {
    setSenhaToDelete(null);
    const loadingToast = toast.loading("Excluindo venda...");
    try {
      await api.deleteSenha(senha.id);
      toast.success("Venda excluída.", { id: loadingToast });
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao excluir venda."), { id: loadingToast });
    }
  };

  const term = searchTerm.trim().toLowerCase();
  const filteredSenhas = senhas.filter(
    (s) =>
      s.nome.toLowerCase().includes(term) ||
      s.telefone.replace(/\D/g, "").includes(term.replace(/\D/g, ""))
  );
  const visibleSenhas = filteredSenhas.slice(0, visibleCount);

  const totalArrecadado = senhas.reduce((acc, s) => acc + s.valor_total, 0);
  const totalQuantidade = senhas.reduce((acc, s) => acc + s.quantidade, 0);

  if (loading) return <LoadingState label="Carregando senhas..." />;
  if (error) return <ErrorState message={error} onRetry={fetchSenhas} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="page-title">Venda de Senhas</h1>
          <p className="page-subtitle">
            Gestão de ingressos avulsos — {formatBRL(VALOR_SENHA)} por senha.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="btn btn-primary min-h-12 px-6 sm:min-h-10"
        >
          <Plus size={18} />
          Nova Venda
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-1 space-y-4 lg:space-y-6">
          <div className="card p-5 lg:p-6">
            <h3 className="section-label mb-4 lg:mb-6">Resumo de Senhas</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-brand-50 p-4 ring-1 ring-brand-100">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
                    <Ticket size={18} />
                  </div>
                  <span className="text-sm font-semibold text-brand-800">Total Vendidas</span>
                </div>
                <span className="font-display text-xl font-bold tabular-nums text-brand-900">{totalQuantidade}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-600 text-white">
                    <Wallet size={18} />
                  </div>
                  <span className="text-sm font-semibold text-emerald-800">Total Arrecadado</span>
                </div>
                <span className="font-display text-lg font-bold tabular-nums text-emerald-900 lg:text-xl">
                  {formatBRL(totalArrecadado)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={18}
              />
              <input
                type="search"
                aria-label="Buscar venda por nome ou telefone"
                placeholder="Buscar por nome ou tel..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <caption className="sr-only">Lista de vendas de senhas</caption>
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                    <th scope="col" className="px-6 py-4">Comprador</th>
                    <th scope="col" className="px-6 py-4">Qtd</th>
                    <th scope="col" className="px-6 py-4">Valor Total</th>
                    <th scope="col" className="px-6 py-4">Pagamento</th>
                    <th scope="col" className="px-6 py-4">Data</th>
                    <th scope="col" className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence mode="popLayout">
                    {visibleSenhas.map((s) => (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{s.nome}</div>
                          <div className="text-xs text-gray-500">{s.telefone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                            {s.quantidade}x
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {formatBRL(s.valor_total)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{s.forma_pagamento}</td>
                        <td className="px-6 py-4 text-xs text-gray-400">
                          {new Date(s.data_venda).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(s)}
                            aria-label={`Excluir venda de ${s.nome}`}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {filteredSenhas.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                        Nenhuma venda encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredSenhas.length > visibleCount && (
              <div className="p-4 border-t border-gray-100 text-center">
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  Mostrar mais ({filteredSenhas.length - visibleCount} restantes)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <Modal onClose={() => setIsAdding(false)} labelledBy="nova-senha-title">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                  <Ticket size={24} />
                </div>
                <h2 id="nova-senha-title" className="text-xl font-bold text-gray-900">
                  Nova Venda de Senha
                </h2>
              </div>
              <ModalCloseButton onClose={() => setIsAdding(false)} />
            </div>

            <form onSubmit={handleAdd} className="p-6 space-y-6">
              <div className="space-y-4">
                <Field label="Nome do Comprador" icon={<User size={16} />} htmlFor="senha-nome">
                  <input
                    id="senha-nome"
                    type="text"
                    required
                    maxLength={120}
                    className={inputClass}
                    placeholder="Nome completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </Field>
                <Field label="Telefone" icon={<Phone size={16} />} htmlFor="senha-telefone">
                  <input
                    id="senha-telefone"
                    type="tel"
                    inputMode="numeric"
                    className={inputClass}
                    placeholder="(00) 00000-0000"
                    value={telefone}
                    onChange={(e) => setTelefone(maskPhone(e.target.value))}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Quantidade" icon={<Plus size={16} />} htmlFor="senha-qtd">
                    <input
                      id="senha-qtd"
                      type="number"
                      min="1"
                      max="100"
                      required
                      className={`${inputClass} pl-10`}
                      value={quantidade}
                      onChange={(e) => setQuantidade(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                    />
                  </Field>
                  <Field label="Forma de Pagamento" icon={<CreditCard size={16} />} htmlFor="senha-pagamento">
                    <select
                      id="senha-pagamento"
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
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-bold uppercase">Total a Pagar</p>
                  <p className="text-3xl font-black text-blue-900">
                    {formatBRL(quantidade * VALOR_SENHA)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-600 font-medium">{quantidade}x Senhas</p>
                  <p className="text-xs text-blue-600 font-medium">{formatBRL(VALOR_SENHA)} cada</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-blue-100"
                >
                  {saving ? "Salvando..." : "Confirmar Venda"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect } from "react";
import React from "react";
import { api } from "../services/api";
import { Senha } from "../types";
import { VALOR_SENHA, FORMAS_PAGAMENTO } from "../constants";
import { Ticket, Plus, Trash2, Search, User, Phone, CreditCard, DollarSign, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function SenhasModule() {
  const [senhas, setSenhas] = useState<Senha[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [formaPagamento, setFormaPagamento] = useState(FORMAS_PAGAMENTO[0]);

  const fetchSenhas = async () => {
    try {
      const data = await api.getSenhas();
      setSenhas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSenhas();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || quantidade < 1) return;

    try {
      await api.addSenha({
        nome,
        telefone,
        quantidade,
        valor_unitario: VALOR_SENHA,
        valor_total: quantidade * VALOR_SENHA,
        forma_pagamento: formaPagamento,
      });
      setIsAdding(false);
      setNome("");
      setTelefone("");
      setQuantidade(1);
      fetchSenhas();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar venda.");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Deseja realmente excluir esta venda?")) {
      try {
        await api.deleteSenha(id);
        fetchSenhas();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredSenhas = senhas.filter(s => 
    s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.telefone.includes(searchTerm)
  );

  const totalArrecadado = senhas.reduce((acc, s) => acc + s.valor_total, 0);
  const totalQuantidade = senhas.reduce((acc, s) => acc + s.quantidade, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Venda de Senhas Individuais</h1>
          <p className="text-gray-500">Gestão de ingressos avulsos (R$ 40,00 cada).</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 transition-all"
        >
          <Plus size={20} />
          Nova Venda
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Statistics */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Resumo de Senhas</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-lg"><Ticket size={18} /></div>
                  <span className="text-sm font-medium text-blue-700">Total Vendidas</span>
                </div>
                <span className="text-xl font-black text-blue-900">{totalQuantidade}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 text-white rounded-lg"><DollarSign size={18} /></div>
                  <span className="text-sm font-medium text-green-700">Total Arrecadado</span>
                </div>
                <span className="text-xl font-black text-green-900">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalArrecadado)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nome ou tel..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Sales List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                    <th className="px-6 py-4">Comprador</th>
                    <th className="px-6 py-4">Qtd</th>
                    <th className="px-6 py-4">Valor Total</th>
                    <th className="px-6 py-4">Pagamento</th>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence mode="popLayout">
                    {filteredSenhas.map((s) => (
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
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(s.valor_total)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{s.forma_pagamento}</td>
                        <td className="px-6 py-4 text-xs text-gray-400">
                          {new Date(s.data_venda).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {filteredSenhas.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                        Nenhuma venda encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                    <Ticket size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Nova Venda de Senha</h2>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome do Comprador</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        required
                        className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="Nome completo"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Quantidade</label>
                      <div className="relative">
                        <Plus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="number"
                          min="1"
                          required
                          className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          value={quantidade}
                          onChange={(e) => setQuantidade(Number(e.target.value))}
                        />
                      </div>
                    </div>
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
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-600 font-bold uppercase">Total a Pagar</p>
                    <p className="text-3xl font-black text-blue-900">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(quantidade * VALOR_SENHA)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-blue-600 font-medium">{quantidade}x Senhas</p>
                    <p className="text-xs text-blue-600 font-medium">R$ {VALOR_SENHA.toFixed(2)} cada</p>
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
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-blue-100"
                  >
                    Confirmar Venda
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function X({ size, className }: { size: number, className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

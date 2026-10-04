import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { api } from "../services/api";
import type { Mesa, Senha } from "../types";
import { Download, Copy, ChevronDown, ChevronUp, X } from "lucide-react";
import toast from "react-hot-toast";
import LoadingState from "./ui/LoadingState";
import ErrorState from "./ui/ErrorState";
import { useRealtime } from "../hooks/useRealtime";
import { formatBRL, getErrorMessage } from "../lib/utils";
import {
  exportSimplePdf,
  exportRelatorioGeral,
  buildWhatsAppMesasOcupadas,
  mesasOcupadasRows,
  mesasReservadasRows,
  mesasPagasRows,
  senhasRows,
} from "../lib/reports";

async function loadLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch("/assets/logo.png");
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function Relatorios() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [senhas, setSenhas] = useState<Senha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [mesasData, senhasData] = await Promise.all([
        api.getMesas(),
        api.getSenhas(),
      ]);
      setMesas(mesasData);
      setSenhas(senhasData);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    loadLogoBase64().then(setLogoBase64);
  }, [fetchData]);

  useRealtime("mesas", fetchData);
  useRealtime("senhas", fetchData);

  const mesasReservadas = mesas.filter((m) => m.status === "reservada");
  const mesasPagas = mesas.filter((m) => m.status === "paga");
  const mesasOcupadas = [...mesasReservadas, ...mesasPagas].sort(
    (a, b) => a.numero - b.numero
  );
  const totalArrecadado =
    mesasPagas.reduce((acc, m) => acc + (m.valor_pago || 0), 0) +
    senhas.reduce((acc, s) => acc + (s.valor_total || 0), 0);

  const handleExportMesasOcupadas = () =>
    exportSimplePdf({
      title: "Relação de Mesas (Reservadas e Pagas)",
      headers: ["Nome", "Número", "Situação"],
      rows: mesasOcupadasRows(mesasOcupadas),
      filename: "relacao-mesas-ocupadas",
      logoBase64,
    });

  const handleCopyToWhatsApp = async () => {
    if (mesasOcupadas.length === 0) {
      toast.error("Não há mesas ocupadas para copiar.");
      return;
    }
    try {
      await navigator.clipboard.writeText(buildWhatsAppMesasOcupadas(mesasOcupadas));
      toast.success("Relação copiada para o WhatsApp!");
    } catch {
      toast.error("Erro ao copiar para a área de transferência.");
    }
  };

  const handleExportMesasReservadas = () =>
    exportSimplePdf({
      title: "Relatório de Mesas Reservadas",
      headers: ["Mesa", "Responsável", "Telefone", "Data Reserva"],
      rows: mesasReservadasRows(mesasReservadas),
      filename: "mesas-reservadas",
      logoBase64,
    });

  const handleExportMesasPagas = () =>
    exportSimplePdf({
      title: "Relatório de Mesas Pagas",
      headers: ["Mesa", "Responsável", "Telefone", "Valor", "Pagamento", "Data Pagamento"],
      rows: mesasPagasRows(mesasPagas),
      filename: "mesas-pagas",
      logoBase64,
    });

  const handleExportSenhas = () =>
    exportSimplePdf({
      title: "Relatório de Venda de Senhas",
      headers: ["Nome", "Telefone", "Qtd", "Total", "Pagamento", "Data Venda"],
      rows: senhasRows(senhas),
      filename: "venda-senhas",
      logoBase64,
    });

  const handleExportRelatorioGeral = () => {
    exportRelatorioGeral({
      reservadas: mesasReservadas,
      pagas: mesasPagas,
      senhas,
      totalArrecadado,
      logoBase64,
    });
    toast.success("Relatório geral gerado!");
  };

  if (loading) return <LoadingState label="Carregando dados..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const ReportSection = ({
    title,
    count,
    onPdf,
    onCopy,
    sectionId,
    children,
  }: {
    title: string;
    count: number;
    onPdf: () => void;
    onCopy?: () => void;
    sectionId: string;
    children: ReactNode;
  }) => {
    const isExpanded = expandedSection === sectionId;

    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          onClick={() => setExpandedSection(isExpanded ? null : sectionId)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setExpandedSection(isExpanded ? null : sectionId);
            }
          }}
          className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div
              className={`p-2 rounded-xl transition-colors ${
                isExpanded ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"
              }`}
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{count} registros encontrados</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
            {onCopy && (
              <button
                onClick={onCopy}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl text-sm font-bold hover:bg-green-100 transition-colors"
              >
                <Copy size={18} />
                Copiar WhatsApp
              </button>
            )}
            <button
              onClick={onPdf}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
            >
              <Download size={18} />
              Baixar PDF
            </button>
          </div>
        </div>

        <div
          className={`border-t border-gray-100 p-6 bg-gray-50/50 ${
            isExpanded ? "block" : "hidden print:block"
          }`}
        >
          <div className="flex justify-between items-center mb-4 print:hidden">
            <h4 className="font-bold text-gray-700">Visualização de Dados</h4>
            <button
              onClick={() => setExpandedSection(null)}
              aria-label="Fechar visualização"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            {children}
          </div>
        </div>
      </div>
    );
  };

  const thClass =
    "px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios e Exportação</h1>
        <p className="text-gray-500">Gere documentos para conferência e prestação de contas.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-blue-900">Relatório Geral Completo</h3>
            <p className="text-sm text-blue-600">
              Consolidado de mesas (reservadas/pagas) e senhas em um único documento.
            </p>
            <p className="text-sm font-bold text-blue-900 mt-2">
              Total arrecadado: {formatBRL(totalArrecadado)}
            </p>
          </div>
          <button
            onClick={handleExportRelatorioGeral}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            <Download size={20} />
            Gerar Relatório Geral
          </button>
        </div>

        <ReportSection
          title="Relação de Ocupação (Nome, Nº, Situação)"
          count={mesasOcupadas.length}
          onPdf={handleExportMesasOcupadas}
          onCopy={handleCopyToWhatsApp}
          sectionId="ocupacao"
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className={thClass}>Nome</th>
                <th scope="col" className={thClass}>Número</th>
                <th scope="col" className={thClass}>Situação</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mesasOcupadas.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {m.responsavel || "N/A"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{m.numero}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        m.status === "paga" ? "bg-blue-50 text-blue-600" : "bg-yellow-50 text-yellow-600"
                      }`}
                    >
                      {m.status === "paga" ? "Paga" : "Reservada"}
                    </span>
                  </td>
                </tr>
              ))}
              {mesasOcupadas.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-400 italic">
                    Nenhuma mesa ocupada encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ReportSection>

        <ReportSection
          title="Mesas Reservadas (Detalhado)"
          count={mesasReservadas.length}
          onPdf={handleExportMesasReservadas}
          sectionId="reservadas"
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className={thClass}>Mesa</th>
                <th scope="col" className={thClass}>Responsável</th>
                <th scope="col" className={thClass}>Telefone</th>
                <th scope="col" className={thClass}>Data Reserva</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mesasReservadas.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{m.numero}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{m.responsavel || "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{m.telefone || "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {m.data_reserva ? new Date(m.data_reserva).toLocaleDateString("pt-BR") : "-"}
                  </td>
                </tr>
              ))}
              {mesasReservadas.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">
                    Nenhuma mesa reservada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ReportSection>

        <ReportSection
          title="Mesas Pagas (Detalhado)"
          count={mesasPagas.length}
          onPdf={handleExportMesasPagas}
          sectionId="pagas"
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className={thClass}>Mesa</th>
                <th scope="col" className={thClass}>Responsável</th>
                <th scope="col" className={thClass}>Valor</th>
                <th scope="col" className={thClass}>Pagamento</th>
                <th scope="col" className={thClass}>Data</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mesasPagas.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{m.numero}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{m.responsavel || "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formatBRL(m.valor_pago)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{m.forma_pagamento || "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {m.data_pagamento ? new Date(m.data_pagamento).toLocaleDateString("pt-BR") : "-"}
                  </td>
                </tr>
              ))}
              {mesasPagas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">
                    Nenhuma mesa paga.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ReportSection>

        <ReportSection
          title="Venda de Senhas"
          count={senhas.length}
          onPdf={handleExportSenhas}
          sectionId="senhas"
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className={thClass}>Nome</th>
                <th scope="col" className={thClass}>Qtd</th>
                <th scope="col" className={thClass}>Total</th>
                <th scope="col" className={thClass}>Pagamento</th>
                <th scope="col" className={thClass}>Data</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {senhas.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{s.nome}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{s.quantidade}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formatBRL(s.valor_total)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{s.forma_pagamento}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {new Date(s.data_venda).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
              {senhas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">
                    Nenhuma venda de senha registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ReportSection>
      </div>
    </div>
  );
}

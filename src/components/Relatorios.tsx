import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Mesa, Senha } from "../types";
import { FileText, Download, Printer, File as FilePdf, ChevronDown, ChevronUp, X } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function Relatorios() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [senhas, setSenhas] = useState<Senha[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mesasData, senhasData] = await Promise.all([
          api.getMesas(),
          api.getSenhas()
        ]);
        setMesas(mesasData);
        setSenhas(senhasData);

        // Preload logo for PDF
        const response = await fetch("/assets/logo.png");
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoBase64(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const mesasReservadas = mesas.filter(m => m.status === "reservada");
  const mesasPagas = mesas.filter(m => m.status === "paga");

  const exportPDF = (title: string, headers: string[], data: any[][], filename: string) => {
    const doc = new jsPDF();
    
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 170, 10, 25, 25);
    }

    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 28);
    
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 40,
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235] }
    });
    
    doc.save(`${filename}.pdf`);
  };

  const handleExportMesasReservadas = () => {
    const data = mesasReservadas.map(m => ({
      Mesa: m.numero,
      Responsável: m.responsavel,
      Telefone: m.telefone,
      "Data Reserva": m.data_reserva ? new Date(m.data_reserva).toLocaleDateString("pt-BR") : ""
    }));

    exportPDF(
      "Relatório de Mesas Reservadas",
      ["Mesa", "Responsável", "Telefone", "Data Reserva"],
      data.map(d => Object.values(d)),
      "mesas-reservadas"
    );
  };

  const handleExportMesasPagas = () => {
    const data = mesasPagas.map(m => ({
      Mesa: m.numero,
      Responsável: m.responsavel,
      Telefone: m.telefone,
      Valor: m.valor_pago,
      Pagamento: m.forma_pagamento,
      "Data Pagamento": m.data_pagamento ? new Date(m.data_pagamento).toLocaleDateString("pt-BR") : ""
    }));

    exportPDF(
      "Relatório de Mesas Pagas",
      ["Mesa", "Responsável", "Telefone", "Valor", "Pagamento", "Data Pagamento"],
      data.map(d => Object.values(d)),
      "mesas-pagas"
    );
  };

  const handleExportSenhas = () => {
    const data = senhas.map(s => ({
      Nome: s.nome,
      Telefone: s.telefone,
      Qtd: s.quantidade,
      Total: s.valor_total,
      Pagamento: s.forma_pagamento,
      "Data Venda": new Date(s.data_venda).toLocaleDateString("pt-BR")
    }));

    exportPDF(
      "Relatório de Venda de Senhas",
      ["Nome", "Telefone", "Qtd", "Total", "Pagamento", "Data Venda"],
      data.map(d => Object.values(d)),
      "venda-senhas"
    );
  };

  const handleExportRelatorioGeral = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleString("pt-BR");
    
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 170, 10, 25, 25);
    }

    doc.setFontSize(18);
    doc.text("Relatório Geral do Evento", 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${now}`, 14, 28);

    let currentY = 40;

    // Section 1: Mesas Reservadas
    doc.setFontSize(14);
    doc.text("1. Mesas Reservadas", 14, currentY);
    autoTable(doc, {
      head: [["Mesa", "Responsável", "Telefone", "Data Reserva"]],
      body: mesasReservadas.map(m => [
        m.numero,
        m.responsavel || "-",
        m.telefone || "-",
        m.data_reserva ? new Date(m.data_reserva).toLocaleDateString("pt-BR") : "-"
      ]),
      startY: currentY + 5,
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235] }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Section 2: Mesas Pagas
    doc.setFontSize(14);
    doc.text("2. Mesas Pagas", 14, currentY);
    autoTable(doc, {
      head: [["Mesa", "Responsável", "Telefone", "Valor", "Pagamento", "Data Pagamento"]],
      body: mesasPagas.map(m => [
        m.numero,
        m.responsavel || "-",
        m.telefone || "-",
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(m.valor_pago),
        m.forma_pagamento || "-",
        m.data_pagamento ? new Date(m.data_pagamento).toLocaleDateString("pt-BR") : "-"
      ]),
      startY: currentY + 5,
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235] }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Section 3: Venda de Senhas
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(14);
    doc.text("3. Venda de Senhas", 14, currentY);
    autoTable(doc, {
      head: [["Nome", "Telefone", "Qtd", "Total", "Pagamento", "Data Venda"]],
      body: senhas.map(s => [
        s.nome,
        s.telefone || "-",
        s.quantidade,
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(s.valor_total),
        s.forma_pagamento,
        new Date(s.data_venda).toLocaleDateString("pt-BR")
      ]),
      startY: currentY + 5,
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save("relatorio-geral-lions.pdf");
  };

  if (loading) return <div className="flex items-center justify-center h-64">Carregando dados...</div>;

  const ReportSection = ({ title, count, onPdf, sectionId, children }: any) => {
    const isExpanded = expandedSection === sectionId;

    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
        <div 
          className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setExpandedSection(isExpanded ? null : sectionId)}
        >
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-xl transition-colors ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{count} registros encontrados</p>
            </div>
          </div>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onPdf}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
            >
              <FilePdf size={18} />
              Baixar PDF
            </button>
          </div>
        </div>

        <div className={`border-t border-gray-100 p-6 bg-gray-50/50 ${isExpanded ? 'block' : 'hidden print:block'}`}>
          <div className="flex justify-between items-center mb-4 print:hidden">
            <h4 className="font-bold text-gray-700">Visualização de Dados</h4>
            <button 
              onClick={() => setExpandedSection(null)}
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
            <p className="text-sm text-blue-600">Consolidado de mesas (reservadas/pagas) e senhas em um único documento.</p>
          </div>
          <button
            onClick={() => handleExportRelatorioGeral()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            <FilePdf size={20} />
            Gerar Relatório Geral
          </button>
        </div>

        <ReportSection
          title="Mesas Reservadas"
          count={mesasReservadas.length}
          onPdf={() => handleExportMesasReservadas()}
          sectionId="reservadas"
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mesa</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Responsável</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Telefone</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Data Reserva</th>
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
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">Nenhuma mesa reservada encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </ReportSection>

        <ReportSection
          title="Mesas Pagas"
          count={mesasPagas.length}
          onPdf={() => handleExportMesasPagas()}
          sectionId="pagas"
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mesa</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Responsável</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pagamento</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mesasPagas.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{m.numero}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{m.responsavel || "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(m.valor_pago)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{m.forma_pagamento || "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {m.data_pagamento ? new Date(m.data_pagamento).toLocaleDateString("pt-BR") : "-"}
                  </td>
                </tr>
              ))}
              {mesasPagas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">Nenhuma mesa paga encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </ReportSection>

        <ReportSection
          title="Venda de Senhas"
          count={senhas.length}
          onPdf={() => handleExportSenhas()}
          sectionId="senhas"
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Qtd</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pagamento</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {senhas.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{s.nome}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{s.quantidade}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(s.valor_total)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{s.forma_pagamento}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {new Date(s.data_venda).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
              {senhas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">Nenhuma venda de senha encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </ReportSection>
      </div>


    </div>
  );
}

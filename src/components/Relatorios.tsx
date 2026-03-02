import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Mesa, Senha } from "../types";
import { FileText, Download, Printer, File as FilePdf } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function Relatorios() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [senhas, setSenhas] = useState<Senha[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mesasData, senhasData] = await Promise.all([
          api.getMesas(),
          api.getSenhas()
        ]);
        setMesas(mesasData);
        setSenhas(senhasData);
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
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 22);
    
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 30,
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

  if (loading) return <div className="flex items-center justify-center h-64">Carregando dados...</div>;

  const ReportSection = ({ title, count, onPdf }: any) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{count} registros encontrados</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onPdf}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
        >
          <FilePdf size={18} />
          Baixar PDF
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios e Exportação</h1>
        <p className="text-gray-500">Gere documentos para conferência e prestação de contas.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ReportSection
          title="Mesas Reservadas"
          count={mesasReservadas.length}
          onPdf={() => handleExportMesasReservadas()}
        />
        <ReportSection
          title="Mesas Pagas"
          count={mesasPagas.length}
          onPdf={() => handleExportMesasPagas()}
        />
        <ReportSection
          title="Venda de Senhas"
          count={senhas.length}
          onPdf={() => handleExportSenhas()}
        />
      </div>


      <div className="bg-blue-600 p-8 rounded-3xl text-white">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-white/20 rounded-2xl">
            <Printer size={24} />
          </div>
          <h2 className="text-xl font-bold">Impressão Rápida</h2>
        </div>
        <p className="text-blue-100 mb-8 max-w-md">
          Para imprimir qualquer tela do sistema de forma formatada, utilize o atalho <kbd className="bg-white/20 px-2 py-1 rounded text-white font-mono">Ctrl + P</kbd>. O sistema já possui estilos otimizados para impressão.
        </p>
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-white text-blue-600 font-bold rounded-2xl hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20"
        >
          Imprimir Página Atual
        </button>
      </div>
    </div>
  );
}

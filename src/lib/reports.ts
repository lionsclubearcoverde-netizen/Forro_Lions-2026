import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Mesa, Senha } from "../types";
import { formatBRL } from "./utils";

type Cell = string | number;

const BRAND: [number, number, number] = [37, 99, 235];

function createDoc(title: string, logoBase64: string | null): jsPDF {
  const doc = new jsPDF();
  if (logoBase64) doc.addImage(logoBase64, "PNG", 170, 10, 25, 25);
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 28);
  return doc;
}

export function exportSimplePdf(params: {
  title: string;
  headers: Cell[];
  rows: Cell[][];
  filename: string;
  logoBase64?: string | null;
}): void {
  const doc = createDoc(params.title, params.logoBase64 ?? null);
  autoTable(doc, {
    head: [params.headers],
    body: params.rows,
    startY: 40,
    theme: "striped",
    headStyles: { fillColor: BRAND },
  });
  doc.save(`${params.filename}.pdf`);
}

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR") : "-";

export function mesasReservadasRows(mesas: Mesa[]): Cell[][] {
  return mesas.map((m) => [
    m.numero,
    m.responsavel || "-",
    m.telefone || "-",
    fmtDate(m.data_reserva),
  ]);
}

export function mesasPagasRows(mesas: Mesa[]): Cell[][] {
  return mesas.map((m) => [
    m.numero,
    m.responsavel || "-",
    m.telefone || "-",
    formatBRL(m.valor_pago),
    m.forma_pagamento || "-",
    fmtDate(m.data_pagamento),
  ]);
}

export function senhasRows(senhas: Senha[]): Cell[][] {
  return senhas.map((s) => [
    s.nome,
    s.telefone || "-",
    s.quantidade,
    formatBRL(s.valor_total),
    s.forma_pagamento,
    new Date(s.data_venda).toLocaleDateString("pt-BR"),
  ]);
}

export function mesasOcupadasRows(mesas: Mesa[]): Cell[][] {
  return mesas.map((m) => [
    m.responsavel || "N/A",
    m.numero,
    m.status === "paga" ? "Paga" : "Reservada",
  ]);
}

export function exportRelatorioGeral(params: {
  reservadas: Mesa[];
  pagas: Mesa[];
  senhas: Senha[];
  totalArrecadado: number;
  logoBase64?: string | null;
}): void {
  const doc = createDoc("Relatório Geral do Evento", params.logoBase64 ?? null);
  let currentY = 40;

  const sections: Array<{ title: string; headers: Cell[]; rows: Cell[][] }> = [
    {
      title: "1. Mesas Reservadas",
      headers: ["Mesa", "Responsável", "Telefone", "Data Reserva"],
      rows: mesasReservadasRows(params.reservadas),
    },
    {
      title: "2. Mesas Pagas",
      headers: ["Mesa", "Responsável", "Telefone", "Valor", "Pagamento", "Data Pagamento"],
      rows: mesasPagasRows(params.pagas),
    },
    {
      title: "3. Venda de Senhas",
      headers: ["Nome", "Telefone", "Qtd", "Total", "Pagamento", "Data Venda"],
      rows: senhasRows(params.senhas),
    },
  ];

  for (const section of sections) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFontSize(14);
    doc.text(section.title, 14, currentY);
    autoTable(doc, {
      head: [section.headers],
      body: section.rows.length > 0 ? section.rows : [["-", "-", "-", "-", "-", "-"].slice(0, section.headers.length)],
      startY: currentY + 5,
      theme: "striped",
      headStyles: { fillColor: BRAND },
    });
    // lastAutoTable é adicionado pelo plugin jspdf-autotable.
    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }
  doc.setFontSize(14);
  doc.text("RESUMO FINANCEIRO", 14, currentY);
  doc.setFontSize(12);
  doc.text(`Total arrecadado (mesas pagas + senhas): ${formatBRL(params.totalArrecadado)}`, 14, currentY + 8);

  doc.save("relatorio-geral-lions.pdf");
}

export function buildWhatsAppMesasOcupadas(mesas: Mesa[]): string {
  let text = "*RELAÇÃO DE MESAS - FORRÓ LIONS 2026*\n\n";
  for (const m of mesas) {
    const statusLabel = m.status === "paga" ? "Paga" : "Reservada";
    text += `*Mesa ${m.numero}* - ${m.responsavel || "N/A"} (${statusLabel})\n`;
  }
  text += `\n*Total:* ${mesas.length} mesas`;
  return text;
}

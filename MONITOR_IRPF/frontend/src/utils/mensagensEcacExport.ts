import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { MensagensEcacItem } from "../interfaces/IMensagensEcaItem";

function formatCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function rowsToSheet(rows: MensagensEcacItem[]) {
  return rows.map((r) => ({
    Nome: r.nome,
    CPF: formatCpf(r.cpf),
    "Mensagens e-CAC": r.status_label,
    Total: r.total_mensagens,
    "Não lidas": r.nao_lidas,
  }));
}

export function mensagensExportFilenameBase(ano: number): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `mensagens-ecac-${ano}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

export function exportMensagensExcel(rows: MensagensEcacItem[], ano: number): void {
  const ws = XLSX.utils.json_to_sheet(rowsToSheet(rows));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Mensagens e-CAC");
  XLSX.writeFile(wb, `${mensagensExportFilenameBase(ano)}.xlsx`);
}

export function exportMensagensPdf(rows: MensagensEcacItem[], ano: number): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(11);
  doc.text(`Mensagens do e-CAC — exercício ${ano}`, 14, 12);
  autoTable(doc, {
    startY: 16,
    head: [["Nome", "CPF", "Mensagens e-CAC", "Total", "Não lidas"]],
    body: rows.map((r) => [
      r.nome,
      formatCpf(r.cpf),
      r.status_label,
      String(r.total_mensagens),
      String(r.nao_lidas),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [21, 101, 192] },
    margin: { left: 14, right: 14 },
  });
  doc.save(`${mensagensExportFilenameBase(ano)}.pdf`);
}

export function exportMensagensCsv(rows: MensagensEcacItem[], ano: number): void {
  const ws = XLSX.utils.json_to_sheet(rowsToSheet(rows));
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${mensagensExportFilenameBase(ano)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

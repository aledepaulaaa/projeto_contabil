import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { DiagnosticoFiscalItem } from "../interfaces/IDiagnosticoFiscalItem";

const HEADERS = ["Nome", "CPF", "Situação", "Última consulta"];

function formatCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatConsulta(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("pt-BR");
}

function rowsToSheet(rows: DiagnosticoFiscalItem[]) {
  return rows.map((r) => ({
    Nome: r.nome,
    CPF: formatCpf(r.cpf),
    Situação: r.situacao_label,
    "Última consulta": formatConsulta(r.consultado_em),
  }));
}

export function diagnosticoExportFilenameBase(ano: number): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `diagnostico-fiscal-ecac-${ano}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

export function exportDiagnosticoExcel(rows: DiagnosticoFiscalItem[], ano: number): void {
  const ws = XLSX.utils.json_to_sheet(rowsToSheet(rows));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Diagnóstico fiscal");
  XLSX.writeFile(wb, `${diagnosticoExportFilenameBase(ano)}.xlsx`);
}

export function exportDiagnosticoPdf(rows: DiagnosticoFiscalItem[], ano: number): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(11);
  doc.text(`Situação Fiscal e-CAC — exercício ${ano}`, 14, 12);
  autoTable(doc, {
    startY: 16,
    head: [HEADERS],
    body: rows.map((r) => [r.nome, formatCpf(r.cpf), r.situacao_label, formatConsulta(r.consultado_em)]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [21, 101, 192] },
    margin: { left: 14, right: 14 },
  });
  doc.save(`${diagnosticoExportFilenameBase(ano)}.pdf`);
}

export function exportDiagnosticoCsv(rows: DiagnosticoFiscalItem[], ano: number): void {
  const ws = XLSX.utils.json_to_sheet(rowsToSheet(rows));
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${diagnosticoExportFilenameBase(ano)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

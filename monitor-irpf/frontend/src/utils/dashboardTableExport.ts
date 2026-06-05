import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { RFB_STATUS_CODES, RFB_STATUS_META, type RfbStatusCode } from "../constants/rfbAndExercise";
import { Declaracao } from "../interfaces/IDeclaracao";

const PDF_HEADERS = ["Contribuinte", "CPF", "Situação", "Resultado", "Valor (R$)", "Status RFB"];

function rfbExportLabel(code: string | null | undefined): string {
  if (!code) return "—";
  if (RFB_STATUS_CODES.includes(code as RfbStatusCode)) {
    const m = RFB_STATUS_META[code as RfbStatusCode];
    return m.hint ? `${m.title} (${m.hint})` : m.title;
  }
  return code;
}

export function dashboardExportFilenameBase(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `dashboard-declaracoes-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(
    d.getMinutes(),
  )}`;
}

export function exportDeclaracoesExcel(
  rows: Declaracao[],
  filenameBase: string,
  statusLabel: Record<string, string>,
  resultLabel: Record<string, string>,
): void {
  const data = rows.map((r) => ({
    Contribuinte: r.titular_nome,
    CPF: r.titular_cpf ?? "",
    Situação: statusLabel[r.status] ?? r.status,
    "Resultado fiscal": r.resultado_fiscal ? resultLabel[r.resultado_fiscal] ?? r.resultado_fiscal : "—",
    "Valor (R$)": Number(r.valor_imposto_ou_restituicao) || 0,
    "Status RFB": rfbExportLabel(r.status_processamento_rfb),
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Declarações");
  XLSX.writeFile(wb, `${filenameBase}.xlsx`);
}

export function exportDeclaracoesPdf(
  rows: Declaracao[],
  filenameBase: string,
  statusLabel: Record<string, string>,
  resultLabel: Record<string, string>,
): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(11);
  doc.text("Declarações (filtros atuais do painel)", 14, 12);
  const body = rows.map((r) => [
    r.titular_nome,
    r.titular_cpf ?? "—",
    statusLabel[r.status] ?? r.status,
    r.resultado_fiscal ? resultLabel[r.resultado_fiscal] ?? r.resultado_fiscal : "—",
    (Number(r.valor_imposto_ou_restituicao) || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    rfbExportLabel(r.status_processamento_rfb),
  ]);
  autoTable(doc, {
    startY: 16,
    head: [PDF_HEADERS],
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [21, 101, 192] },
    margin: { left: 14, right: 14 },
  });
  doc.save(`${filenameBase}.pdf`);
}

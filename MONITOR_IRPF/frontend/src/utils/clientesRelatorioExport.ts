import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { TIPO_PRECIFICACAO_LABEL } from "../constants/precificacao";
import { ClienteListRow } from "../interfaces/IClienteListRow";
import { Usuario } from "../interfaces/IUsuario";
import { TipoPrecificacaoCliente } from "../types/TTipoPrecificacaoCliente";

/** Nome do sistema no cabeçalho dos relatórios (alinhado à direita). */
export const CARTEIRA_SYSTEM_NAME = "Carteira IRPF";

const ORIGEM_LABEL: Record<string, string> = {
  manual: "Manual",
  importacao_ano_anterior: "Importado (ano ant.)",
  sinc_declaracoes: "Sinc. declarações",
};

const TABLE_HEADERS = [
  "Nome",
  "CPF",
  "Origem",
  "Decl.",
  "Responsável (decl.)",
  "Precificação",
  "Honorários",
  "Situação",
  "Telefone",
  "E-mail",
];

function precificacaoRelatorioCelula(r: ClienteListRow): string {
  const tipo = (r.tipo_precificacao ?? "padrao") as TipoPrecificacaoCliente;
  const lab = TIPO_PRECIFICACAO_LABEL[tipo] ?? tipo;
  if (tipo === "personalizado" && r.valor_personalizado != null && String(r.valor_personalizado) !== "") {
    const n = Number(r.valor_personalizado);
    if (!Number.isNaN(n)) {
      return `${lab} (${n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})`;
    }
  }
  return lab;
}

export function clientesRelatorioFilenameBase(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `clientes-relatorio-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(
    d.getMinutes(),
  )}`;
}

export function formatResponsavelFiltroLabel(filterUserId: "" | number, usuarios: Usuario[]): string {
  if (filterUserId === "") return "Todos";
  const u = usuarios.find((x) => x.id === filterUserId);
  return u?.nome ?? "—";
}

function rowToExportCells(r: ClienteListRow): string[] {
  return [
    r.nome,
    r.cpf_exibicao ?? "—",
    ORIGEM_LABEL[r.origem_cadastro] ?? r.origem_cadastro,
    r.declaracoes_count != null ? String(r.declaracoes_count) : "—",
    r.declaracao_responsaveis ?? "—",
    precificacaoRelatorioCelula(r),
    r.honorarios_em_aberto ? "Em aberto" : "—",
    r.ativo ? "Ativo" : "Inativo",
    r.telefone ?? "—",
    r.email ?? "—",
  ];
}

export function exportClientesPdf(params: {
  rows: ClienteListRow[];
  anoExercicioLabel: string;
  filtroResponsavelTexto: string;
  filenameBase: string;
}): void {
  const { rows, anoExercicioLabel, filtroResponsavelTexto, filenameBase } = params;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Listagem de clientes", 14, 14);
  doc.setFont("helvetica", "normal");
  doc.text(CARTEIRA_SYSTEM_NAME, pageW - 14, 14, { align: "right" });

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Exercício: ${anoExercicioLabel}`, 14, 21);
  doc.text(`Filtro responsável: ${filtroResponsavelTexto}`, 14, 26);
  doc.text(`Emitido em: ${new Date().toLocaleString("pt-BR")}`, 14, 31);
  doc.setTextColor(0, 0, 0);

  const body = rows.map(rowToExportCells);

  autoTable(doc, {
    startY: 36,
    head: [TABLE_HEADERS],
    body,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [21, 101, 192] },
    margin: { left: 14, right: 14 },
  });

  const docExt = doc as unknown as { lastAutoTable?: { finalY: number } };
  const finalY = docExt.lastAutoTable?.finalY ?? 50;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Total de clientes: ${rows.length}`, 14, finalY + 8);
  doc.setFont("helvetica", "normal");

  doc.save(`${filenameBase}.pdf`);
}

export function exportClientesExcel(params: {
  rows: ClienteListRow[];
  anoExercicioLabel: string;
  filtroResponsavelTexto: string;
  filenameBase: string;
}): void {
  const { rows, anoExercicioLabel, filtroResponsavelTexto, filenameBase } = params;
  const emitted = new Date().toLocaleString("pt-BR");
  const pad9 = ["", "", "", "", "", "", "", "", ""] as const;
  const pad8 = ["", "", "", "", "", "", "", ""] as const;

  const aoas: (string | number)[][] = [
    ["Listagem de clientes", ...pad8, CARTEIRA_SYSTEM_NAME],
    [`Exercício: ${anoExercicioLabel}`, ...pad9],
    [`Filtro responsável: ${filtroResponsavelTexto}`, ...pad9],
    [`Emitido em: ${emitted}`, ...pad9],
    [],
    [...TABLE_HEADERS],
    ...rows.map(rowToExportCells),
    [],
    ["Total de clientes", rows.length, "", "", "", "", "", "", "", ""],
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoas);
  ws["!cols"] = [
    { wch: 28 },
    { wch: 16 },
    { wch: 22 },
    { wch: 8 },
    { wch: 26 },
    { wch: 22 },
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
    { wch: 28 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clientes");
  XLSX.writeFile(wb, `${filenameBase}.xlsx`);
}

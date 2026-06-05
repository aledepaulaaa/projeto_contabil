import { AsaasConfig } from "../interfaces/IAsaasConfig";
import { CarteiraDeclaracaoSituacaoRow } from "../interfaces/ICarteiraDeclaracaoSituacaoRow";
import { ChecklistItemIn } from "../interfaces/IChecklistItemIn";
import { ChecklistModelo } from "../interfaces/IChecklistModelo";
import { ChecklistModeloResumo } from "../interfaces/IChecklistModeloResumo";
import { ClienteDocumentacaoDetalhe } from "../interfaces/IClienteDocumentacaoDetalhe";
import { ClienteListRow } from "../interfaces/IClienteListRow";
import { ContadorConfig } from "../interfaces/IContadorConfig";
import { DarfGerarResult } from "../interfaces/IDarfGerarResult";
import { DarfLista } from "../interfaces/IDarfLista";
import { DashboardResumo } from "../interfaces/IDashboardResumo";
import { Declaracao } from "../interfaces/IDeclaracao";
import { DiagnosticoFiscalAtualizarResult } from "../interfaces/IDiagnosticoFiscalAtualizarResult";
import { DiagnosticoFiscalDetalhe } from "../interfaces/IDiagnosticoFiscalDetalhe";
import { DiagnosticoFiscalLista } from "../interfaces/IDiagnosticoFiscalLista";
import { DocumentoClienteRow } from "../interfaces/IDocumentoClienteRow";
import { DocumentoEntregaItem } from "../interfaces/IDocumentoEntregaItem";
import { FonteLocalStatus } from "../interfaces/IFonteLocalStatus";
import { MalhaAtualizarResult } from "../interfaces/IMalhaAtualizarResult";
import { MalhaDetalhe } from "../interfaces/IMalhaDetalhe";
import { MalhaLista } from "../interfaces/IMalhaLista";
import { MensagensEcacAtualizarResult } from "../interfaces/IMensagensEcacAtualizarResult";
import { MensagensEcacCaixa } from "../interfaces/IMensagensEcacCaixa";
import { MensagensEcacLista } from "../interfaces/IMensagensEcaLista";
import { MonitorStatus } from "../interfaces/IMonitorStatus";
import { PortalLink } from "../interfaces/IPortalLink";
import { PortalPublico } from "../interfaces/IPortalPublico";
import { PrecificacaoParametros } from "../interfaces/IPrecificacaoParametros";
import { RestituicaoAtualizarResult } from "../interfaces/IRestituicaoAtualizarResult";
import { RestituicaoDetalhe } from "../interfaces/IRestituicaoDetalhe";
import { RestituicaoLista } from "../interfaces/IRestituicaoLista";
import { RfbInfosimplesConfig } from "../interfaces/IRfbInfosimplesConfig";
import { Usuario } from "../interfaces/IUsuario";
import { ContaAzulConfig } from "../interfaces/IContaAzulConfig";
import { SerproConfig } from "../interfaces/ISerproConfig";

const API = "/api";

function frontendOriginHeaders(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { ...extra };
  if (typeof window !== "undefined" && window.location?.origin) {
    h["X-Frontend-Origin"] = window.location.origin;
  }
  return h;
}

function errorFromApiBody(text: string, statusText: string): Error {
  try {
    const j = JSON.parse(text) as { detail?: unknown };
    if (typeof j.detail === "string") return new Error(j.detail);
    if (Array.isArray(j.detail)) {
      const parts = j.detail.map((x) => (typeof x === "string" ? x : JSON.stringify(x)));
      return new Error(parts.join("; "));
    }
  } catch {
    /* corpo não é JSON */
  }
  return new Error(text || statusText);
}

async function parseResponse(res: Response): Promise<unknown> {
  if (!res.ok) {
    const text = await res.text();
    throw errorFromApiBody(text, res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") u.set(k, String(v));
  });
  const s = u.toString();
  return s ? `?${s}` : "";
}

export async function fetchFonteLocal(): Promise<FonteLocalStatus> {
  const res = await fetch(`${API}/sync/fonte-local`);
  return parseResponse(res) as Promise<FonteLocalStatus>;
}

function normalizeMonitorStatus(data: unknown): MonitorStatus {
  const d = data as Partial<MonitorStatus> & Record<string, unknown>;
  const paths = Array.isArray(d.irpf_root_paths)
    ? d.irpf_root_paths.filter((p: unknown): p is string => typeof p === "string")
    : [];
  return {
    irpf_root_paths: paths,
    irpf_root_path: typeof d.irpf_root_path === "string" ? d.irpf_root_path : paths[0] ?? null,
    monitor_enabled: Boolean(d.monitor_enabled),
    last_scan_at: typeof d.last_scan_at === "string" ? d.last_scan_at : null,
  };
}

export async function fetchMonitorStatus(): Promise<MonitorStatus> {
  const res = await fetch(`${API}/monitor/status`);
  const data = await parseResponse(res);
  return normalizeMonitorStatus(data);
}

export async function putMonitorPaths(paths: string[]): Promise<MonitorStatus> {
  const res = await fetch(`${API}/monitor/paths`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paths }),
  });
  const data = await parseResponse(res);
  return normalizeMonitorStatus(data);
}

export async function postMonitorScan(): Promise<{ ok: boolean; last_scan_at: string | null }> {
  const res = await fetch(`${API}/monitor/scan`, { method: "POST" });
  const data = (await parseResponse(res)) as { ok?: boolean; last_scan_at?: string | null };
  return {
    ok: data.ok === true,
    last_scan_at: typeof data.last_scan_at === "string" ? data.last_scan_at : null,
  };
}

export async function fetchDeclaracoes(filters: {
  status?: string;
  ano?: number;
  usuario_responsavel_id?: number;
  status_processamento_rfb?: string;
}): Promise<Declaracao[]> {
  const res = await fetch(`${API}/declaracoes${qs(filters)}`);
  return parseResponse(res) as Promise<Declaracao[]>;
}

export async function fetchDashboardResumo(filters: {
  status?: string;
  ano?: number;
  usuario_responsavel_id?: number;
  status_processamento_rfb?: string;
}): Promise<DashboardResumo> {
  const res = await fetch(`${API}/declaracoes/dashboard-resumo${qs(filters)}`);
  return parseResponse(res) as Promise<DashboardResumo>;
}

export async function patchDeclaracao(id: number, body: Record<string, unknown>): Promise<Declaracao> {
  const res = await fetch(`${API}/declaracoes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse(res) as Promise<Declaracao>;
}

export async function createDeclaracao(
  body: Partial<Declaracao> & { ano_calendario: number; titular_nome: string },
): Promise<Declaracao> {
  const res = await fetch(`${API}/declaracoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse(res) as Promise<Declaracao>;
}

export async function deleteDeclaracao(id: number): Promise<void> {
  const res = await fetch(`${API}/declaracoes/${id}`, { method: "DELETE" });
  await parseResponse(res);
}

export async function sincronizarPastaIrpf(): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API}/declaracoes/sincronizar-pasta-irpf`, { method: "POST" });
  return parseResponse(res) as Promise<{ ok: boolean; message: string }>;
}

export async function fetchUsuarios(): Promise<Usuario[]> {
  const res = await fetch(`${API}/usuarios`);
  return parseResponse(res) as Promise<Usuario[]>;
}

export async function createUsuario(body: {
  nome: string;
  email: string;
  ativo?: boolean;
}): Promise<Usuario> {
  const res = await fetch(`${API}/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse(res) as Promise<Usuario>;
}

export async function deleteUsuario(id: number): Promise<void> {
  const res = await fetch(`${API}/usuarios/${id}`, { method: "DELETE" });
  await parseResponse(res);
}

export async function fetchClientes(ano: number): Promise<ClienteListRow[]> {
  const res = await fetch(`${API}/clientes${qs({ ano })}`);
  return parseResponse(res) as Promise<ClienteListRow[]>;
}

export async function fetchPrecificacaoParametros(): Promise<PrecificacaoParametros> {
  const res = await fetch(`${API}/precificacao/parametros`);
  return parseResponse(res) as Promise<PrecificacaoParametros>;
}

export async function putPrecificacaoParametros(body: PrecificacaoParametros): Promise<PrecificacaoParametros> {
  const res = await fetch(`${API}/precificacao/parametros`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse(res) as Promise<PrecificacaoParametros>;
}

export async function fetchCarteiraSituacaoDeclaracoes(ano: number): Promise<CarteiraDeclaracaoSituacaoRow[]> {
  const res = await fetch(`${API}/procuracoes/carteira-situacao-declaracoes${qs({ ano })}`);
  return parseResponse(res) as Promise<CarteiraDeclaracaoSituacaoRow[]>;
}

export async function toggleClienteAtivo(body: {
  estado_key: string;
  ativo: boolean;
  ano_calendario: number;
}): Promise<void> {
  const res = await fetch(`${API}/clientes/toggle-ativo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  await parseResponse(res);
}

export async function sincronizarClientesDeclaracoes(ano: number): Promise<{ criados: number; message: string }> {
  const res = await fetch(`${API}/clientes/sincronizar-declaracoes${qs({ ano })}`, { method: "POST" });
  return parseResponse(res) as Promise<{ criados: number; message: string }>;
}

export async function importarClientesDoAno(body: {
  ano_origem: number;
  ano_destino: number;
}): Promise<{ criados: number; message: string }> {
  const res = await fetch(`${API}/clientes/importar-do-ano`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse(res) as Promise<{ criados: number; message: string }>;
}

export async function createClienteManual(body: {
  ano_carteira: number;
  nome: string;
  cpf?: string | null;
  telefone?: string | null;
  email?: string | null;
  observacoes?: string | null;
  tipo_precificacao?: string;
  valor_personalizado?: string | number | null;
  asaas_customer_id?: string | null;
}): Promise<void> {
  const res = await fetch(`${API}/clientes/manuais`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  await parseResponse(res);
}

export async function updateClienteManual(
  id: number,
  body: Partial<{
    nome: string;
    cpf: string | null;
    telefone: string | null;
    email: string | null;
    observacoes: string | null;
    tipo_precificacao: string;
    valor_personalizado: string | number | null;
    asaas_customer_id: string | null;
  }>,
): Promise<void> {
  const res = await fetch(`${API}/clientes/manuais/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  await parseResponse(res);
}

export async function deleteClienteManual(id: number, anoCalendario: number): Promise<void> {
  const res = await fetch(`${API}/clientes/manuais/${id}${qs({ ano_calendario: anoCalendario })}`, {
    method: "DELETE",
  });
  await parseResponse(res);
}

export async function fetchInsightContribuinte(cpf: string): Promise<unknown> {
  const u = new URLSearchParams({ cpf: cpf.trim() });
  const res = await fetch(`${API}/insights/contribuinte?${u}`);
  return parseResponse(res);
}

/** Relatório completo de insights (agregado por CPF). */
export async function fetchInsightRelatorio(cpf: string): Promise<unknown> {
  const u = new URLSearchParams({ cpf: cpf.trim() });
  const res = await fetch(`${API}/insights/relatorio?${u}`);
  return parseResponse(res);
}

export async function fetchAsaasConfig(): Promise<AsaasConfig> {
  const res = await fetch(`${API}/integracoes/asaas/config`);
  return parseResponse(res) as Promise<AsaasConfig>;
}

export async function putAsaasConfig(body: Record<string, unknown>): Promise<AsaasConfig> {
  const res = await fetch(`${API}/integracoes/asaas/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse(res) as Promise<AsaasConfig>;
}

export async function fetchRfbInfosimplesConfig(): Promise<RfbInfosimplesConfig> {
  const res = await fetch(`${API}/integracoes/rfb/config`);
  return parseResponse(res) as Promise<RfbInfosimplesConfig>;
}

export async function putRfbInfosimplesConfig(body: Record<string, unknown>): Promise<RfbInfosimplesConfig> {
  const res = await fetch(`${API}/integracoes/rfb/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse(res) as Promise<RfbInfosimplesConfig>;
}

export async function fetchContadorConfig(): Promise<ContadorConfig> {
  const res = await fetch(`${API}/integracoes/contador/config`);
  return parseResponse(res) as Promise<ContadorConfig>;
}

export async function putContadorConfig(body: Partial<ContadorConfig>): Promise<ContadorConfig> {
  const res = await fetch(`${API}/integracoes/contador/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse(res) as Promise<ContadorConfig>;
}

export async function fetchContadorCertInfo(): Promise<{
  presente: boolean;
  meta: string | null;
  senha_configurada: boolean;
  tamanho_bytes_certificado: number | null;
}> {
  const res = await fetch(`${API}/integracoes/contador/certificado/info`);
  return parseResponse(res) as Promise<{
    presente: boolean;
    meta: string | null;
    senha_configurada: boolean;
    tamanho_bytes_certificado: number | null;
  }>;
}

export async function putContadorCertSenha(senha: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API}/integracoes/contador/certificado/senha`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senha }),
  });
  return parseResponse(res) as Promise<{ ok: boolean }>;
}

export async function uploadContadorCertificado(
  file: File,
  opts?: { senha?: string },
): Promise<{ ok: boolean; bytes_recebidos?: number }> {
  const fd = new FormData();
  fd.append("certificado", file);
  const s = opts?.senha?.trim();
  if (s) fd.append("senha", s);
  const res = await fetch(`${API}/integracoes/contador/certificado/upload`, {
    method: "POST",
    body: fd,
  });
  return parseResponse(res) as Promise<{ ok: boolean; bytes_recebidos?: number }>;
}

export async function deleteContadorCertificado(): Promise<void> {
  const res = await fetch(`${API}/integracoes/contador/certificado`, { method: "DELETE" });
  await parseResponse(res);
}

export async function postContadorTestarCertificado(): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API}/integracoes/contador/testar-certificado`, { method: "POST" });
  return parseResponse(res) as Promise<{ ok: boolean; message: string }>;
}

export async function postRfbDiagnosticoFiscal(body: {
  cpf: string;
  ano_calendario: number;
}): Promise<Record<string, unknown>> {
  const res = await fetch(`${API}/integracoes/rfb/diagnostico`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    if (text) data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(text || res.statusText);
  }
  if (!res.ok) {
    const msg = typeof data.message === "string" ? data.message : text || res.statusText;
    throw new Error(msg);
  }
  return data;
}

export async function fetchMensagensEcacLista(ano: number): Promise<MensagensEcacLista> {
  const res = await fetch(`${API}/mensagens-ecac${qs({ ano })}`);
  return parseResponse(res) as Promise<MensagensEcacLista>;
}

export async function fetchMensagensEcacCaixa(
  cpf: string,
  ano: number,
  marcarLidas = false,
): Promise<MensagensEcacCaixa> {
  const res = await fetch(`${API}/mensagens-ecac/${cpf}/caixa${qs({ ano, marcar_lidas: marcarLidas })}`);
  return parseResponse(res) as Promise<MensagensEcacCaixa>;
}

export async function postMensagensEcacConsultarLote(ano: number): Promise<MensagensEcacAtualizarResult> {
  const res = await fetch(`${API}/mensagens-ecac/consultar-lote${qs({ ano })}`, { method: "POST" });
  return parseResponse(res) as Promise<MensagensEcacAtualizarResult>;
}

export async function postMensagensEcacConsultarCpf(
  cpf: string,
  ano: number,
): Promise<MensagensEcacAtualizarResult> {
  const res = await fetch(`${API}/mensagens-ecac/${cpf}/consultar${qs({ ano })}`, { method: "POST" });
  return parseResponse(res) as Promise<MensagensEcacAtualizarResult>;
}

export async function postMensagensEcacPontuais(body: {
  cpf: string;
  ano_calendario: number;
}): Promise<MensagensEcacAtualizarResult> {
  const res = await fetch(`${API}/mensagens-ecac/pontuais`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse(res) as Promise<MensagensEcacAtualizarResult>;
}

export async function downloadMensagensEcacTodos(ano: number): Promise<void> {
  await downloadDiagnosticoBlob(`/mensagens-ecac/exportar-todos${qs({ ano })}`, `mensagens-ecac-${ano}.json`);
}

export async function fetchDiagnosticoFiscalLista(ano: number): Promise<DiagnosticoFiscalLista> {
  const res = await fetch(`${API}/diagnostico-fiscal${qs({ ano })}`);
  return parseResponse(res) as Promise<DiagnosticoFiscalLista>;
}

export async function fetchDiagnosticoFiscalDetalhes(cpf: string, ano: number): Promise<DiagnosticoFiscalDetalhe> {
  const res = await fetch(`${API}/diagnostico-fiscal/${cpf}/detalhes${qs({ ano })}`);
  return parseResponse(res) as Promise<DiagnosticoFiscalDetalhe>;
}

export async function postDiagnosticoFiscalAtualizarAno(ano: number): Promise<DiagnosticoFiscalAtualizarResult> {
  const res = await fetch(`${API}/diagnostico-fiscal/atualizar${qs({ ano })}`, { method: "POST" });
  return parseResponse(res) as Promise<DiagnosticoFiscalAtualizarResult>;
}

export async function postDiagnosticoFiscalAtualizarCpf(
  cpf: string,
  ano: number,
): Promise<DiagnosticoFiscalAtualizarResult> {
  const res = await fetch(`${API}/diagnostico-fiscal/${cpf}/atualizar${qs({ ano })}`, { method: "POST" });
  return parseResponse(res) as Promise<DiagnosticoFiscalAtualizarResult>;
}

async function downloadDiagnosticoBlob(path: string, defaultName: string): Promise<void> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) {
    const text = await res.text();
    throw errorFromApiBody(text, res.statusText);
  }
  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition") || "";
  const match = /filename="?([^";\n]+)"?/i.exec(cd);
  const filename = (match?.[1] || defaultName).trim();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadDiagnosticoFiscalCpf(cpf: string, ano: number): Promise<void> {
  await downloadDiagnosticoBlob(`/diagnostico-fiscal/${cpf}/download${qs({ ano })}`, `diagnostico-${cpf}.json`);
}

export async function downloadDiagnosticoFiscalTodos(ano: number): Promise<void> {
  await downloadDiagnosticoBlob(`/diagnostico-fiscal/exportar-todos${qs({ ano })}`, `diagnosticos-ecac-${ano}.json`);
}

export async function fetchRestituicoesLista(ano: number): Promise<RestituicaoLista> {
  const res = await fetch(`${API}/restituicoes${qs({ ano })}`);
  return parseResponse(res) as Promise<RestituicaoLista>;
}

export async function fetchRestituicaoDetalhes(declaracaoId: number): Promise<RestituicaoDetalhe> {
  const res = await fetch(`${API}/restituicoes/${declaracaoId}/detalhes`);
  return parseResponse(res) as Promise<RestituicaoDetalhe>;
}

export async function postRestituicoesAtualizarAno(ano: number): Promise<RestituicaoAtualizarResult> {
  const res = await fetch(`${API}/restituicoes/atualizar${qs({ ano })}`, { method: "POST" });
  return parseResponse(res) as Promise<RestituicaoAtualizarResult>;
}

export async function postRestituicaoAtualizarDeclaracao(
  declaracaoId: number,
): Promise<RestituicaoAtualizarResult> {
  const res = await fetch(`${API}/restituicoes/${declaracaoId}/atualizar`, { method: "POST" });
  return parseResponse(res) as Promise<RestituicaoAtualizarResult>;
}

export async function fetchMalhaLista(ano: number): Promise<MalhaLista> {
  const res = await fetch(`${API}/malha${qs({ ano })}`);
  return parseResponse(res) as Promise<MalhaLista>;
}

export async function fetchMalhaDetalhes(declaracaoId: number): Promise<MalhaDetalhe> {
  const res = await fetch(`${API}/malha/${declaracaoId}/detalhes`);
  return parseResponse(res) as Promise<MalhaDetalhe>;
}

export async function postMalhaAtualizarAno(ano: number): Promise<MalhaAtualizarResult> {
  const res = await fetch(`${API}/malha/atualizar${qs({ ano })}`, { method: "POST" });
  return parseResponse(res) as Promise<MalhaAtualizarResult>;
}

export async function postMalhaAtualizarDeclaracao(declaracaoId: number): Promise<MalhaAtualizarResult> {
  const res = await fetch(`${API}/malha/${declaracaoId}/atualizar`, { method: "POST" });
  return parseResponse(res) as Promise<MalhaAtualizarResult>;
}

export async function fetchDarfLista(ano: number): Promise<DarfLista> {
  const res = await fetch(`${API}/darf${qs({ ano })}`);
  return parseResponse(res) as Promise<DarfLista>;
}

export async function postGerarDarf(
  declaracaoId: number,
  body: { parcela: number; confirmar_debito_automatico?: boolean },
): Promise<{ filename: string; titular?: string; parcela?: number; total_parcelas?: number }> {
  const res = await fetch(`${API}/darf/${declaracaoId}/gerar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      parcela: body.parcela,
      confirmar_debito_automatico: Boolean(body.confirmar_debito_automatico),
    }),
  });
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (!res.ok) {
    const text = await res.text();
    throw errorFromApiBody(text, res.statusText);
  }
  if (ct.includes("application/pdf")) {
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") || "";
    const match = /filename\*?=(?:UTF-8'')?"?([^";\n]+)"?/i.exec(cd);
    const filename = (match?.[1] || `DARF-teste-${declaracaoId}.pdf`).trim();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { filename };
  }
  const data = (await res.json()) as DarfGerarResult;
  return {
    filename: `${data.referencia}.pdf`,
    titular: data.titular_nome,
    parcela: data.parcela,
    total_parcelas: data.total_parcelas,
  };
}

export async function postAsaasCobrancaCliente(body: {
  estado_key: string;
  ano_carteira: number;
}): Promise<Record<string, unknown>> {
  const res = await fetch(`${API}/integracoes/asaas/cobranca-cliente`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    if (text) data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(text || res.statusText);
  }
  if (!res.ok) {
    const errBody = data as { errors?: { description?: string; code?: string }[] };
    const parts = errBody.errors?.map((e) => e.description || e.code).filter(Boolean);
    throw new Error(parts?.length ? parts.join("; ") : text || res.statusText);
  }
  return data;
}

export async function fetchContaAzulConfig(): Promise<ContaAzulConfig> {
  const res = await fetch(`${API}/integracoes/conta-azul/config`);
  return parseResponse(res) as Promise<ContaAzulConfig>;
}

export async function putContaAzulConfig(body: Partial<ContaAzulConfig>): Promise<ContaAzulConfig> {
  const res = await fetch(`${API}/integracoes/conta-azul/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse(res) as Promise<ContaAzulConfig>;
}

export async function postContaAzulConfigurarCode(code: string): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API}/integracoes/conta-azul/configurar-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  return parseResponse(res) as Promise<{ ok: boolean; message: string }>;
}

export async function postContaAzulTestarConexao(): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API}/integracoes/conta-azul/testar-conexao`, {
    method: "POST",
  });
  return parseResponse(res) as Promise<{ ok: boolean; message: string }>;
}

export async function fetchSerproConfig(): Promise<SerproConfig> {
  const res = await fetch(`${API}/integracoes/serpro/config`);
  return parseResponse(res) as Promise<SerproConfig>;
}

export async function putSerproConfig(body: Partial<SerproConfig>): Promise<SerproConfig> {
  const res = await fetch(`${API}/integracoes/serpro/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse(res) as Promise<SerproConfig>;
}

export async function postSerproExtrairChave(): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API}/integracoes/serpro/extrair-chave`, {
    method: "POST",
  });
  return parseResponse(res) as Promise<{ ok: boolean; message: string }>;
}

export async function postSerproTestarToken(): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API}/integracoes/serpro/integra-contador/token`, {
    method: "POST",
  });
  const raw = (await parseResponse(res)) as { ok?: boolean; message?: string };
  return {
    ok: raw.ok === true,
    message: raw.message || (raw.ok ? "Autenticação SAPI realizada com sucesso!" : "Falha na autenticação"),
  };
}

export interface DadoRendaItem {
  codigo: string;
  texto: string;
  valor: string;
}

export interface ConsultaRendaResult {
  ok: boolean;
  mock?: boolean;
  message?: string;
  autorizacao?: {
    token: string;
    dataHoraRegistro: string;
    titular: string;
    destinatario: string;
    avisoLegal?: string;
  };
  dados?: DadoRendaItem[];
}

export async function postSerproConsultaRenda(tokenCompartilhamento: string): Promise<ConsultaRendaResult> {
  const res = await fetch(`${API}/integracoes/serpro/consulta-renda`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tokenCompartilhamento }),
  });
  // Resposta sempre é JSON (ok: true/false), mesmo em erro de negócio
  const text = await res.text();
  try {
    return JSON.parse(text) as ConsultaRendaResult;
  } catch {
    throw new Error(text || res.statusText);
  }
}

export async function fetchChecklistModelos(): Promise<ChecklistModeloResumo[]> {
  const res = await fetch(`${API}/checklist-modelos`);
  return parseResponse(res) as Promise<ChecklistModeloResumo[]>;
}

export async function fetchChecklistModelo(id: number): Promise<ChecklistModelo> {
  const res = await fetch(`${API}/checklist-modelos/${id}`);
  return parseResponse(res) as Promise<ChecklistModelo>;
}

export async function createChecklistModelo(body: {
  nome: string;
  descricao?: string | null;
  itens: ChecklistItemIn[];
}): Promise<ChecklistModelo> {
  const res = await fetch(`${API}/checklist-modelos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...frontendOriginHeaders() },
    body: JSON.stringify(body),
  });
  return parseResponse(res) as Promise<ChecklistModelo>;
}

export async function updateChecklistModelo(
  id: number,
  body: { nome?: string; descricao?: string | null; itens?: ChecklistItemIn[] },
): Promise<ChecklistModelo> {
  const res = await fetch(`${API}/checklist-modelos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...frontendOriginHeaders() },
    body: JSON.stringify(body),
  });
  return parseResponse(res) as Promise<ChecklistModelo>;
}

export async function deleteChecklistModelo(id: number): Promise<void> {
  const res = await fetch(`${API}/checklist-modelos/${id}`, { method: "DELETE" });
  await parseResponse(res);
}

export async function fetchDocumentosClientes(ano: number): Promise<DocumentoClienteRow[]> {
  const res = await fetch(`${API}/documentos${qs({ ano })}`, {
    headers: frontendOriginHeaders(),
  });
  return parseResponse(res) as Promise<DocumentoClienteRow[]>;
}

export async function atribuirChecklistCliente(
  clienteId: number,
  modeloId: number,
): Promise<{ ok: boolean; portal_url: string }> {
  const res = await fetch(`${API}/documentos/clientes/${clienteId}/checklist`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...frontendOriginHeaders() },
    body: JSON.stringify({ modelo_id: modeloId }),
  });
  return parseResponse(res) as Promise<{ ok: boolean; portal_url: string }>;
}

export async function fetchDocumentoClienteDetalhe(clienteId: number): Promise<ClienteDocumentacaoDetalhe> {
  const res = await fetch(`${API}/documentos/clientes/${clienteId}`, {
    headers: frontendOriginHeaders(),
  });
  return parseResponse(res) as Promise<ClienteDocumentacaoDetalhe>;
}

export function documentoEntregaArquivoUrl(entregaId: number): string {
  return `${API}/documentos/entregas/${entregaId}/arquivo`;
}

export async function setPortalDocumentosBloqueado(
  clienteId: number,
  bloqueado: boolean,
): Promise<{ ok: boolean; portal_bloqueado: boolean }> {
  const res = await fetch(`${API}/documentos/clientes/${clienteId}/portal-bloqueio`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...frontendOriginHeaders() },
    body: JSON.stringify({ bloqueado }),
  });
  return parseResponse(res) as Promise<{ ok: boolean; portal_bloqueado: boolean }>;
}

export async function gerarLinkDocumentosCliente(
  clienteId: number,
  regenerar = false,
): Promise<PortalLink> {
  const res = await fetch(
    `${API}/documentos/clientes/${clienteId}/link${regenerar ? "?regenerar=true" : ""}`,
    { method: "POST", headers: frontendOriginHeaders() },
  );
  return parseResponse(res) as Promise<PortalLink>;
}

export async function fetchPortalPublico(token: string): Promise<PortalPublico> {
  const res = await fetch(`${API}/public/documentos/${encodeURIComponent(token)}`);
  return parseResponse(res) as Promise<PortalPublico>;
}

export async function uploadDocumentoPortal(
  token: string,
  checklistItemId: number,
  file: File,
): Promise<DocumentoEntregaItem> {
  const fd = new FormData();
  fd.append("checklist_item_id", String(checklistItemId));
  fd.append("arquivo", file);
  const res = await fetch(`${API}/public/documentos/${encodeURIComponent(token)}/upload`, {
    method: "POST",
    body: fd,
  });
  return parseResponse(res) as Promise<DocumentoEntregaItem>;
}

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Paginacao } from "../components/Paginacao";
import { usePaginacao } from "../hooks/usePaginacao";
import {
  ANO_MAX,
  ANO_MIN,
  SESSION_CARTEIRA_ANO_KEY,
  anoExercicioLabel,
  readStoredCarteiraAno,
} from "../constants/rfbAndExercise";
import {
  createClienteManual,
  deleteClienteManual,
  fetchClientes,
  fetchPrecificacaoParametros,
  fetchUsuarios,
  importarClientesDoAno,
  sincronizarClientesDeclaracoes,
  toggleClienteAtivo,
  updateClienteManual,
} from "../api/client";
import { TIPO_PRECIFICACAO_OPTIONS } from "../constants/precificacao";
import { IconPencil, IconX } from "../components/NavIcons";
import {
  clientesRelatorioFilenameBase,
  exportClientesExcel,
  exportClientesPdf,
  formatResponsavelFiltroLabel,
} from "../utils/clientesRelatorioExport";
import { ClienteListRow } from "../interfaces/IClienteListRow";
import { Usuario } from "../interfaces/IUsuario";
import { TipoCobrancaPadrao } from "../types/TTipoCobrancaPadrao";
import { TipoPrecificacaoCliente } from "../types/TTipoPrecificacaoCliente";

const emptyManual = {
  nome: "",
  cpf: "",
  telefone: "",
  email: "",
  observacoes: "",
  tipo_precificacao: "padrao" as TipoPrecificacaoCliente,
  valor_personalizado: "",
  asaas_customer_id: "",
};

function parseValorPersonalizadoInput(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const ORIGEM_LABEL: Record<string, string> = {
  manual: "Manual",
  importacao_ano_anterior: "Importado (ano ant.)",
  sinc_declaracoes: "Sinc. declarações",
};

function origemBadgeClass(origem: string): string {
  if (origem === "manual") return "badge-rascunho";
  if (origem === "importacao_ano_anterior") return "badge-em_edicao";
  return "badge-entregue";
}

function nomesResponsaveisNaCelula(texto: string | null): string[] {
  if (!texto?.trim()) return [];
  return texto.split(",").map((s) => s.trim()).filter(Boolean);
}

function rowMatchesResponsavelFilter(row: ClienteListRow, usuarioId: number, usuarios: Usuario[]): boolean {
  const u = usuarios.find((x) => x.id === usuarioId);
  if (!u) return false;
  const partes = nomesResponsaveisNaCelula(row.declaracao_responsaveis);
  return partes.includes(u.nome);
}

type CenterBanner = { kind: "info" | "error"; text: string } | null;
type ResponsavelFilter = "" | number;

export function ClientesPage() {
  const [exerciseYear, setExerciseYear] = useState(readStoredCarteiraAno);
  const [rows, setRows] = useState<ClienteListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [centerBanner, setCenterBanner] = useState<CenterBanner>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingManualId, setEditingManualId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyManual);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filterResponsavel, setFilterResponsavel] = useState<ResponsavelFilter>("");
  const [tipoCobrancaPadraoSistema, setTipoCobrancaPadraoSistema] = useState<TipoCobrancaPadrao>("padrao");
  /** null = ainda não montado nesta instância; comparação com exerciseYear distingue mudança pelo utilizador. */
  const prevYearRef = useRef<number | null>(null);

  useEffect(() => {
    void fetchUsuarios()
      .then(setUsuarios)
      .catch(() => setUsuarios([]));
  }, []);

  useEffect(() => {
    void fetchPrecificacaoParametros()
      .then((p) => {
        const t = p.tipo_cobranca_padrao;
        if (t === "padrao" || t === "minimo" || t === "maximo" || t === "bonificado") {
          setTipoCobrancaPadraoSistema(t);
        }
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setRows(await fetchClientes(exerciseYear));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao carregar clientes");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [exerciseYear]);

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_CARTEIRA_ANO_KEY, String(exerciseYear));
    } catch {
      /* */
    }
  }, [exerciseYear]);

  useEffect(() => {
    if (prevYearRef.current === null) {
      prevYearRef.current = exerciseYear;
      void load();
      return;
    }
    if (prevYearRef.current !== exerciseYear) {
      prevYearRef.current = exerciseYear;
      setRows([]);
      setFilterResponsavel("");
      setErr(null);
      setInfoMsg(null);
      setCenterBanner({
        kind: "info",
        text: "Exercício alterado. A lista não é carregada automaticamente. Use «Sincronizar com declarações (BD)» para puxar contribuintes das declarações já gravadas neste ano, «Importar do ano anterior» para trazer quem estava no ano passado, ou «Carregar lista» se já existirem cadastros salvos para este exercício.",
      });
    }
  }, [exerciseYear, load]);

  const displayedRows = useMemo(() => {
    if (filterResponsavel === "") return rows;
    return rows.filter((r) => rowMatchesResponsavelFilter(r, filterResponsavel, usuarios));
  }, [rows, filterResponsavel, usuarios]);

  const { paginatedItems: pageRows, paginacaoProps, resetPage } = usePaginacao(displayedRows, 20);

  // Reset page when filter changes
  useEffect(() => { resetPage(); }, [filterResponsavel, resetPage]);

  function onExportPdf() {
    exportClientesPdf({
      rows: displayedRows,
      anoExercicioLabel: anoExercicioLabel(exerciseYear),
      filtroResponsavelTexto: formatResponsavelFiltroLabel(filterResponsavel, usuarios),
      filenameBase: clientesRelatorioFilenameBase(),
    });
  }

  function onExportExcel() {
    exportClientesExcel({
      rows: displayedRows,
      anoExercicioLabel: anoExercicioLabel(exerciseYear),
      filtroResponsavelTexto: formatResponsavelFiltroLabel(filterResponsavel, usuarios),
      filenameBase: clientesRelatorioFilenameBase(),
    });
  }

  function openNovo() {
    setEditingManualId(null);
    setForm({
      ...emptyManual,
      tipo_precificacao: tipoCobrancaPadraoSistema,
      valor_personalizado: "",
    });
    setModalOpen(true);
  }

  function openEditManual(row: ClienteListRow) {
    setEditingManualId(row.manual_id);
    const tp = row.tipo_precificacao ?? "padrao";
    setForm({
      nome: row.nome,
      cpf: row.cpf_exibicao ?? "",
      telefone: row.telefone ?? "",
      email: row.email ?? "",
      observacoes: row.observacoes ?? "",
      tipo_precificacao: tp,
      valor_personalizado:
        tp === "personalizado" && row.valor_personalizado != null && String(row.valor_personalizado) !== ""
          ? String(row.valor_personalizado).replace(".", ",")
          : "",
      asaas_customer_id: (row.asaas_customer_id ?? "").trim(),
    });
    setModalOpen(true);
  }

  async function onSubmitManual(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    const tipo = form.tipo_precificacao;
    let valorPersonalizado: number | null = null;
    if (tipo === "personalizado") {
      const n = parseValorPersonalizadoInput(form.valor_personalizado);
      if (n == null || n <= 0) {
        setErr("Para «valor personalizado», indique um montante maior que zero.");
        return;
      }
      valorPersonalizado = n;
    }
    try {
      const asaasId = form.asaas_customer_id.trim() || null;
      const body = {
        ano_carteira: exerciseYear,
        nome: form.nome.trim(),
        cpf: form.cpf.trim() || null,
        telefone: form.telefone.trim() || null,
        email: form.email.trim() || null,
        observacoes: form.observacoes.trim() || null,
        tipo_precificacao: tipo,
        valor_personalizado: tipo === "personalizado" ? valorPersonalizado : null,
        asaas_customer_id: asaasId,
      };
      if (editingManualId != null) {
        await updateClienteManual(editingManualId, {
          nome: body.nome,
          cpf: body.cpf,
          telefone: body.telefone,
          email: body.email,
          observacoes: body.observacoes,
          tipo_precificacao: body.tipo_precificacao,
          valor_personalizado: body.valor_personalizado,
          asaas_customer_id: asaasId,
        });
      } else {
        await createClienteManual(body);
      }
      setModalOpen(false);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro ao guardar");
    }
  }

  async function onDeleteManual() {
    if (editingManualId == null) return;
    if (!confirm("Remover este cadastro da carteira deste exercício?")) return;
    setErr(null);
    setCenterBanner(null);
    try {
      await deleteClienteManual(editingManualId, exerciseYear);
      setModalOpen(false);
      await load();
    } catch (ex) {
      const msg = ex instanceof Error ? ex.message : "Erro ao remover";
      setCenterBanner({ kind: "error", text: msg });
    }
  }

  async function onExcluirLinha(row: ClienteListRow) {
    if (!confirm(`Excluir «${row.nome}» desta carteira (${anoExercicioLabel(exerciseYear)})?`)) return;
    setErr(null);
    setCenterBanner(null);
    setDeletingId(row.manual_id);
    try {
      await deleteClienteManual(row.manual_id, exerciseYear);
      await load();
    } catch (ex) {
      const msg = ex instanceof Error ? ex.message : "Erro ao excluir";
      setCenterBanner({ kind: "error", text: msg });
    } finally {
      setDeletingId(null);
    }
  }

  async function onToggleAtivo(row: ClienteListRow) {
    const next = !row.ativo;
    setErr(null);
    setCenterBanner(null);
    setTogglingKey(row.estado_key);
    try {
      await toggleClienteAtivo({
        estado_key: row.estado_key,
        ativo: next,
        ano_calendario: exerciseYear,
      });
      await load();
    } catch (ex) {
      const msg = ex instanceof Error ? ex.message : "Não foi possível alterar o estado";
      setCenterBanner({ kind: "error", text: msg });
    } finally {
      setTogglingKey(null);
    }
  }

  async function onSincronizarBd() {
    setErr(null);
    setInfoMsg(null);
    setCenterBanner(null);
    setLoading(true);
    try {
      const r = await sincronizarClientesDeclaracoes(exerciseYear);
      setInfoMsg(r.message);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro ao sincronizar");
    } finally {
      setLoading(false);
    }
  }

  async function onImportarAnoAnterior() {
    const origem = exerciseYear - 1;
    if (origem < ANO_MIN) {
      setErr(`Não há ano-calendário anterior válido (mín. ${ANO_MIN}).`);
      return;
    }
    if (
      !confirm(
        `Importar para ${exerciseYear} os contribuintes que tinham declaração em ${origem} e ainda não têm declaração nem cadastro neste exercício? A coluna «Declarações» ficará vazia até existir declaração registada (ex.: pasta monitorada).`,
      )
    ) {
      return;
    }
    setErr(null);
    setInfoMsg(null);
    setCenterBanner(null);
    setLoading(true);
    try {
      const r = await importarClientesDoAno({ ano_origem: origem, ano_destino: exerciseYear });
      setInfoMsg(r.message);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro ao importar");
    } finally {
      setLoading(false);
    }
  }

  function declLink(row: ClienteListRow): string {
    if (row.cpf_digits && row.cpf_digits.length === 11) {
      return `/declaracoes?cpf=${encodeURIComponent(row.cpf_digits)}`;
    }
    return `/declaracoes?nome=${encodeURIComponent(row.nome)}`;
  }

  return (
    <>
      <header className="top-bar">
        <div>
          <h2>Clientes</h2>
          <p className="top-bar-meta">Carteira por exercício — alimentada por sincronização com o BD ou importação.</p>
        </div>
        <div className="top-bar-actions">
          <div className="year-cycle-nav" aria-label="Ano-calendário / exercício">
            <button
              type="button"
              disabled={exerciseYear <= ANO_MIN || loading}
              onClick={() => setExerciseYear((y) => Math.max(ANO_MIN, y - 1))}
            >
              −
            </button>
            <span className="year-cycle-label">{anoExercicioLabel(exerciseYear)}</span>
            <button
              type="button"
              disabled={exerciseYear >= ANO_MAX || loading}
              onClick={() => setExerciseYear((y) => Math.min(ANO_MAX, y + 1))}
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading}
            onClick={() => void onSincronizarBd()}
            title="Criar linhas na carteira a partir das declarações deste ano já salvas no banco"
          >
            Sincronizar com declarações (BD)
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={loading || exerciseYear <= ANO_MIN}
            onClick={() => void onImportarAnoAnterior()}
            title={`Importar contribuintes das declarações de ${exerciseYear - 1}`}
          >
            Importar do ano anterior
          </button>
          <button type="button" className="btn btn-ghost" disabled={loading} onClick={openNovo}>
            Cadastro manual
          </button>
          <button type="button" className="btn btn-ghost" disabled={loading} onClick={() => void load()}>
            Carregar lista
          </button>
        </div>
      </header>
      <main className="content-area">
        {err ? <div className="error-toast">{err}</div> : null}
        {infoMsg ? <div className="info-toast">{infoMsg}</div> : null}
        <div className="content-card">
          <p className="monitor-hint" style={{ marginTop: 0 }}>
            Ao mudar o <strong>exercício</strong>, a tabela é esvaziada até você carregar dados.{" "}
            <strong>Importado (ano ant.)</strong>: a coluna <strong>Declarações</strong> permanece vazia até existir
            declaração deste exercício (ex.: monitoramento de pasta). <strong>Sinc. declarações</strong> reflete já o
            número no banco. Inativar ou excluir é bloqueado se houver <strong>declaração</strong> ou{" "}
            <strong>procuração</strong> cadastrada para o contribuinte neste ano (mensagem central pode ser fechada).
          </p>
          <div className="toolbar-inline" style={{ marginBottom: "0.75rem" }}>
            <label className="filter-label" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              Filtrar por responsável
              <select
                className="declaracoes-resp-select"
                value={filterResponsavel === "" ? "" : String(filterResponsavel)}
                onChange={(e) => {
                  const v = e.target.value;
                  setFilterResponsavel(v === "" ? "" : Number.parseInt(v, 10));
                }}
                disabled={loading}
                aria-label="Filtrar clientes pelo responsável da declaração"
              >
                <option value="">Todos</option>
                {usuarios
                  .slice()
                  .sort((a, b) => a.nome.localeCompare(b.nome, "pt"))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                      {!u.ativo ? " (inativo)" : ""}
                    </option>
                  ))}
              </select>
            </label>
            {filterResponsavel !== "" && rows.length > 0 ? (
              <span className="cell-sub">
                {displayedRows.length} de {rows.length} cliente(s)
              </span>
            ) : null}
            <span style={{ flex: 1, minWidth: "0.5rem" }} aria-hidden />
            <button
              type="button"
              className="btn btn-ghost"
              disabled={loading}
              onClick={onExportPdf}
              title="Gerar PDF com os clientes visíveis (respeita o filtro de responsável)"
            >
              Relatório PDF
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={loading}
              onClick={onExportExcel}
              title="Gerar Excel com os clientes visíveis (respeita o filtro de responsável)"
            >
              Relatório Excel
            </button>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Origem</th>
                  <th>Declarações</th>
                  <th>Responsável (decl.)</th>
                  <th>Honorários</th>
                  <th>Situação</th>
                  <th>Telefone</th>
                  <th>E-mail</th>
                  <th style={{ width: "6.5rem" }} aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, idx) => (
                  <tr key={`${r.estado_key}-${idx}`} className={!r.ativo ? "cliente-row-inativa" : undefined}>
                    <td className="cell-strong">{r.nome}</td>
                    <td>{r.cpf_exibicao ?? "—"}</td>
                    <td>
                      <span className={`badge ${origemBadgeClass(r.origem_cadastro)}`}>
                        {ORIGEM_LABEL[r.origem_cadastro] ?? r.origem_cadastro}
                      </span>
                    </td>
                    <td>{r.declaracoes_count ?? "—"}</td>
                    <td title={r.declaracao_responsaveis ?? undefined}>
                      {r.declaracao_responsaveis ? (
                        <span className="cell-strong">{r.declaracao_responsaveis}</span>
                      ) : (
                        <span className="cell-sub">—</span>
                      )}
                    </td>
                    <td>
                      {r.honorarios_em_aberto ? (
                        <span className="cliente-hon-aberto" title="Cobrança sem pagamento registrado">
                          Em aberto
                        </span>
                      ) : (
                        <span className="cell-sub">—</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`btn-status-toggle ${r.ativo ? "btn-status-toggle--ativo" : "btn-status-toggle--inativo"}`}
                        disabled={loading || togglingKey === r.estado_key}
                        onClick={() => void onToggleAtivo(r)}
                        title="Alternar ativo / inativo"
                      >
                        {r.ativo ? "Ativo" : "Inativo"}
                      </button>
                    </td>
                    <td>{r.telefone ?? "—"}</td>
                    <td>{r.email ?? "—"}</td>
                    <td>
                      <div className="cliente-actions-cell">
                        <button
                          type="button"
                          className="btn-icon"
                          title="Editar cadastro do cliente"
                          aria-label={`Editar ${r.nome}`}
                          onClick={() => openEditManual(r)}
                        >
                          <IconPencil />
                        </button>
                        <Link
                          className="btn btn-ghost btn-small cliente-link-decl"
                          to={declLink(r)}
                          title="Ir às declarações (filtrado)"
                        >
                          Decl.
                        </Link>
                        <button
                          type="button"
                          className="btn-icon btn-icon--danger"
                          title="Excluir desta carteira"
                          aria-label={`Excluir ${r.nome}`}
                          disabled={loading || deletingId === r.manual_id}
                          onClick={() => void onExcluirLinha(r)}
                        >
                          <IconX />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacao {...paginacaoProps} />
          {!rows.length && !loading ? (
            <p className="empty">Nenhum cliente nesta carteira. Use as ações acima.</p>
          ) : null}
          {rows.length > 0 && displayedRows.length === 0 && !loading ? (
            <p className="empty">Nenhum cliente com o responsável selecionado neste exercício.</p>
          ) : null}
        </div>
      </main>

      {centerBanner ? (
        <div
          className="cliente-screen-banner-overlay"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="cliente-banner-title"
          onClick={() => setCenterBanner(null)}
        >
          <div
            className={`cliente-screen-banner ${centerBanner.kind === "error" ? "cliente-screen-banner--error" : "cliente-screen-banner--info"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <p id="cliente-banner-title" style={{ margin: 0 }}>
              {centerBanner.text}
            </p>
            <button
              type="button"
              className="cliente-screen-banner__close"
              aria-label="Fechar aviso"
              onClick={() => setCenterBanner(null)}
            >
              ×
            </button>
          </div>
        </div>
      ) : null}

      {modalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setModalOpen(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-labelledby="cliente-manual-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="cliente-manual-title">{editingManualId != null ? "Editar cliente" : "Novo cliente manual"}</h2>
            <p className="monitor-hint" style={{ marginTop: 0 }}>
              Cadastro na carteira do exercício <strong>{anoExercicioLabel(exerciseYear)}</strong> (ano-calendário{" "}
              {exerciseYear}).
            </p>
            <form className="form-grid cols-2" onSubmit={onSubmitManual}>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Nome completo</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  required
                />
              </div>
              <div className="field">
                <label>CPF</label>
                <input type="text" value={form.cpf} onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))} />
              </div>
              <div className="field">
                <label>Telefone</label>
                <input
                  type="text"
                  value={form.telefone}
                  onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Tipo de precificação</label>
                <select
                  value={form.tipo_precificacao}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      tipo_precificacao: e.target.value as TipoPrecificacaoCliente,
                      valor_personalizado:
                        e.target.value === "personalizado" ? f.valor_personalizado : "",
                    }))
                  }
                >
                  {TIPO_PRECIFICACAO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="cell-sub" style={{ marginTop: "0.35rem" }}>
                  Valores de referência (padrão, mínimo, máximo, bonificado):{" "}
                  <strong>Configurações → Preferências → Precificação</strong>. «Personalizado» usa o valor abaixo.
                </p>
              </div>
              {form.tipo_precificacao === "personalizado" ? (
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Valor personalizado (R$)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.valor_personalizado}
                    onChange={(e) => setForm((f) => ({ ...f, valor_personalizado: e.target.value }))}
                    placeholder="ex.: 450,00"
                    required
                  />
                </div>
              ) : null}
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>ID do cliente no Asaas (opcional)</label>
                <input
                  type="text"
                  value={form.asaas_customer_id}
                  onChange={(e) => setForm((f) => ({ ...f, asaas_customer_id: e.target.value }))}
                  placeholder="ex.: cus_000000000000"
                  autoComplete="off"
                />
                <p className="cell-sub" style={{ marginTop: "0.35rem" }}>
                  Necessário para gerar cobrança em <strong>Precificação e Cobrança</strong> (valor = honorário
                  calculado).
                </p>
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Observações</label>
                <textarea value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))} />
              </div>
              <div className="actions-row" style={{ gridColumn: "1 / -1" }}>
                <button type="submit" className="btn btn-primary">
                  Guardar
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                {editingManualId != null ? (
                  <button type="button" className="btn btn-danger" onClick={() => void onDeleteManual()}>
                    Remover cadastro
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Paginacao } from "../components/Paginacao";
import { usePaginacao } from "../hooks/usePaginacao";
import {
  createDeclaracao,
  deleteDeclaracao,
  fetchDeclaracoes,
  fetchUsuarios,
  patchDeclaracao,
  sincronizarPastaIrpf,
} from "../api/client";
import {
  ANO_MAX,
  ANO_MIN,
  RFB_STATUS_CODES,
  RFB_STATUS_META,
  anoExercicioLabel,
  defaultExerciseYear,
  rfbStatusBadgeClass,
  type RfbStatusCode,
} from "../constants/rfbAndExercise";
import { Declaracao } from "../interfaces/IDeclaracao";
import { Usuario } from "../interfaces/IUsuario";

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  em_edicao: "Em edição",
  gravada: "Gravada (Aguardando Envio)",
  entregue: "Transmitida",
};

const RESULT_LABEL: Record<string, string> = {
  isento: "Isento",
  imposto_pagar: "Imposto a pagar",
  restituir: "Restituir",
  nao_informado: "Não informado",
};

function RfbStatusCell({ declaracao: d }: { declaracao: Declaracao }) {
  const code = (d.status_processamento_rfb ?? "").trim();
  if (!code) {
    return <span className="cell-sub">—</span>;
  }
  const known = RFB_STATUS_CODES.includes(code as RfbStatusCode);
  const meta = known ? RFB_STATUS_META[code as RfbStatusCode] : null;
  const title = meta ? (meta.hint ? `${meta.title} (${meta.hint})` : meta.title) : code;
  return (
    <span className={rfbStatusBadgeClass(code)} title={title}>
      <span className="badge-rfb-title">{meta?.title ?? code}</span>
      {meta?.hint ? <span className="badge-rfb-hint">{meta.hint}</span> : null}
    </span>
  );
}

function formatBRL(v: string | number | null | undefined): string {
  const n = Number(v);
  if (Number.isNaN(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseOptionalMoney(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim().replace(/\s/g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function normalizeCpfDigits(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\D/g, "").slice(0, 11);
}

function resultadoCellClass(r: string | null | undefined): string {
  if (r === "restituir") return "result-restituir";
  if (r === "imposto_pagar") return "result-imposto";
  if (r === "isento") return "result-isento";
  return "result-unknown";
}

function IconChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const emptyForm = {
  ano_calendario: defaultExerciseYear(),
  titular_nome: "",
  titular_cpf: "",
  status: "em_edicao",
  resultado_fiscal: "" as string,
  valor_imposto_ou_restituicao: "" as string,
  rendimentos_tributaveis_total: "" as string,
  rendimentos_isentos_total: "" as string,
  patrimonio_liquido_declarado: "" as string,
  status_processamento_rfb: "" as string,
};

export function DeclaracoesPage() {
  const [searchParams] = useSearchParams();
  const [exerciseYear, setExerciseYear] = useState(() =>
    Math.min(ANO_MAX, Math.max(ANO_MIN, defaultExerciseYear())),
  );
  const [statusFilter, setStatusFilter] = useState("");
  const [cpfBusca, setCpfBusca] = useState(() => searchParams.get("cpf") ?? "");
  const [nomeBusca, setNomeBusca] = useState(() => searchParams.get("nome") ?? "");
  const [list, setList] = useState<Declaracao[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Declaracao | null>(null);
  const [novaOpen, setNovaOpen] = useState(false);
  const [openArquivosId, setOpenArquivosId] = useState<number | null>(null);
  const [replicandoResp, setReplicandoResp] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [rows, users] = await Promise.all([
        fetchDeclaracoes({
          ano: exerciseYear,
          status: statusFilter || undefined,
        }),
        fetchUsuarios(),
      ]);
      setList(rows);
      setUsuarios(users);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao listar");
    } finally {
      setLoading(false);
    }
  }, [exerciseYear, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const c = searchParams.get("cpf");
    const n = searchParams.get("nome");
    if (c !== null) setCpfBusca(c);
    if (n !== null) setNomeBusca(n);
  }, [searchParams]);

  const filteredList = useMemo(() => {
    let out = list;
    const d = normalizeCpfDigits(cpfBusca);
    if (d.length === 11) {
      out = out.filter((x) => normalizeCpfDigits(x.titular_cpf) === d);
    } else if (cpfBusca.trim()) {
      const partial = normalizeCpfDigits(cpfBusca);
      out = out.filter((x) => normalizeCpfDigits(x.titular_cpf).startsWith(partial));
    }
    const nl = nomeBusca.trim().toLowerCase();
    if (nl) {
      out = out.filter((x) => (x.titular_nome || "").toLowerCase().includes(nl));
    }
    return out;
  }, [list, cpfBusca, nomeBusca]);

  const { paginatedItems: pageRows, paginacaoProps, resetPage } = usePaginacao(filteredList, 20);

  // Reset page when filters change
  useEffect(() => { resetPage(); }, [cpfBusca, nomeBusca, statusFilter, resetPage]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await createDeclaracao({
        ano_calendario: Number(form.ano_calendario),
        titular_nome: form.titular_nome.trim(),
        titular_cpf: form.titular_cpf.trim() || null,
        status: form.status,
        resultado_fiscal: form.resultado_fiscal || null,
        valor_imposto_ou_restituicao: form.valor_imposto_ou_restituicao
          ? Number(form.valor_imposto_ou_restituicao.replace(",", "."))
          : null,
        rendimentos_tributaveis_total: parseOptionalMoney(form.rendimentos_tributaveis_total),
        rendimentos_isentos_total: parseOptionalMoney(form.rendimentos_isentos_total),
        patrimonio_liquido_declarado: parseOptionalMoney(form.patrimonio_liquido_declarado),
        status_processamento_rfb: form.status_processamento_rfb.trim() || null,
      });
      setForm({ ...emptyForm, ano_calendario: exerciseYear });
      setNovaOpen(false);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro ao criar");
    }
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setErr(null);
    try {
      await patchDeclaracao(editing.id, {
        titular_nome: editing.titular_nome,
        titular_cpf: editing.titular_cpf || null,
        status: editing.status,
        resultado_fiscal: editing.resultado_fiscal,
        valor_imposto_ou_restituicao: editing.valor_imposto_ou_restituicao
          ? Number(String(editing.valor_imposto_ou_restituicao).replace(",", "."))
          : null,
        rendimentos_tributaveis_total: parseOptionalMoney(editing.rendimentos_tributaveis_total),
        rendimentos_isentos_total: parseOptionalMoney(editing.rendimentos_isentos_total),
        patrimonio_liquido_declarado: parseOptionalMoney(editing.patrimonio_liquido_declarado),
        status_processamento_rfb: editing.status_processamento_rfb?.trim() || null,
      });
      setEditing(null);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro ao salvar");
    }
  }

  async function onResponsavelChange(d: Declaracao, value: string) {
    const id = value === "" ? null : Number(value);
    setErr(null);
    try {
      await patchDeclaracao(d.id, { usuario_responsavel_id: id });
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro ao atualizar responsável");
    }
  }

  async function replicarResponsavelParaBaixo(fromIndex: number) {
    const source = filteredList[fromIndex];
    if (!source) return;
    const uid = source.usuario_responsavel_id ?? null;
    const targets = filteredList.slice(fromIndex);
    setErr(null);
    setReplicandoResp(true);
    try {
      await Promise.all(
        targets.map((row) => patchDeclaracao(row.id, { usuario_responsavel_id: uid })),
      );
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro ao replicar responsável");
    } finally {
      setReplicandoResp(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Excluir esta declaração?")) return;
    setErr(null);
    try {
      await deleteDeclaracao(id);
      setEditing(null);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro ao excluir");
    }
  }

  async function onPuxarPasta() {
    setSyncMsg(null);
    setErr(null);
    try {
      const r = await sincronizarPastaIrpf();
      setSyncMsg(r.message);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro ao sincronizar");
    }
  }

  return (
    <>
      <header className="top-bar">
        <div>
          <h2>Declarações</h2>
          <p className="top-bar-meta">
            Lista de contribuintes, situação da declaração, transmissão e resultado (imposto ou restituição).
          </p>
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
        </div>
      </header>
      <main className="content-area declaracoes-page">
        {err ? <div className="error-toast">{err}</div> : null}
        {syncMsg ? <div className="info-toast">{syncMsg}</div> : null}

        <div className="declaracoes-toolbar">
          <label className="filter-label">
            Filtrar:
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ marginLeft: "0.35rem" }}
            >
              <option value="">Todos os status</option>
              <option value="em_edicao">Em edição</option>
              <option value="gravada">Gravada (Aguardando Envio)</option>
              <option value="entregue">Transmitida</option>
              <option value="rascunho">Rascunho</option>
            </select>
          </label>
          <label className="filter-label">
            CPF
            <input
              type="text"
              value={cpfBusca}
              onChange={(e) => setCpfBusca(e.target.value)}
              placeholder="Filtrar por CPF"
              style={{ marginLeft: "0.35rem", minWidth: "11rem" }}
            />
          </label>
          <label className="filter-label">
            Nome
            <input
              type="text"
              value={nomeBusca}
              onChange={(e) => setNomeBusca(e.target.value)}
              placeholder="Contém…"
              style={{ marginLeft: "0.35rem", minWidth: "12rem" }}
            />
          </label>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setForm({ ...emptyForm, ano_calendario: exerciseYear });
              setNovaOpen(true);
            }}
          >
            Nova declaração
          </button>
          <button type="button" className="btn btn-ghost" disabled={loading} onClick={() => void load()}>
            Atualizar
          </button>
          <button type="button" className="btn btn-ghost" disabled={loading} onClick={() => void onPuxarPasta()}>
            Puxar da pasta IRPF
          </button>
        </div>

        <div className="declaracoes-hint-banner">
          Clique em <strong>Puxar da pasta IRPF</strong> (após configurar a pasta em <strong>Configurações</strong>) para
          tentar preencher resultado e valor. Se não bater ano/CPF, edite o cadastro ou use <strong>Extrair…</strong> do
          XML no modal.
        </div>

        <div className="content-card">
          <div className="table-wrap declaracoes-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ano-cal.</th>
                  <th>Contribuinte</th>
                  <th title="Use a seta ao lado do nome para repetir o responsável desta linha até ao fim da lista">
                    Responsável
                  </th>
                  <th>Situação</th>
                  <th title="Situação do processamento na RFB após transmissão">Status</th>
                  <th>Resultado fiscal</th>
                  <th>Valor</th>
                  <th>Arquivos</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((d, rowIndex) => (
                  <tr key={d.id}>
                    <td className="cell-strong">{anoExercicioLabel(d.ano_calendario)}</td>
                    <td>
                      <div className="cell-strong">{d.titular_nome}</div>
                      <div className="cell-sub">{d.titular_cpf ?? "—"}</div>
                    </td>
                    <td className="table-cell-noclick">
                      <div className="declaracoes-resp-cell">
                        <select
                          className="declaracoes-resp-select"
                          value={d.usuario_responsavel_id ?? ""}
                          disabled={loading || replicandoResp}
                          onChange={(e) => void onResponsavelChange(d, e.target.value)}
                        >
                          <option value="">—</option>
                          {usuarios.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.nome}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="declaracoes-resp-replicar"
                          title="Replicar este responsável desta linha até à última linha da tabela"
                          aria-label="Replicar responsável para as linhas abaixo"
                          disabled={loading || replicandoResp || d.usuario_responsavel_id == null}
                          onClick={() => void replicarResponsavelParaBaixo(rowIndex)}
                        >
                          <IconChevronDown />
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${d.status}`}>{STATUS_LABEL[d.status] ?? d.status}</span>
                    </td>
                    <td>
                      <RfbStatusCell declaracao={d} />
                    </td>
                    <td className={resultadoCellClass(d.resultado_fiscal)}>
                      {d.resultado_fiscal ? RESULT_LABEL[d.resultado_fiscal] ?? d.resultado_fiscal : "—"}
                    </td>
                    <td>{formatBRL(d.valor_imposto_ou_restituicao)}</td>
                    <td className="table-cell-noclick">
                      <div className="arquivos-wrap">
                        <button
                          type="button"
                          className="btn-arquivos"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setOpenArquivosId((id) => (id === d.id ? null : d.id));
                          }}
                        >
                          Arquivos
                        </button>
                        {openArquivosId === d.id ? (
                          <div className="arquivos-dropdown" onClick={(ev) => ev.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditing(d);
                                setOpenArquivosId(null);
                              }}
                            >
                              Editar cadastro
                            </button>
                            <button
                              type="button"
                              disabled
                              title="Extração XML em desenvolvimento"
                            >
                              Extrair do XML…
                            </button>
                            {d.caminho_arquivo_declaracao ? (
                              <button
                                type="button"
                                onClick={() =>
                                  window.open(`/api/declaracoes/${d.id}/pdf-resumo?tipo=declaracao`, "_blank")
                                }
                              >
                                Abrir declaração (PDF)
                              </button>
                            ) : null}
                            {d.caminho_arquivo_recibo ? (
                              <button
                                type="button"
                                onClick={() =>
                                  window.open(`/api/declaracoes/${d.id}/pdf-resumo?tipo=recibo`, "_blank")
                                }
                              >
                                Abrir recibo (PDF)
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacao {...paginacaoProps} />
          {!list.length && !loading ? (
            <p className="empty">Sem declarações para este ano e filtro.</p>
          ) : !filteredList.length && !loading ? (
            <p className="empty">Nenhuma linha corresponde ao CPF / nome na lista carregada.</p>
          ) : null}
        </div>
      </main>

      {novaOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setNovaOpen(false)}>
          <div className="modal-card" role="dialog" aria-labelledby="nova-decl-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="nova-decl-title">Nova declaração</h2>
            <form className="form-grid cols-2" onSubmit={onCreate}>
              <div className="field">
                <label>Ano calendário</label>
                <input
                  type="number"
                  min={ANO_MIN}
                  max={ANO_MAX}
                  value={form.ano_calendario}
                  onChange={(e) => setForm((f) => ({ ...f, ano_calendario: Number(e.target.value) }))}
                />
              </div>
              <div className="field">
                <label>Situação</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                  <option value="em_edicao">Em edição</option>
                  <option value="entregue">Transmitida</option>
                  <option value="rascunho">Rascunho</option>
                </select>
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Nome do titular</label>
                <input
                  type="text"
                  value={form.titular_nome}
                  onChange={(e) => setForm((f) => ({ ...f, titular_nome: e.target.value }))}
                  required
                />
              </div>
              <div className="field">
                <label>CPF</label>
                <input
                  type="text"
                  value={form.titular_cpf}
                  onChange={(e) => setForm((f) => ({ ...f, titular_cpf: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>Resultado fiscal</label>
                <select
                  value={form.resultado_fiscal}
                  onChange={(e) => setForm((f) => ({ ...f, resultado_fiscal: e.target.value }))}
                >
                  <option value="">—</option>
                  <option value="isento">Isento</option>
                  <option value="imposto_pagar">Imposto a pagar</option>
                  <option value="restituir">Restituir</option>
                </select>
              </div>
              <div className="field">
                <label>Valor</label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={form.valor_imposto_ou_restituicao}
                  onChange={(e) => setForm((f) => ({ ...f, valor_imposto_ou_restituicao: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>Rend. tributáveis (total)</label>
                <input
                  type="text"
                  placeholder="opcional — Insights"
                  value={form.rendimentos_tributaveis_total}
                  onChange={(e) => setForm((f) => ({ ...f, rendimentos_tributaveis_total: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>Rend. isentos (total)</label>
                <input
                  type="text"
                  placeholder="opcional"
                  value={form.rendimentos_isentos_total}
                  onChange={(e) => setForm((f) => ({ ...f, rendimentos_isentos_total: e.target.value }))}
                />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Patrimônio líquido declarado</label>
                <input
                  type="text"
                  placeholder="opcional — quadro de bens / evolução"
                  value={form.patrimonio_liquido_declarado}
                  onChange={(e) => setForm((f) => ({ ...f, patrimonio_liquido_declarado: e.target.value }))}
                />
                <p className="cell-sub" style={{ marginTop: "0.35rem" }}>
                  Usado em Insights → Evolução de caixa (confronto com rendimentos e IR).
                </p>
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Status na RFB</label>
                <select
                  value={form.status_processamento_rfb}
                  onChange={(e) => setForm((f) => ({ ...f, status_processamento_rfb: e.target.value }))}
                >
                  <option value="">— Não aplicável / ainda não transmitida</option>
                  {RFB_STATUS_CODES.map((c) => (
                    <option key={c} value={c}>
                      {RFB_STATUS_META[c].title}
                      {RFB_STATUS_META[c].hint ? ` (${RFB_STATUS_META[c].hint})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="actions-row" style={{ gridColumn: "1 / -1" }}>
                <button type="submit" className="btn btn-primary">
                  Adicionar
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setNovaOpen(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setEditing(null)}>
          <div className="modal-card" role="dialog" onClick={(e) => e.stopPropagation()}>
            <h2>Editar #{editing.id}</h2>
            <form className="form-grid" onSubmit={onSaveEdit}>
              <div className="field">
                <label>Nome</label>
                <input
                  type="text"
                  value={editing.titular_nome}
                  onChange={(e) => setEditing({ ...editing, titular_nome: e.target.value })}
                />
              </div>
              <div className="field">
                <label>CPF</label>
                <input
                  type="text"
                  value={editing.titular_cpf ?? ""}
                  onChange={(e) => setEditing({ ...editing, titular_cpf: e.target.value || null })}
                />
              </div>
              <div className="field">
                <label>Situação (carteira)</label>
                <select
                  value={editing.status}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value as Declaracao["status"] })}
                >
                  <option value="em_edicao">Em edição</option>
                  <option value="entregue">Transmitida</option>
                  <option value="rascunho">Rascunho</option>
                </select>
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Status na RFB</label>
                <select
                  value={editing.status_processamento_rfb ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, status_processamento_rfb: e.target.value || null })
                  }
                >
                  <option value="">— Não informado</option>
                  {RFB_STATUS_CODES.map((c) => (
                    <option key={c} value={c}>
                      {RFB_STATUS_META[c].title}
                      {RFB_STATUS_META[c].hint ? ` (${RFB_STATUS_META[c].hint})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Resultado fiscal</label>
                <select
                  value={editing.resultado_fiscal ?? ""}
                  onChange={(e) => setEditing({ ...editing, resultado_fiscal: e.target.value || null })}
                >
                  <option value="">—</option>
                  <option value="isento">Isento</option>
                  <option value="imposto_pagar">Imposto a pagar</option>
                  <option value="restituir">Restituir</option>
                </select>
              </div>
              <div className="field">
                <label>Valor (R$)</label>
                <input
                  type="text"
                  value={
                    editing.valor_imposto_ou_restituicao != null
                      ? String(editing.valor_imposto_ou_restituicao)
                      : ""
                  }
                  onChange={(e) =>
                    setEditing({ ...editing, valor_imposto_ou_restituicao: e.target.value || null })
                  }
                />
              </div>
              <div className="field">
                <label>Rend. tributáveis (total)</label>
                <input
                  type="text"
                  value={
                    editing.rendimentos_tributaveis_total != null
                      ? String(editing.rendimentos_tributaveis_total)
                      : ""
                  }
                  onChange={(e) =>
                    setEditing({ ...editing, rendimentos_tributaveis_total: e.target.value || null })
                  }
                />
              </div>
              <div className="field">
                <label>Rend. isentos (total)</label>
                <input
                  type="text"
                  value={
                    editing.rendimentos_isentos_total != null ? String(editing.rendimentos_isentos_total) : ""
                  }
                  onChange={(e) =>
                    setEditing({ ...editing, rendimentos_isentos_total: e.target.value || null })
                  }
                />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Patrimônio líquido declarado</label>
                <input
                  type="text"
                  value={
                    editing.patrimonio_liquido_declarado != null
                      ? String(editing.patrimonio_liquido_declarado)
                      : ""
                  }
                  onChange={(e) =>
                    setEditing({ ...editing, patrimonio_liquido_declarado: e.target.value || null })
                  }
                />
              </div>
              <div className="actions-row">
                <button type="submit" className="btn btn-primary">
                  Guardar
                </button>
                <button type="button" className="btn btn-danger" onClick={() => void onDelete(editing.id)}>
                  Excluir
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

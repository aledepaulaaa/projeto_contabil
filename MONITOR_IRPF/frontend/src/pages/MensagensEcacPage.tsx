import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  downloadMensagensEcacTodos,
  fetchMensagensEcacCaixa,
  fetchMensagensEcacLista,
  postMensagensEcacConsultarCpf,
  postMensagensEcacConsultarLote,
  postMensagensEcacPontuais,
} from "../api/client";
import { FiltrosTitularStatus } from "../components/FiltrosTitularStatus";
import {
  ANO_MAX,
  ANO_MIN,
  SESSION_CARTEIRA_ANO_KEY,
  anoExercicioLabel,
  readStoredCarteiraAno,
} from "../constants/rfbAndExercise";
import { filtrarPorTitular } from "../utils/filtrarTitular";
import {
  exportMensagensCsv,
  exportMensagensExcel,
  exportMensagensPdf,
} from "../utils/mensagensEcacExport";
import { MensagensEcacCaixa } from "../interfaces/IMensagensEcacCaixa";
import { MensagensEcacItem } from "../interfaces/IMensagensEcaItem";

const COLUNAS = [
  { id: "nome", label: "Nome" },
  { id: "cpf", label: "CPF" },
  { id: "status", label: "Mensagens e-CAC" },
  { id: "leitura", label: "Leitura" },
  { id: "consultar", label: "Consultar novas mensagens" },
] as const;

type ColId = (typeof COLUNAS)[number]["id"];

const FILTRO_STATUS_OPTS = [
  { value: "todas_lidas", label: "Todas lidas" },
  { value: "nao_lidas", label: "Com não lidas" },
  { value: "nao_consultado", label: "Não consultado" },
];

function formatCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function badgeMsg(row: MensagensEcacItem): string {
  if (row.status_label === "Não consultado") return "badge-diag badge-msg-nao-consultado";
  if (row.todas_lidas) return "badge-diag badge-msg-todas-lidas";
  return "badge-diag badge-msg-nao-lidas";
}

function IconEnvelope() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6h16v12H4V6z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function MensagensEcacPage() {
  const [exerciseYear, setExerciseYear] = useState(readStoredCarteiraAno);
  const [itens, setItens] = useState<MensagensEcacItem[]>([]);
  const [integracaoOk, setIntegracaoOk] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [pesquisa, setPesquisa] = useState("");
  const [filtroTitular, setFiltroTitular] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [colunasOpen, setColunasOpen] = useState(false);
  const [colunasVisiveis, setColunasVisiveis] = useState<Set<ColId>>(() => new Set(COLUNAS.map((c) => c.id)));
  const [consultandoLote, setConsultandoLote] = useState(false);
  const [consultandoCpf, setConsultandoCpf] = useState<string | null>(null);
  const [caixa, setCaixa] = useState<MensagensEcacCaixa | null>(null);
  const [caixaLoading, setCaixaLoading] = useState(false);
  const [pontualOpen, setPontualOpen] = useState(false);
  const [pontualCpf, setPontualCpf] = useState("");
  const [pontualLoading, setPontualLoading] = useState(false);
  const colunasRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchMensagensEcacLista(exerciseYear);
      setItens(data.itens);
      setIntegracaoOk(data.integracao_habilitada);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao carregar");
      setItens([]);
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
    void load();
  }, [load]);

  useEffect(() => {
    setPesquisa("");
    setFiltroTitular("");
    setFiltroStatus("");
  }, [exerciseYear]);

  useEffect(() => {
    if (!colunasOpen) return;
    function onDocClick(e: MouseEvent) {
      if (colunasRef.current && !colunasRef.current.contains(e.target as Node)) {
        setColunasOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [colunasOpen]);

  const itensFiltrados = useMemo(() => {
    let list = filtrarPorTitular(itens, filtroTitular || pesquisa, (r) => r.nome, (r) => r.cpf);
    if (filtroStatus === "todas_lidas") {
      list = list.filter((r) => r.todas_lidas);
    } else if (filtroStatus === "nao_lidas") {
      list = list.filter((r) => r.nao_lidas > 0);
    } else if (filtroStatus === "nao_consultado") {
      list = list.filter((r) => r.status_label === "Não consultado");
    }
    return list;
  }, [itens, filtroTitular, pesquisa, filtroStatus]);

  const col = (id: ColId) => colunasVisiveis.has(id);

  async function onConsultarLote() {
    setConsultandoLote(true);
    setErr(null);
    setInfoMsg(null);
    try {
      const r = await postMensagensEcacConsultarLote(exerciseYear);
      setInfoMsg(r.message);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro na consulta em lote");
    } finally {
      setConsultandoLote(false);
    }
  }

  async function onConsultarLinha(row: MensagensEcacItem) {
    setConsultandoCpf(row.cpf);
    setErr(null);
    try {
      const r = await postMensagensEcacConsultarCpf(row.cpf, exerciseYear);
      setInfoMsg(`${row.nome}: ${r.message}`);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro na consulta");
    } finally {
      setConsultandoCpf(null);
    }
  }

  async function onAbrirLeitura(row: MensagensEcacItem) {
    setCaixaLoading(true);
    setErr(null);
    try {
      const c = await fetchMensagensEcacCaixa(row.cpf, exerciseYear, true);
      setCaixa(c);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Consulte as mensagens antes de abrir a leitura");
    } finally {
      setCaixaLoading(false);
    }
  }

  async function onPontuaisSubmit(e: React.FormEvent) {
    e.preventDefault();
    const d = pontualCpf.replace(/\D/g, "");
    if (d.length !== 11) {
      setErr("Informe um CPF válido com 11 dígitos.");
      return;
    }
    setPontualLoading(true);
    setErr(null);
    try {
      const r = await postMensagensEcacPontuais({ cpf: d, ano_calendario: exerciseYear });
      setInfoMsg(r.message);
      setPontualOpen(false);
      setPontualCpf("");
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro na consulta pontual");
    } finally {
      setPontualLoading(false);
    }
  }

  return (
    <>
      <header className="top-bar">
        <div>
          <h2>Mensagens do e-CAC</h2>
          <p className="top-bar-meta">
            Caixa de mensagens dos contribuintes da carteira ({anoExercicioLabel(exerciseYear)}).{" "}
            <Link to="/configuracoes">API RFB / Contador</Link>.
          </p>
        </div>
        <div className="top-bar-actions">
          <div className="year-cycle-nav" aria-label="Ano-calendário / exercício">
            <button
              type="button"
              disabled={exerciseYear <= ANO_MIN || loading || consultandoLote}
              onClick={() => setExerciseYear((y) => Math.max(ANO_MIN, y - 1))}
            >
              −
            </button>
            <span className="year-cycle-label">{anoExercicioLabel(exerciseYear)}</span>
            <button
              type="button"
              disabled={exerciseYear >= ANO_MAX || loading || consultandoLote}
              onClick={() => setExerciseYear((y) => Math.min(ANO_MAX, y + 1))}
            >
              +
            </button>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => setFiltroAberto((v) => !v)}>
            Filtro
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ background: "var(--success)" }}
            disabled={consultandoLote || loading}
            onClick={() => void onConsultarLote()}
          >
            {consultandoLote ? "Consultando…" : "Consultar novas mensagens em lote"}
          </button>
          <button type="button" className="btn btn-primary" style={{ background: "var(--success)" }} onClick={() => setPontualOpen(true)}>
            Mensagens pontuais e-CAC
          </button>
        </div>
      </header>

      <main className="content-area">
        {err ? <div className="error-toast">{err}</div> : null}
        {infoMsg ? <div className="info-toast">{infoMsg}</div> : null}
        {!integracaoOk ? (
          <div className="info-toast">API RFB inativa — dados de simulação. Ative em Configurações para consultas reais.</div>
        ) : null}

        <div className="content-card">
          {filtroAberto ? (
            <div className="diag-filtro-panel">
              <FiltrosTitularStatus
                titular={filtroTitular}
                onTitularChange={setFiltroTitular}
                status={filtroStatus}
                onStatusChange={setFiltroStatus}
                statusOptions={FILTRO_STATUS_OPTS}
                statusLabel="Situação das mensagens"
              />
            </div>
          ) : null}

          <div className="diag-ecac-toolbar">
            <div className="diag-ecac-toolbar-left">
              <button
                type="button"
                className="btn btn-ghost diag-ecac-export-btn"
                disabled={!itensFiltrados.length}
                onClick={() => exportMensagensExcel(itensFiltrados, exerciseYear)}
              >
                EXCEL
              </button>
              <button
                type="button"
                className="btn btn-ghost diag-ecac-export-btn"
                disabled={!itensFiltrados.length}
                onClick={() => exportMensagensPdf(itensFiltrados, exerciseYear)}
              >
                PDF
              </button>
              <button
                type="button"
                className="btn btn-ghost diag-ecac-export-btn"
                disabled={!itensFiltrados.length}
                onClick={() => exportMensagensCsv(itensFiltrados, exerciseYear)}
              >
                CSV
              </button>
              <button
                type="button"
                className="btn btn-ghost diag-ecac-export-btn"
                disabled={loading}
                onClick={() =>
                  void downloadMensagensEcacTodos(exerciseYear)
                    .then(() => setInfoMsg("Pacote JSON exportado."))
                    .catch((ex) => setErr(ex instanceof Error ? ex.message : "Erro no export"))
                }
              >
                JSON (todos)
              </button>
              <div className="diag-colunas-menu" ref={colunasRef}>
                <button type="button" className="btn btn-ghost diag-ecac-export-btn" onClick={() => setColunasOpen((v) => !v)}>
                  COLUNAS ▾
                </button>
                {colunasOpen ? (
                  <div className="diag-colunas-popover">
                    {COLUNAS.map((c) => (
                      <label key={c.id}>
                        <input
                          type="checkbox"
                          checked={colunasVisiveis.has(c.id)}
                          onChange={() => {
                            setColunasVisiveis((prev) => {
                              const next = new Set(prev);
                              if (next.has(c.id)) {
                                if (next.size > 1) next.delete(c.id);
                              } else {
                                next.add(c.id);
                              }
                              return next;
                            });
                          }}
                        />
                        {c.label}
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="diag-ecac-toolbar-right">
              <input
                type="search"
                className="diag-ecac-search"
                placeholder="Pesquisar"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                aria-label="Pesquisar na tabela"
              />
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {col("nome") ? <th>Nome</th> : null}
                  {col("cpf") ? <th>CPF</th> : null}
                  {col("status") ? <th>Mensagens e-CAC</th> : null}
                  {col("leitura") ? <th>Leitura</th> : null}
                  {col("consultar") ? <th>Consultar novas mensagens</th> : null}
                </tr>
              </thead>
              <tbody>
                {itensFiltrados.map((row) => (
                  <tr key={row.cpf}>
                    {col("nome") ? <td>{row.nome}</td> : null}
                    {col("cpf") ? <td>{formatCpf(row.cpf)}</td> : null}
                    {col("status") ? (
                      <td>
                        <span className={badgeMsg(row)}>{row.status_label}</span>
                      </td>
                    ) : null}
                    {col("leitura") ? (
                      <td>
                        <button
                          type="button"
                          className="diag-ecac-icon-btn diag-ecac-icon-btn--leitura"
                          title="Abrir caixa de mensagens (marca como lidas)"
                          disabled={caixaLoading || row.total_mensagens === 0}
                          onClick={() => void onAbrirLeitura(row)}
                        >
                          <IconEnvelope />
                        </button>
                      </td>
                    ) : null}
                    {col("consultar") ? (
                      <td>
                        <button
                          type="button"
                          className="btn-diag-atualizar"
                          disabled={consultandoCpf === row.cpf || consultandoLote}
                          onClick={() => void onConsultarLinha(row)}
                        >
                          {consultandoCpf === row.cpf ? "…" : "Consultar"}
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!itens.length && !loading ? (
            <p className="empty">Nenhum contribuinte com CPF na carteira deste exercício.</p>
          ) : null}
          {itens.length > 0 && !itensFiltrados.length && !loading ? (
            <p className="empty">Nenhum resultado com os filtros aplicados.</p>
          ) : null}
          {loading ? <p className="monitor-hint">A carregar…</p> : null}
        </div>
      </main>

      {caixa ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setCaixa(null)}>
          <div
            className="modal-card"
            role="dialog"
            aria-labelledby="caixa-ecac-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "42rem", maxHeight: "85vh", overflow: "auto" }}
          >
            <h2 id="caixa-ecac-title">
              Caixa e-CAC — {caixa.nome}
            </h2>
            <p className="monitor-hint" style={{ marginTop: 0 }}>
              {formatCpf(caixa.cpf)} · {caixa.total_mensagens} mensagem(ns) · abertura marcou como lidas
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "1rem 0 0" }}>
              {caixa.mensagens.map((m) => (
                <li
                  key={m.id}
                  style={{
                    padding: "0.75rem",
                    marginBottom: "0.5rem",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    background: m.lida ? "#f9fafb" : "#fffde7",
                  }}
                >
                  <strong>{m.assunto}</strong>
                  <div className="cell-sub">
                    {m.data} · {m.lida ? "Lida" : "Não lida"}
                  </div>
                  {m.corpo_resumo ? <p style={{ margin: "0.35rem 0 0", fontSize: "0.9rem" }}>{m.corpo_resumo}</p> : null}
                </li>
              ))}
            </ul>
            <div className="actions-row" style={{ marginTop: "1rem" }}>
              <button type="button" className="btn btn-ghost" onClick={() => setCaixa(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pontualOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => !pontualLoading && setPontualOpen(false)}>
          <div className="modal-card" role="dialog" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Mensagens pontuais e-CAC</h2>
            <p className="monitor-hint">Consulta por CPF (11 dígitos), mesmo fora da lista visível.</p>
            <form className="form-grid cols-1" onSubmit={onPontuaisSubmit}>
              <div className="field">
                <label htmlFor="pontual-cpf">CPF do contribuinte</label>
                <input
                  id="pontual-cpf"
                  type="text"
                  inputMode="numeric"
                  value={pontualCpf}
                  onChange={(e) => setPontualCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  disabled={pontualLoading}
                />
              </div>
              <div className="actions-row">
                <button type="submit" className="btn btn-primary" disabled={pontualLoading}>
                  {pontualLoading ? "Consultando…" : "Consultar"}
                </button>
                <button type="button" className="btn btn-ghost" disabled={pontualLoading} onClick={() => setPontualOpen(false)}>
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

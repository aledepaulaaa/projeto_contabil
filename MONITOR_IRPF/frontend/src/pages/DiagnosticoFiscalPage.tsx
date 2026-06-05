import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  downloadDiagnosticoFiscalCpf,
  downloadDiagnosticoFiscalTodos,
  fetchDiagnosticoFiscalDetalhes,
  fetchDiagnosticoFiscalLista,
  postDiagnosticoFiscalAtualizarAno,
  postDiagnosticoFiscalAtualizarCpf,
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
  exportDiagnosticoCsv,
  exportDiagnosticoExcel,
  exportDiagnosticoPdf,
} from "../utils/diagnosticoFiscalExport";
import { DiagnosticoFiscalDetalhe } from "../interfaces/IDiagnosticoFiscalDetalhe";
import { DiagnosticoFiscalItem } from "../interfaces/IDiagnosticoFiscalItem";

const COLUNAS = [
  { id: "nome", label: "Nome" },
  { id: "cpf", label: "CPF" },
  { id: "situacao", label: "Situação" },
  { id: "acoes", label: "Ações" },
  { id: "historico", label: "Histórico" },
  { id: "atualizar", label: "Atualizar" },
] as const;

type ColId = (typeof COLUNAS)[number]["id"];

const SITUACAO_OPTS = [
  { value: "regular", label: "Regular" },
  { value: "pendencia", label: "Pendência" },
  { value: "erro", label: "Erro na consulta" },
  { value: "nao_consultado", label: "Não consultado" },
];

function formatCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function badgeDiag(situacao: string): string {
  if (situacao === "regular") return "badge-diag badge-diag-regular";
  if (situacao === "pendencia") return "badge-diag badge-diag-pendencia";
  return "badge-diag badge-diag-erro";
}

function whatsappDigits(tel: string | null): string | null {
  if (!tel) return null;
  const d = tel.replace(/\D/g, "");
  if (d.length < 10) return null;
  return d.startsWith("55") ? d : `55${d}`;
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6h16v12H4V6z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l4.93-1.29A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm4.2 13.8c-.2.6-1.1 1.1-1.5 1.1-.4 0-.9.2-3.1-.9-2.6-1.2-4.3-4.2-4.4-4.4-.1-.2-1-1.3-1-2.5s.6-1.8.9-2c.2-.2.5-.3.7-.3h.5c.2 0 .4-.1.6.4l.8 1.9c.1.2.1.4 0 .6-.1.2-.2.3-.4.4l-.3.2c-.1.1-.2.2-.1.4.1.3.6 1.4 2.2 2.3 1.4.8 1.6.7 1.9.6.2-.1.3-.2.5-.4l.6-.7c.2-.2.3-.2.6-.1l1.9.9c.3.1.5.2.4.5z" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 4v10M8 11l4 4 4-4" />
      <path d="M5 20h14" />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M8 4h8l2 2v14H6V4h2z" />
      <path d="M14 4v4h4M10 12h6M10 16h4" />
    </svg>
  );
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export function DiagnosticoFiscalPage() {
  const [exerciseYear, setExerciseYear] = useState(readStoredCarteiraAno);
  const [itens, setItens] = useState<DiagnosticoFiscalItem[]>([]);
  const [rfbEnabled, setRfbEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [pesquisa, setPesquisa] = useState("");
  const [filtroTitular, setFiltroTitular] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState("");
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [colunasOpen, setColunasOpen] = useState(false);
  const [colunasVisiveis, setColunasVisiveis] = useState<Set<ColId>>(() => new Set(COLUNAS.map((c) => c.id)));
  const [atualizandoTodos, setAtualizandoTodos] = useState(false);
  const [atualizandoCpf, setAtualizandoCpf] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<DiagnosticoFiscalDetalhe | null>(null);
  const [detalheLoading, setDetalheLoading] = useState(false);
  const colunasRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchDiagnosticoFiscalLista(exerciseYear);
      setItens(data.itens);
      setRfbEnabled(data.rfb_habilitado);
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
    setFiltroSituacao("");
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
    if (filtroSituacao) {
      list = list.filter((r) => r.situacao === filtroSituacao);
    }
    return list;
  }, [itens, filtroTitular, pesquisa, filtroSituacao]);

  const col = (id: ColId) => colunasVisiveis.has(id);

  async function onAtualizarTodos() {
    setAtualizandoTodos(true);
    setErr(null);
    setInfoMsg(null);
    try {
      const r = await postDiagnosticoFiscalAtualizarAno(exerciseYear);
      setInfoMsg(r.message);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao atualizar");
    } finally {
      setAtualizandoTodos(false);
    }
  }

  async function onAtualizarLinha(row: DiagnosticoFiscalItem) {
    setAtualizandoCpf(row.cpf);
    setErr(null);
    try {
      const r = await postDiagnosticoFiscalAtualizarCpf(row.cpf, exerciseYear);
      setInfoMsg(`${row.nome}: ${r.message}`);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro na consulta");
    } finally {
      setAtualizandoCpf(null);
    }
  }

  async function onVerHistorico(row: DiagnosticoFiscalItem) {
    setDetalheLoading(true);
    try {
      const d = await fetchDiagnosticoFiscalDetalhes(row.cpf, exerciseYear);
      setDetalhe(d);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sem histórico — atualize primeiro");
    } finally {
      setDetalheLoading(false);
    }
  }

  async function onBaixarTodos() {
    setErr(null);
    try {
      await downloadDiagnosticoFiscalTodos(exerciseYear);
      setInfoMsg("Pacote JSON com todos os diagnósticos guardados transferido.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro no download");
    }
  }

  function renderDetalheCorpo(d: DiagnosticoFiscalDetalhe) {
    const infos = d.resultado?.infosimples;
    const isResp = isRecord(infos) ? infos : null;
    const dataArr = Array.isArray(isResp?.data) ? (isResp.data as unknown[]) : [];
    const bloco = isRecord(dataArr[0]) ? dataArr[0] : null;
    return (
      <>
        <p style={{ marginTop: 0 }}>
          <span className={badgeDiag(d.situacao)}>{d.situacao_label}</span>
        </p>
        {d.historico.length ? (
          <div style={{ marginTop: "1rem" }}>
            <strong>Histórico de consultas</strong>
            <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
              {d.historico.map((h, i) => (
                <li key={i}>
                  {h.consultado_em ? `${new Date(h.consultado_em).toLocaleString("pt-BR")} — ` : ""}
                  {h.situacao_label ?? h.situacao ?? "—"}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {bloco ? (
          <div style={{ marginTop: "1rem" }}>
            <p>
              <strong>{typeof bloco.nome === "string" ? bloco.nome : d.nome}</strong>
            </p>
            {Array.isArray(bloco.pendencias_receita_federal) && bloco.pendencias_receita_federal.length > 0 ? (
              <div>
                <strong>Pendências Receita Federal</strong>
                <ul>
                  {(bloco.pendencias_receita_federal as unknown[]).map((p, idx) => (
                    <li key={idx}>{typeof p === "string" ? p : JSON.stringify(p)}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {Array.isArray(bloco.pendencias_procuradoria_geral) && bloco.pendencias_procuradoria_geral.length > 0 ? (
              <div style={{ marginTop: "0.75rem" }}>
                <strong>Pendências PGFN</strong>
                <ul>
                  {(bloco.pendencias_procuradoria_geral as unknown[]).map((p, idx) => (
                    <li key={idx}>{typeof p === "string" ? p : JSON.stringify(p)}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
        {d.resultado && typeof d.resultado.message === "string" ? (
          <p className="monitor-hint" style={{ marginTop: "1rem" }}>
            {d.resultado.message}
          </p>
        ) : null}
        <details style={{ marginTop: "1rem" }}>
          <summary className="cell-sub" style={{ cursor: "pointer" }}>
            JSON completo
          </summary>
          <pre className="mono-path" style={{ fontSize: "0.78rem", whiteSpace: "pre-wrap" }}>
            {JSON.stringify(d.resultado, null, 2)}
          </pre>
        </details>
      </>
    );
  }

  return (
    <>
      <header className="top-bar">
        <div>
          <h2>Situação Fiscal e-CAC — CPF</h2>
          <p className="top-bar-meta">
            Diagnóstico fiscal por contribuinte da carteira ({anoExercicioLabel(exerciseYear)}). Integração{" "}
            <Link to="/configuracoes">API RFB / Contador</Link>.
          </p>
        </div>
        <div className="top-bar-actions">
          <div className="year-cycle-nav" aria-label="Ano-calendário / exercício">
            <button
              type="button"
              disabled={exerciseYear <= ANO_MIN || loading || atualizandoTodos}
              onClick={() => setExerciseYear((y) => Math.max(ANO_MIN, y - 1))}
            >
              −
            </button>
            <span className="year-cycle-label">{anoExercicioLabel(exerciseYear)}</span>
            <button
              type="button"
              disabled={exerciseYear >= ANO_MAX || loading || atualizandoTodos}
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
            disabled={atualizandoTodos || loading}
            onClick={() => void onAtualizarTodos()}
          >
            {atualizandoTodos ? "Atualizando…" : "Atualizar todos"}
          </button>
          <button type="button" className="btn btn-primary" disabled={loading} onClick={() => void onBaixarTodos()}>
            Baixar todos os diagnósticos
          </button>
        </div>
      </header>

      <main className="content-area">
        {err ? <div className="error-toast">{err}</div> : null}
        {infoMsg ? <div className="info-toast">{infoMsg}</div> : null}
        {!rfbEnabled ? (
          <div className="info-toast">
            API RFB desativada — a grelha pode mostrar dados de simulação. Ative em Configurações para consultas reais.
          </div>
        ) : null}

        <div className="content-card">
          {filtroAberto ? (
            <div className="diag-filtro-panel">
              <FiltrosTitularStatus
                titular={filtroTitular}
                onTitularChange={setFiltroTitular}
                status={filtroSituacao}
                onStatusChange={setFiltroSituacao}
                statusOptions={SITUACAO_OPTS}
                statusLabel="Situação"
              />
            </div>
          ) : null}

          <div className="diag-ecac-toolbar">
            <div className="diag-ecac-toolbar-left">
              <button
                type="button"
                className="btn btn-ghost diag-ecac-export-btn"
                disabled={!itensFiltrados.length}
                onClick={() => exportDiagnosticoExcel(itensFiltrados, exerciseYear)}
              >
                EXCEL
              </button>
              <button
                type="button"
                className="btn btn-ghost diag-ecac-export-btn"
                disabled={!itensFiltrados.length}
                onClick={() => exportDiagnosticoPdf(itensFiltrados, exerciseYear)}
              >
                PDF
              </button>
              <button
                type="button"
                className="btn btn-ghost diag-ecac-export-btn"
                disabled={!itensFiltrados.length}
                onClick={() => exportDiagnosticoCsv(itensFiltrados, exerciseYear)}
              >
                CSV
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
                  {col("situacao") ? <th>Situação</th> : null}
                  {col("acoes") ? <th>Ações</th> : null}
                  {col("historico") ? <th>Histórico</th> : null}
                  {col("atualizar") ? <th>Atualizar</th> : null}
                </tr>
              </thead>
              <tbody>
                {itensFiltrados.map((row) => {
                  const wa = whatsappDigits(row.telefone);
                  return (
                    <tr key={row.cpf}>
                      {col("nome") ? <td>{row.nome}</td> : null}
                      {col("cpf") ? <td>{formatCpf(row.cpf)}</td> : null}
                      {col("situacao") ? (
                        <td>
                          <span className={badgeDiag(row.situacao)}>{row.situacao_label}</span>
                        </td>
                      ) : null}
                      {col("acoes") ? (
                        <td>
                          <div className="diag-ecac-actions">
                            <a
                              className="diag-ecac-icon-btn"
                              href={row.email ? `mailto:${row.email}` : undefined}
                              title="E-mail"
                              aria-label="E-mail"
                              onClick={(e) => {
                                if (!row.email) {
                                  e.preventDefault();
                                  setErr("E-mail não cadastrado para este cliente.");
                                }
                              }}
                            >
                              <IconMail />
                            </a>
                            <a
                              className="diag-ecac-icon-btn"
                              href={wa ? `https://wa.me/${wa}` : undefined}
                              target="_blank"
                              rel="noreferrer"
                              title="WhatsApp"
                              aria-label="WhatsApp"
                              onClick={(e) => {
                                if (!wa) {
                                  e.preventDefault();
                                  setErr("Telefone não cadastrado para WhatsApp.");
                                }
                              }}
                            >
                              <IconWhatsApp />
                            </a>
                            <button
                              type="button"
                              className="diag-ecac-icon-btn"
                              title="Download JSON"
                              disabled={!row.tem_resultado}
                              onClick={() =>
                                void downloadDiagnosticoFiscalCpf(row.cpf, exerciseYear).catch((ex) =>
                                  setErr(ex instanceof Error ? ex.message : "Erro no download"),
                                )
                              }
                            >
                              <IconDownload />
                            </button>
                            <button
                              type="button"
                              className="diag-ecac-icon-btn"
                              title="Ver diagnóstico"
                              disabled={detalheLoading}
                              onClick={() => void onVerHistorico(row)}
                            >
                              <IconDoc />
                            </button>
                          </div>
                        </td>
                      ) : null}
                      {col("historico") ? (
                        <td>
                          <button
                            type="button"
                            className="btn-diag-ver"
                            disabled={detalheLoading || !row.tem_resultado}
                            onClick={() => void onVerHistorico(row)}
                          >
                            Ver
                          </button>
                        </td>
                      ) : null}
                      {col("atualizar") ? (
                        <td>
                          <button
                            type="button"
                            className="btn-diag-atualizar"
                            disabled={atualizandoCpf === row.cpf || atualizandoTodos}
                            onClick={() => void onAtualizarLinha(row)}
                          >
                            {atualizandoCpf === row.cpf ? "…" : "Atualizar"}
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
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

      {detalhe ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setDetalhe(null)}>
          <div
            className="modal-card"
            role="dialog"
            aria-labelledby="diag-detalhe-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "40rem", maxHeight: "85vh", overflow: "auto" }}
          >
            <h2 id="diag-detalhe-title">
              {detalhe.nome} — {formatCpf(detalhe.cpf)}
            </h2>
            {renderDetalheCorpo(detalhe)}
            <div className="actions-row" style={{ marginTop: "1.25rem" }}>
              <button type="button" className="btn btn-ghost" onClick={() => setDetalhe(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

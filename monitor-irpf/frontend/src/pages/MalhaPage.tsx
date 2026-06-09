import { useCallback, useEffect, useMemo, useState } from "react";
import { Paginacao } from "../components/Paginacao";
import { usePaginacao } from "../hooks/usePaginacao";
import { FiltrosTitularStatus } from "../components/FiltrosTitularStatus";
import {
  fetchMalhaDetalhes,
  fetchMalhaLista,
  postMalhaAtualizarAno,
  postMalhaAtualizarDeclaracao,
} from "../api/client";
import {
  ANO_MAX,
  ANO_MIN,
  RFB_STATUS_CODES,
  RFB_STATUS_META,
  SESSION_CARTEIRA_ANO_KEY,
  anoExercicioLabel,
  readStoredCarteiraAno,
  rfbStatusBadgeClass,
} from "../constants/rfbAndExercise";
import { filtrarPorTitular } from "../utils/filtrarTitular";
import { MalhaDetalhe } from "../interfaces/IMalhaDetalhe";
import { MalhaItem } from "../interfaces/IMalhaItem";

function formatCpf(cpf: string | null): string {
  if (!cpf) return "—";
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = iso.slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return iso;
  return `${day}/${m}/${y}`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR");
}

function rfbStatusLabel(code: string | null): string {
  if (!code) return "—";
  const meta = RFB_STATUS_META[code as keyof typeof RFB_STATUS_META];
  return meta?.title ?? code;
}

export function MalhaPage() {
  const [exerciseYear, setExerciseYear] = useState(readStoredCarteiraAno);
  const [itens, setItens] = useState<MalhaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [atualizandoTodos, setAtualizandoTodos] = useState(false);
  const [atualizandoId, setAtualizandoId] = useState<number | null>(null);
  const [detalhe, setDetalhe] = useState<MalhaDetalhe | null>(null);
  const [detalheLoading, setDetalheLoading] = useState(false);
  const [filtroTitular, setFiltroTitular] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const statusOptions = useMemo(
    () =>
      RFB_STATUS_CODES.map((code) => ({
        value: code,
        label: RFB_STATUS_META[code].title,
      })),
    [],
  );

  const itensFiltrados = useMemo(() => {
    let list = filtrarPorTitular(
      itens,
      filtroTitular,
      (r) => r.titular_nome,
      (r) => r.titular_cpf,
    );
    if (filtroStatus) {
      list = list.filter((r) => r.status_processamento_rfb === filtroStatus);
    }
    return list;
  }, [itens, filtroTitular, filtroStatus]);

  const { paginatedItems: pageRows, paginacaoProps, resetPage } = usePaginacao(itensFiltrados, 20);
  useEffect(() => { resetPage(); }, [filtroTitular, filtroStatus, resetPage]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchMalhaLista(exerciseYear);
      setItens(data.itens);
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
    setFiltroTitular("");
    setFiltroStatus("");
  }, [exerciseYear]);

  async function onAtualizarTodos() {
    setAtualizandoTodos(true);
    setErr(null);
    setInfoMsg(null);
    try {
      const r = await postMalhaAtualizarAno(exerciseYear);
      setInfoMsg(r.message);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro na consulta Serpro");
    } finally {
      setAtualizandoTodos(false);
    }
  }

  async function onAtualizarLinha(row: MalhaItem) {
    setAtualizandoId(row.declaracao_id);
    setErr(null);
    try {
      const r = await postMalhaAtualizarDeclaracao(row.declaracao_id);
      setInfoMsg(`${row.titular_nome}: ${r.message}`);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro na consulta Serpro");
    } finally {
      setAtualizandoId(null);
    }
  }

  async function onDetalhes(row: MalhaItem) {
    setDetalheLoading(true);
    setErr(null);
    try {
      const d = await fetchMalhaDetalhes(row.declaracao_id);
      setDetalhe(d);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao carregar detalhes");
    } finally {
      setDetalheLoading(false);
    }
  }

  return (
    <>
      <header className="top-bar">
        <div>
          <h2>Malha</h2>
          <p className="top-bar-meta">
            Declarações entregues retidas em malha fina. Consulta a situação na Receita via Serpro Integra Contador.
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
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading || atualizandoTodos}
            onClick={() => void onAtualizarTodos()}
          >
            {atualizandoTodos ? "Consultando Serpro…" : "Atualizar"}
          </button>
          <button type="button" className="btn btn-ghost" disabled={loading || atualizandoTodos} onClick={() => void load()}>
            Recarregar lista
          </button>
        </div>
      </header>
      <main className="content-area">
        {err ? <div className="error-toast">{err}</div> : null}
        {infoMsg ? <div className="info-toast">{infoMsg}</div> : null}
        <div className="content-card">
          <FiltrosTitularStatus
            titular={filtroTitular}
            onTitularChange={setFiltroTitular}
            status={filtroStatus}
            onStatusChange={setFiltroStatus}
            statusOptions={statusOptions}
            statusLabel="Status RFB"
          />
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Titular</th>
                  <th>CPF</th>
                  <th>Entrega</th>
                  <th>Recibo</th>
                  <th>Status RFB</th>
                  <th>Resumo malha</th>
                  <th>Última consulta</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.declaracao_id}>
                    <td>{row.titular_nome}</td>
                    <td>{formatCpf(row.titular_cpf)}</td>
                    <td>{formatDate(row.data_entrega)}</td>
                    <td className="cell-mono">{row.numero_recibo ?? "—"}</td>
                    <td>
                      {row.status_processamento_rfb ? (
                        <span className={rfbStatusBadgeClass(row.status_processamento_rfb)}>
                          {rfbStatusLabel(row.status_processamento_rfb)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{row.malha_motivo_resumo ?? "—"}</td>
                    <td>{formatDateTime(row.malha_consultado_em)}</td>
                    <td className="actions-cell">
                      <button
                        type="button"
                        className="btn btn-ghost btn-small"
                        disabled={atualizandoId === row.declaracao_id || atualizandoTodos}
                        onClick={() => void onAtualizarLinha(row)}
                      >
                        {atualizandoId === row.declaracao_id ? "…" : "Atualizar"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-small"
                        disabled={detalheLoading}
                        onClick={() => void onDetalhes(row)}
                      >
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacao {...paginacaoProps} />
          {!itens.length && !loading ? (
            <p className="empty">Nenhuma declaração retida em malha neste exercício.</p>
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
            aria-labelledby="malha-detalhe-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "36rem" }}
          >
            <h2 id="malha-detalhe-title">Detalhes da malha — RFB</h2>
            <p className="monitor-hint" style={{ marginTop: 0 }}>
              <strong>{detalhe.titular_nome}</strong> · exercício {detalhe.ano_calendario} · fonte:{" "}
              <em>{detalhe.fonte_consulta}</em>
              {detalhe.malha_consultado_em ? (
                <>
                  {" "}
                  · consultado em {formatDateTime(detalhe.malha_consultado_em)}
                </>
              ) : null}
            </p>
            {detalhe.malha_motivo_rfb ? (
              <div className="field" style={{ marginTop: "1rem" }}>
                <label>Motivo informado pela Receita</label>
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{detalhe.malha_motivo_rfb}</p>
              </div>
            ) : null}
            {detalhe.pendencias.length ? (
              <div style={{ marginTop: "1rem" }}>
                <label className="field-label">Pendências identificadas</label>
                <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
                  {detalhe.pendencias.map((p, i) => (
                    <li key={i}>
                      {p.codigo ? (
                        <strong>
                          {p.codigo}:{" "}
                        </strong>
                      ) : null}
                      {p.descricao}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
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

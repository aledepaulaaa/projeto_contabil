import { useCallback, useEffect, useMemo, useState } from "react";
import { FiltrosTitularStatus } from "../components/FiltrosTitularStatus";
import {
  fetchRestituicaoDetalhes,
  fetchRestituicoesLista,
  postRestituicaoAtualizarDeclaracao,
  postRestituicoesAtualizarAno,
} from "../api/client";
import {
  ANO_MAX,
  ANO_MIN,
  RFB_STATUS_META,
  SESSION_CARTEIRA_ANO_KEY,
  anoExercicioLabel,
  readStoredCarteiraAno,
  rfbStatusBadgeClass,
} from "../constants/rfbAndExercise";
import {
  RESTITUICAO_STATUS_LABEL,
  restituicaoStatusBadgeClass,
  restituicaoStatusLabel,
} from "../constants/restituicaoStatus";
import { filtrarPorTitular } from "../utils/filtrarTitular";
import { formatBRL } from "../utils/precificacaoHonorario";
import { RestituicaoDetalhe } from "../interfaces/IRestituicaoDetalhe";
import { RestituicaoItem } from "../interfaces/IRestituicaoItem";

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

function valorNum(v: string | number): number {
  const n = typeof v === "number" ? v : Number.parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

export function RestituicoesPage() {
  const [exerciseYear, setExerciseYear] = useState(readStoredCarteiraAno);
  const [itens, setItens] = useState<RestituicaoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [atualizandoTodos, setAtualizandoTodos] = useState(false);
  const [atualizandoId, setAtualizandoId] = useState<number | null>(null);
  const [detalhe, setDetalhe] = useState<RestituicaoDetalhe | null>(null);
  const [detalheLoading, setDetalheLoading] = useState(false);
  const [filtroTitular, setFiltroTitular] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const statusOptions = useMemo(
    () =>
      (Object.entries(RESTITUICAO_STATUS_LABEL) as [keyof typeof RESTITUICAO_STATUS_LABEL, string][]).map(
        ([value, label]) => ({ value, label }),
      ),
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
      list = list.filter((r) => r.status_restituicao === filtroStatus);
    }
    return list;
  }, [itens, filtroTitular, filtroStatus]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchRestituicoesLista(exerciseYear);
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
      const r = await postRestituicoesAtualizarAno(exerciseYear);
      setInfoMsg(r.message);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro na consulta Serpro");
    } finally {
      setAtualizandoTodos(false);
    }
  }

  async function onAtualizarLinha(row: RestituicaoItem) {
    setAtualizandoId(row.declaracao_id);
    setErr(null);
    try {
      const r = await postRestituicaoAtualizarDeclaracao(row.declaracao_id);
      setInfoMsg(`${row.titular_nome}: ${r.message}`);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro na consulta Serpro");
    } finally {
      setAtualizandoId(null);
    }
  }

  async function onDetalhes(row: RestituicaoItem) {
    setDetalheLoading(true);
    setErr(null);
    try {
      const d = await fetchRestituicaoDetalhes(row.declaracao_id);
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
          <h2>Restituições</h2>
          <p className="top-bar-meta">
            Declarações entregues com restituição — acompanhamento do crédito na Receita Federal (Serpro).
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
            statusLabel="Status restituição"
          />
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Titular</th>
                  <th>CPF</th>
                  <th>Valor a restituir</th>
                  <th>Status restituição</th>
                  <th>Status RFB</th>
                  <th>Malha</th>
                  <th>Última consulta</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {itensFiltrados.map((row) => (
                  <tr key={row.declaracao_id}>
                    <td>{row.titular_nome}</td>
                    <td>{formatCpf(row.titular_cpf)}</td>
                    <td>{formatBRL(valorNum(row.valor_restituicao))}</td>
                    <td>
                      <span className={restituicaoStatusBadgeClass(row.status_restituicao)}>
                        {row.status_restituicao_label || restituicaoStatusLabel(row.status_restituicao)}
                      </span>
                    </td>
                    <td>
                      {row.status_processamento_rfb ? (
                        <span className={rfbStatusBadgeClass(row.status_processamento_rfb)}>
                          {rfbStatusLabel(row.status_processamento_rfb)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{row.em_malha ? "Sim" : "Não"}</td>
                    <td>{formatDateTime(row.restituicao_consultado_em)}</td>
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
          {!itens.length && !loading ? (
            <p className="empty">Nenhuma declaração com restituição entregue neste exercício.</p>
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
            aria-labelledby="restituicao-detalhe-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "38rem" }}
          >
            <h2 id="restituicao-detalhe-title">Detalhes da restituição</h2>
            <p className="monitor-hint" style={{ marginTop: 0 }}>
              <strong>{detalhe.titular_nome}</strong> · {formatBRL(valorNum(detalhe.valor_restituicao))} · fonte:{" "}
              <em>{detalhe.fonte_consulta}</em>
            </p>
            <p style={{ marginTop: "0.75rem" }}>
              Status:{" "}
              <span className={restituicaoStatusBadgeClass(detalhe.status_restituicao)}>
                {detalhe.status_restituicao_label}
              </span>
              {detalhe.em_malha ? (
                <span className="monitor-hint" style={{ marginLeft: "0.5rem" }}>
                  (declaração em malha)
                </span>
              ) : null}
            </p>
            {detalhe.data_pagamento_restituicao ? (
              <p style={{ margin: "0.5rem 0 0" }}>
                Crédito em: <strong>{formatDate(detalhe.data_pagamento_restituicao)}</strong>
              </p>
            ) : null}
            {detalhe.restituicao_erro_motivo ? (
              <div className="field" style={{ marginTop: "1rem" }}>
                <label>Erro ao creditar</label>
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{detalhe.restituicao_erro_motivo}</p>
              </div>
            ) : null}
            {detalhe.observacao ? (
              <div className="field" style={{ marginTop: "1rem" }}>
                <label>Observação</label>
                <p style={{ margin: 0 }}>{detalhe.observacao}</p>
              </div>
            ) : null}
            {detalhe.historico.length ? (
              <div style={{ marginTop: "1rem" }}>
                <label className="field-label">Histórico</label>
                <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
                  {detalhe.historico.map((ev, i) => (
                    <li key={i}>
                      {ev.data ? <strong>{formatDate(ev.data)} — </strong> : null}
                      {ev.descricao}
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

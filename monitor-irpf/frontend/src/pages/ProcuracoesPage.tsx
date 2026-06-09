import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Paginacao } from "../components/Paginacao";
import { usePaginacao } from "../hooks/usePaginacao";
import { fetchCarteiraSituacaoDeclaracoes, postProcuracoesSincronizar } from "../api/client";
import {
  ANO_MAX,
  ANO_MIN,
  SESSION_CARTEIRA_ANO_KEY,
  anoExercicioLabel,
  readStoredCarteiraAno,
} from "../constants/rfbAndExercise";
import { CarteiraDeclaracaoSituacaoRow } from "../interfaces/ICarteiraDeclaracaoSituacaoRow";

function formatCpf(cpf: string | null): string {
  if (!cpf) return "—";
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function situacaoBadgeClass(s: CarteiraDeclaracaoSituacaoRow["situacao_declaracao"]): string {
  if (s === "nao_existe") return "badge badge-rascunho";
  if (s === "valido_ate") return "badge badge-entregue";
  return "badge badge-situacao-vencida";
}

function situacaoLabel(row: CarteiraDeclaracaoSituacaoRow): string {
  if (row.situacao_declaracao === "nao_existe") return "Não existe";
  if (row.situacao_declaracao === "vencida") return "Vencida";
  if (row.validade_ate) {
    const d = new Date(row.validade_ate + "T12:00:00");
    if (!Number.isNaN(d.getTime())) {
      return `Válido até ${d.toLocaleDateString("pt-BR")}`;
    }
  }
  return "Válido até —";
}

function declLink(row: CarteiraDeclaracaoSituacaoRow): string {
  const digits = (row.cpf_exibicao ?? "").replace(/\D/g, "").slice(0, 11);
  if (digits.length === 11) {
    return `/declaracoes?cpf=${encodeURIComponent(digits)}`;
  }
  return `/declaracoes?nome=${encodeURIComponent(row.nome)}`;
}

export function ProcuracoesPage() {
  const [exerciseYear, setExerciseYear] = useState(readStoredCarteiraAno);
  const [rows, setRows] = useState<CarteiraDeclaracaoSituacaoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const [filtroTitular, setFiltroTitular] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setRows(await fetchCarteiraSituacaoDeclaracoes(exerciseYear));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao carregar");
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
    void load();
  }, [load]);

  useEffect(() => {
    setFiltroTitular("");
    setFiltroStatus("");
    setInfoMsg(null);
  }, [exerciseYear]);

  async function onSincronizar() {
    setSyncing(true);
    setErr(null);
    setInfoMsg(null);
    try {
      const res = await postProcuracoesSincronizar(exerciseYear);
      setInfoMsg(res.message);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao sincronizar procurações");
    } finally {
      setSyncing(false);
    }
  }

  const rowsFiltrados = useMemo(() => {
    let list = rows;
    
    if (filtroTitular.trim()) {
      const q = filtroTitular.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.nome.toLowerCase().includes(q) ||
          (r.cpf_exibicao && r.cpf_exibicao.replace(/\D/g, "").includes(q)),
      );
    }
    
    if (filtroStatus) {
      const today = new Date();
      // Define a data de hoje sem horas para comparação exata de dias
      today.setHours(0, 0, 0, 0);
      
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      thirtyDaysFromNow.setHours(23, 59, 59, 999);

      list = list.filter((r) => {
        if (filtroStatus === "vencidas") {
          return r.situacao_declaracao === "vencida";
        }
        if (filtroStatus === "a_vencer") {
          return r.situacao_declaracao === "valido_ate";
        }
        if (filtroStatus === "vencer_30") {
          if (r.situacao_declaracao !== "valido_ate" || !r.validade_ate) return false;
          const valDate = new Date(r.validade_ate + "T12:00:00");
          return valDate >= today && valDate <= thirtyDaysFromNow;
        }
        return true;
      });
    }
    return list;
  }, [rows, filtroTitular, filtroStatus]);

  const { paginatedItems: pageRows, paginacaoProps, resetPage } = usePaginacao(rowsFiltrados, 20);
  useEffect(() => { resetPage(); }, [filtroTitular, filtroStatus, resetPage]);

  return (
    <>
      <header className="top-bar">
        <div>
          <h2>Procurações</h2>
          <p className="top-bar-meta">
            Autorizações (tokens de compartilhamento) dos contribuintes sincronizadas da base do Compartilha Receita (e-CAC/Serpro).
          </p>
        </div>
        <div className="top-bar-actions">
          <div className="year-cycle-nav" aria-label="Ano-calendário / exercício">
            <button
              type="button"
              disabled={exerciseYear <= ANO_MIN || loading || syncing}
              onClick={() => setExerciseYear((y) => Math.max(ANO_MIN, y - 1))}
            >
              −
            </button>
            <span className="year-cycle-label">{anoExercicioLabel(exerciseYear)}</span>
            <button
              type="button"
              disabled={exerciseYear >= ANO_MAX || loading || syncing}
              onClick={() => setExerciseYear((y) => Math.min(ANO_MAX, y + 1))}
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading || syncing}
            onClick={() => void onSincronizar()}
          >
            {syncing ? "Sincronizando Serpro…" : "Sincronizar via Serpro"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={loading || syncing}
            onClick={() => void load()}
          >
            Recarregar
          </button>
        </div>
      </header>
      <main className="content-area">
        {err ? <div className="error-toast">{err}</div> : null}
        {infoMsg ? <div className="info-toast">{infoMsg}</div> : null}
        <div className="content-card">
          <div className="lista-filtros-bar" role="search" style={{ marginBottom: "1.25rem" }}>
            <label className="filter-label">
              Buscar cliente
              <input
                type="search"
                value={filtroTitular}
                onChange={(e) => setFiltroTitular(e.target.value)}
                placeholder="Nome ou CPF…"
                autoComplete="off"
                disabled={loading || syncing}
              />
            </label>
            <label className="filter-label">
              Status procuração
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                disabled={loading || syncing}
                aria-label="Filtrar por status"
              >
                <option value="">Todos</option>
                <option value="a_vencer">Ativas / Válidas</option>
                <option value="vencidas">Vencidas</option>
                <option value="vencer_30">Vencem nos próximos 30 dias</option>
              </select>
            </label>
            {filtroStatus || filtroTitular ? (
              <button
                type="button"
                className="btn btn-ghost btn-small lista-filtros-limpar"
                onClick={() => {
                  setFiltroTitular("");
                  setFiltroStatus("");
                }}
              >
                Limpar filtros
              </button>
            ) : null}
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Status real (Serpro)</th>
                  <th>Situação da procuração</th>
                  <th>Token de Compartilhamento</th>
                  <th style={{ width: "6rem" }} aria-label="Declarações" />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.estado_key} className={!r.ativo ? "cliente-row-inativa table-cell-noclick" : "table-cell-noclick"}>
                    <td className="cell-strong">{r.nome}</td>
                    <td>{formatCpf(r.cpf_exibicao)}</td>
                    <td>
                      {r.status_real ? (
                        <span className={`badge ${r.status_real === "ATIVA" ? "badge-entregue" : "badge-situacao-vencida"}`}>
                          {r.status_real}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className={situacaoBadgeClass(r.situacao_declaracao)}>{situacaoLabel(r)}</span>
                    </td>
                    <td>
                      {r.token ? (
                        <code className="mono-path" style={{ fontSize: "0.85rem" }}>
                          {r.token}
                        </code>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <Link className="btn btn-ghost btn-small" to={declLink(r)}>
                        Decl.
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacao {...paginacaoProps} />
          {!loading && rows.length === 0 ? (
            <p className="empty">Nenhum cliente nesta carteira. Cadastre ou sincronize em Clientes.</p>
          ) : null}
          {rows.length > 0 && rowsFiltrados.length === 0 && !loading ? (
            <p className="empty">Nenhum resultado para os filtros aplicados.</p>
          ) : null}
          {loading ? <p className="monitor-hint">A carregar…</p> : null}
        </div>
      </main>
    </>
  );
}

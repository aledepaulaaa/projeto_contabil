import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCarteiraSituacaoDeclaracoes } from "../api/client";
import {
  ANO_MAX,
  ANO_MIN,
  SESSION_CARTEIRA_ANO_KEY,
  anoExercicioLabel,
  readStoredCarteiraAno,
} from "../constants/rfbAndExercise";
import { CarteiraDeclaracaoSituacaoRow } from "../interfaces/ICarteiraDeclaracaoSituacaoRow";

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
  const [err, setErr] = useState<string | null>(null);

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

  return (
    <>
      <header className="top-bar">
        <div>
          <h2>Procurações</h2>
          <p className="top-bar-meta">
            Clientes da carteira e situação da declaração no exercício (sem declaração no BD, dentro do prazo de
            entrega ou fora / cancelada).
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
          <button type="button" className="btn btn-ghost" disabled={loading} onClick={() => void load()}>
            Atualizar
          </button>
        </div>
      </header>
      <main className="content-area">
        {err ? <div className="error-toast">{err}</div> : null}
        <div className="content-card">
          <p className="monitor-hint" style={{ marginTop: 0 }}>
            <strong>Não existe</strong>: nenhuma declaração deste exercício associada ao cliente no banco.{" "}
            <strong>Válido até</strong>: há declaração transmitida (referência de ~5 anos após a data de entrega) ou
            rascunho ainda dentro do prazo de entrega (31/05 do ano seguinte ao calendário). <strong>Vencida</strong>:
            declarações canceladas, rascunho após o prazo ou referência temporal expirada.
          </p>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Situação da declaração</th>
                  <th style={{ width: "6rem" }} aria-label="Declarações" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.estado_key} className={!r.ativo ? "cliente-row-inativa table-cell-noclick" : "table-cell-noclick"}>
                    <td className="cell-strong">{r.nome}</td>
                    <td>{r.cpf_exibicao ?? "—"}</td>
                    <td>
                      <span className={situacaoBadgeClass(r.situacao_declaracao)}>{situacaoLabel(r)}</span>
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
          {!loading && rows.length === 0 ? (
            <p className="empty">Nenhum cliente nesta carteira. Cadastre ou sincronize em Clientes.</p>
          ) : null}
          {loading ? <p className="monitor-hint">A carregar…</p> : null}
        </div>
      </main>
    </>
  );
}

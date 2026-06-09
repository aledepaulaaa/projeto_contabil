import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchDarfLista, postGerarDarf } from "../api/client";
import { Paginacao } from "../components/Paginacao";
import { usePaginacao } from "../hooks/usePaginacao";
import { FiltrosTitularStatus } from "../components/FiltrosTitularStatus";
import {
  ANO_MAX,
  ANO_MIN,
  SESSION_CARTEIRA_ANO_KEY,
  anoExercicioLabel,
  readStoredCarteiraAno,
} from "../constants/rfbAndExercise";
import { filtrarPorTitular } from "../utils/filtrarTitular";
import { formatBRL } from "../utils/precificacaoHonorario";
import { DarfItem } from "../interfaces/IDarfItem";

const DARF_FORMA_OPTIONS = [
  { value: "debito_automatico", label: "Débito automático" },
  { value: "manual", label: "Guia DARF (manual)" },
];

function formatCpf(cpf: string | null): string {
  if (!cpf) return "—";
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function valorNum(v: string | number): number {
  const n = typeof v === "number" ? v : Number.parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

export function DarfPage() {
  const [exerciseYear, setExerciseYear] = useState(readStoredCarteiraAno);
  const [itens, setItens] = useState<DarfItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const [gerarRow, setGerarRow] = useState<DarfItem | null>(null);
  const [parcelaEscolhida, setParcelaEscolhida] = useState(1);
  const [debitoConfirmOpen, setDebitoConfirmOpen] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [filtroTitular, setFiltroTitular] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const itensFiltrados = useMemo(() => {
    let list = filtrarPorTitular(
      itens,
      filtroTitular,
      (r) => r.titular_nome,
      (r) => r.titular_cpf,
    );
    if (filtroStatus === "debito_automatico") {
      list = list.filter((r) => r.debito_automatico);
    } else if (filtroStatus === "manual") {
      list = list.filter((r) => !r.debito_automatico);
    }
    return list;
  }, [itens, filtroTitular, filtroStatus]);

  const { paginatedItems: pageRows, paginacaoProps, resetPage } = usePaginacao(itensFiltrados, 20);
  useEffect(() => { resetPage(); }, [filtroTitular, filtroStatus, resetPage]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchDarfLista(exerciseYear);
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

  function openGerar(row: DarfItem) {
    setInfoMsg(null);
    setErr(null);
    setGerarRow(row);
    setParcelaEscolhida(1);
    setDebitoConfirmOpen(false);
  }

  function closeGerarModals() {
    if (gerando) return;
    setGerarRow(null);
    setDebitoConfirmOpen(false);
  }

  function onContinuarParcela() {
    if (!gerarRow) return;
    if (gerarRow.debito_automatico) {
      setDebitoConfirmOpen(true);
    } else {
      void executarGeracao(false);
    }
  }

  async function executarGeracao(confirmarDebito: boolean) {
    if (!gerarRow) return;
    setGerando(true);
    setErr(null);
    try {
      const result = await postGerarDarf(gerarRow.declaracao_id, {
        parcela: parcelaEscolhida,
        confirmar_debito_automatico: confirmarDebito,
      });
      setInfoMsg(
        `PDF de teste baixado — ${gerarRow.titular_nome}, parcela ${parcelaEscolhida}/${gerarRow.quantidade_parcelas} (${result.filename}).`,
      );
      closeGerarModals();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao gerar DARF");
    } finally {
      setGerando(false);
    }
  }

  const parcelaValorPreview =
    gerarRow && gerarRow.quantidade_parcelas > 0
      ? valorNum(gerarRow.valor_imposto) / gerarRow.quantidade_parcelas
      : null;

  return (
    <>
      <header className="top-bar">
        <div>
          <h2>DARF</h2>
          <p className="top-bar-meta">Emissão e acompanhamento de DARF para declarações com imposto a pagar.</p>
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
        {infoMsg ? <div className="info-toast">{infoMsg}</div> : null}
        <div className="content-card">
          <FiltrosTitularStatus
            titular={filtroTitular}
            onTitularChange={setFiltroTitular}
            status={filtroStatus}
            onStatusChange={setFiltroStatus}
            statusOptions={DARF_FORMA_OPTIONS}
            statusLabel="Forma de pagamento"
          />
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Titular</th>
                  <th>CPF</th>
                  <th>Valor a pagar</th>
                  <th>Quotas</th>
                  <th>Forma de pagamento</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.declaracao_id}>
                    <td>{row.titular_nome}</td>
                    <td>{formatCpf(row.titular_cpf)}</td>
                    <td>{formatBRL(valorNum(row.valor_imposto))}</td>
                    <td>{row.quantidade_parcelas}</td>
                    <td>{row.debito_automatico ? "Débito automático em conta" : "Guia DARF (manual)"}</td>
                    <td>
                      <button type="button" className="btn btn-primary btn-small" onClick={() => openGerar(row)}>
                        Gerar DARF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacao {...paginacaoProps} />
          {!itens.length && !loading ? (
            <p className="empty">Nenhuma declaração com imposto a pagar neste exercício.</p>
          ) : null}
          {itens.length > 0 && !itensFiltrados.length && !loading ? (
            <p className="empty">Nenhum resultado com os filtros aplicados.</p>
          ) : null}
        </div>
      </main>

      {gerarRow && !debitoConfirmOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={closeGerarModals}>
          <div
            className="modal-card"
            role="dialog"
            aria-labelledby="darf-parcela-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="darf-parcela-title">Gerar DARF</h2>
            <p className="monitor-hint" style={{ marginTop: 0 }}>
              <strong>{gerarRow.titular_nome}</strong> — imposto total{" "}
              {formatBRL(valorNum(gerarRow.valor_imposto))} em {gerarRow.quantidade_parcelas} quota
              {gerarRow.quantidade_parcelas === 1 ? "" : "s"}.
            </p>
            <fieldset style={{ border: "none", padding: 0, margin: "1rem 0" }}>
              <legend className="field-label" style={{ marginBottom: "0.5rem" }}>
                Qual parcela deseja emitir?
              </legend>
              {Array.from({ length: gerarRow.quantidade_parcelas }, (_, i) => i + 1).map((n) => (
                <label key={n} className="field" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="radio"
                    name="darf-parcela"
                    checked={parcelaEscolhida === n}
                    onChange={() => setParcelaEscolhida(n)}
                  />
                  Parcela {n}
                  {gerarRow.quantidade_parcelas > 1 && parcelaValorPreview != null ? (
                    <span className="monitor-hint" style={{ margin: 0 }}>
                      (aprox. {formatBRL(parcelaValorPreview)})
                    </span>
                  ) : null}
                </label>
              ))}
            </fieldset>
            <div className="actions-row">
              <button type="button" className="btn btn-primary" disabled={gerando} onClick={onContinuarParcela}>
                Continuar
              </button>
              <button type="button" className="btn btn-ghost" disabled={gerando} onClick={closeGerarModals}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {gerarRow && debitoConfirmOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={closeGerarModals}>
          <div
            className="modal-card"
            role="alertdialog"
            aria-labelledby="darf-debito-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="darf-debito-title">Débito automático</h2>
            <p style={{ marginTop: 0 }}>
              Este pagamento está em débito automático. Deseja mesmo emitir o DARF manualmente para a parcela{" "}
              <strong>{parcelaEscolhida}</strong>?
            </p>
            <div className="actions-row">
              <button
                type="button"
                className="btn btn-primary"
                disabled={gerando}
                onClick={() => void executarGeracao(true)}
              >
                {gerando ? "Gerando…" : "Sim, emitir DARF"}
              </button>
              <button type="button" className="btn btn-ghost" disabled={gerando} onClick={closeGerarModals}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

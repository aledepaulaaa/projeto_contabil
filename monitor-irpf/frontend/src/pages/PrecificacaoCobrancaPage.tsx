import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchAsaasConfig,
  fetchClientes,
  fetchPrecificacaoParametros,
  postAsaasCobrancaCliente,
  updateClienteManual,
} from "../api/client";
import { IconPencil } from "../components/NavIcons";
import { TIPO_PRECIFICACAO_LABEL } from "../constants/precificacao";
import {
  ANO_MAX,
  ANO_MIN,
  SESSION_CARTEIRA_ANO_KEY,
  anoExercicioLabel,
  readStoredCarteiraAno,
} from "../constants/rfbAndExercise";
import { formatBRL, valorHonorarioCliente } from "../utils/precificacaoHonorario";
import { ClienteListRow } from "../interfaces/IClienteListRow";
import { PrecificacaoParametros } from "../interfaces/IPrecificacaoParametros";
import { TipoPrecificacaoCliente } from "../types/TTipoPrecificacaoCliente";

function formatValorInputPt(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseValorMonetario(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function PrecificacaoCobrancaPage() {
  const [exerciseYear, setExerciseYear] = useState(readStoredCarteiraAno);
  const [rows, setRows] = useState<ClienteListRow[]>([]);
  const [params, setParams] = useState<PrecificacaoParametros | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [asaasEnabled, setAsaasEnabled] = useState(false);
  const [chargingKey, setChargingKey] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<ClienteListRow | null>(null);
  const [editValorStr, setEditValorStr] = useState("");
  const [savingValor, setSavingValor] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [lista, p, asaas] = await Promise.all([
        fetchClientes(exerciseYear),
        fetchPrecificacaoParametros(),
        fetchAsaasConfig().catch(() => ({ enabled: false })),
      ]);
      setRows(lista);
      setParams(p);
      setAsaasEnabled(Boolean(asaas.enabled));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao carregar");
      setRows([]);
      setParams(null);
      setAsaasEnabled(false);
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

  async function onGerarCobranca(row: ClienteListRow) {
    if (!params) return;
    const { valor } = valorHonorarioCliente(row, params);
    if (valor == null || valor <= 0) return;
    setErr(null);
    setInfoMsg(null);
    setChargingKey(row.estado_key);
    try {
      const data = await postAsaasCobrancaCliente({ estado_key: row.estado_key, ano_carteira: exerciseYear });
      const invoiceUrl = typeof data.invoiceUrl === "string" ? data.invoiceUrl : null;
      const id = typeof data.id === "string" ? data.id : null;
      setInfoMsg(
        invoiceUrl
          ? `Cobrança criada${id ? ` (${id})` : ""}. Link da fatura: ${invoiceUrl}`
          : id
            ? `Cobrança criada no Asaas (${id}).`
            : "Cobrança criada no Asaas.",
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao gerar cobrança");
    } finally {
      setChargingKey(null);
    }
  }

  function openEditValor(row: ClienteListRow) {
    if (!params) return;
    const { valor } = valorHonorarioCliente(row, params);
    setEditErr(null);
    setEditRow(row);
    setEditValorStr(valor != null && !Number.isNaN(valor) ? formatValorInputPt(valor) : "");
  }

  async function onSubmitEditValor(e: FormEvent) {
    e.preventDefault();
    if (!editRow) return;
    const n = parseValorMonetario(editValorStr);
    if (n === null) {
      setEditErr("Indique um valor numérico válido (ex.: 120,00 ou 0,00).");
      return;
    }
    if (n < 0) {
      setEditErr("O valor não pode ser negativo.");
      return;
    }
    setSavingValor(true);
    setEditErr(null);
    try {
      if (n === 0) {
        await updateClienteManual(editRow.manual_id, {
          tipo_precificacao: "bonificado",
          valor_personalizado: null,
        });
      } else {
        await updateClienteManual(editRow.manual_id, {
          tipo_precificacao: "personalizado",
          valor_personalizado: n,
        });
      }
      setEditRow(null);
      await load();
    } catch (ex) {
      setEditErr(ex instanceof Error ? ex.message : "Erro ao guardar");
    } finally {
      setSavingValor(false);
    }
  }

  return (
    <>
      <header className="top-bar">
        <div>
          <h2>Precificação e Cobrança</h2>
          <p className="top-bar-meta">
            Honorários por cliente conforme o tipo de precificação no cadastro e os valores definidos em{" "}
            <Link to="/configuracoes">Configurações → Preferências → Precificação</Link>.
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
        {infoMsg ? <div className="info-toast">{infoMsg}</div> : null}
        <div className="content-card">
          {!asaasEnabled ? (
            <p className="monitor-hint" style={{ marginTop: 0 }}>
              Integração Asaas inativa: ative-a em <Link to="/configuracoes">Configurações</Link>.
            </p>
          ) : null}
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Tipo (cadastro)</th>
                  <th>Valor aplicável</th>
                  <th>Editar</th>
                  <th>Situação</th>
                  <th>Cobrança</th>
                </tr>
              </thead>
              <tbody>
                {params
                  ? rows.map((r) => {
                      const tipo = (r.tipo_precificacao ?? "padrao") as TipoPrecificacaoCliente;
                      const { valor } = valorHonorarioCliente(r, params);
                      const temAsaas = Boolean((r.asaas_customer_id ?? "").trim());
                      const podeCobrar =
                        asaasEnabled &&
                        r.ativo &&
                        temAsaas &&
                        valor != null &&
                        valor > 0 &&
                        r.estado_key.startsWith("manual:");
                      const titleCobrar = !asaasEnabled
                        ? "Ative a integração Asaas em Configurações."
                        : !r.ativo
                          ? "Cliente inativo."
                          : !temAsaas
                            ? "Cadastre o ID Asaas (cus_…) no cliente em Clientes."
                            : valor == null || valor <= 0
                              ? "Sem valor de honorário aplicável."
                              : "Gerar cobrança no Asaas com este valor.";
                      return (
                        <tr key={r.estado_key} className={!r.ativo ? "cliente-row-inativa" : undefined}>
                          <td className="cell-strong">{r.nome}</td>
                          <td>{r.cpf_exibicao ?? "—"}</td>
                          <td>{TIPO_PRECIFICACAO_LABEL[tipo] ?? tipo}</td>
                          <td>{formatBRL(valor)}</td>
                          <td>
                            <button
                              type="button"
                              className="btn-icon"
                              title="Editar valor aplicável"
                              aria-label={`Editar valor aplicável — ${r.nome}`}
                              disabled={loading || savingValor}
                              onClick={() => openEditValor(r)}
                            >
                              <IconPencil />
                            </button>
                          </td>
                          <td>{r.ativo ? "Ativo" : "Inativo"}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-ghost btn-small"
                              disabled={loading || !podeCobrar || chargingKey === r.estado_key}
                              title={titleCobrar}
                              onClick={() => void onGerarCobranca(r)}
                            >
                              {chargingKey === r.estado_key ? "A gerar…" : "Gerar cobrança"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  : null}
              </tbody>
            </table>
          </div>
          {!loading && rows.length === 0 ? (
            <p className="empty">Nenhum cliente nesta carteira. Sincronize ou cadastre em Clientes.</p>
          ) : null}
          {loading ? <p className="monitor-hint">A carregar…</p> : null}
        </div>
      </main>

      {editRow ? (
        <div className="modal-backdrop" role="presentation" onClick={() => !savingValor && setEditRow(null)}>
          <div
            className="modal-card"
            role="dialog"
            aria-labelledby="precificacao-edit-valor-title"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h2 id="precificacao-edit-valor-title">Valor aplicável</h2>
            <p className="monitor-hint" style={{ marginTop: 0 }}>
              <strong>{editRow.nome}</strong> — exercício {anoExercicioLabel(exerciseYear)}.
            </p>
            <p className="cell-sub" style={{ marginTop: 0 }}>
              Se guardar <strong>0,00</strong>, o tipo de precificação no cadastro passa a <strong>Bonificado</strong>.
              Qualquer valor maior que zero define <strong>valor personalizado</strong>.
            </p>
            <form className="form-grid cols-1" onSubmit={onSubmitEditValor}>
              {editErr ? <div className="error-toast">{editErr}</div> : null}
              <div className="field">
                <label htmlFor="precificacao-valor-input">Valor (R$)</label>
                <input
                  id="precificacao-valor-input"
                  type="text"
                  inputMode="decimal"
                  value={editValorStr}
                  onChange={(ev) => setEditValorStr(ev.target.value)}
                  placeholder="ex.: 120,00 ou 0,00"
                  autoComplete="off"
                  disabled={savingValor}
                />
              </div>
              <div className="actions-row">
                <button type="submit" className="btn btn-primary" disabled={savingValor}>
                  Guardar
                </button>
                <button type="button" className="btn btn-ghost" disabled={savingValor} onClick={() => setEditRow(null)}>
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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ANO_MAX,
  ANO_MIN,
  RFB_STATUS_CODES,
  RFB_STATUS_META,
  anoExercicioLabel,
  defaultExerciseYear,
} from "../constants/rfbAndExercise";
import {
  fetchDashboardResumo,
  fetchDeclaracoes,
  fetchFonteLocal,
  fetchMonitorStatus,
  fetchUsuarios,
  postMonitorScan,
} from "../api/client";
import { formatDateTimeIso } from "../utils/formatDateTime";
import {
  dashboardExportFilenameBase,
  exportDeclaracoesExcel,
  exportDeclaracoesPdf,
} from "../utils/dashboardTableExport";
import { DashboardResumo } from "../interfaces/IDashboardResumo";
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

const COLORS = ["#1565c0", "#ef6c00", "#2e7d32", "#78909c", "#7b1fa2"];

/** Cores do gráfico de resultado fiscal: isento azul, a pagar vermelho, restituir verde. */
const RESULTADO_BAR_FILL: Record<string, string> = {
  isento: "#1565c0",
  imposto_pagar: "#c62828",
  restituir: "#2e7d32",
  nao_informado: "#78909c",
};

function formatBRL(v: string | number | null | undefined): string {
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function SyncBannerText(props: {
  configured: boolean | null;
  ok: boolean | null;
  msg: string | null;
}) {
  if (props.configured !== true) return null;
  if (props.ok === true && props.msg) {
    return <div className="sync-banner ok sync-banner--with-dismiss">{props.msg}</div>;
  }
  if (props.ok === false && props.msg) {
    return <div className="sync-banner warn">{props.msg}</div>;
  }
  return null;
}

export function DashboardPage() {
  const declaracoesTableRef = useRef<HTMLDivElement | null>(null);
  const [exerciseYear, setExerciseYear] = useState(() =>
    Math.min(ANO_MAX, Math.max(ANO_MIN, defaultExerciseYear())),
  );
  const [situacao, setSituacao] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [statusRfb, setStatusRfb] = useState("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [rows, setRows] = useState<Declaracao[]>([]);
  /** Filtros só na grelha (clique nos gráficos ou seletores no fim da página). */
  const [detailSituacao, setDetailSituacao] = useState("");
  const [detailUsuarioId, setDetailUsuarioId] = useState("");
  const [detailResultado, setDetailResultado] = useState("");
  const [detailStatusRfb, setDetailStatusRfb] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncOk, setSyncOk] = useState<boolean | null>(null);
  const [syncCfg, setSyncCfg] = useState<boolean | null>(null);
  const [lastFolderSyncAt, setLastFolderSyncAt] = useState<string | null>(null);
  const [hasMonitoredPaths, setHasMonitoredPaths] = useState<boolean | null>(null);

  useEffect(() => {
    void fetchUsuarios()
      .then(setUsuarios)
      .catch(() => setUsuarios([]));
  }, []);

  const fetchPanelData = useCallback(async () => {
    const uid = usuarioId === "" ? undefined : Number(usuarioId);
    const rfb = statusRfb || undefined;
    const st = situacao || undefined;
    const [d, list] = await Promise.all([
      fetchDashboardResumo({
        status: st,
        ano: exerciseYear,
        usuario_responsavel_id: uid,
        status_processamento_rfb: rfb,
      }),
      fetchDeclaracoes({
        status: st,
        ano: exerciseYear,
        usuario_responsavel_id: uid,
        status_processamento_rfb: rfb,
      }),
    ]);
    setResumo(d);
    setRows(list);
  }, [exerciseYear, situacao, usuarioId, statusRfb]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      await fetchPanelData();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao carregar o painel");
      setResumo(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fetchPanelData]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadFolderSyncStatus = useCallback(async () => {
    try {
      const m = await fetchMonitorStatus();
      setLastFolderSyncAt(m.last_scan_at);
      setHasMonitoredPaths((m.irpf_root_paths?.length ?? 0) > 0);
    } catch {
      setHasMonitoredPaths(null);
    }
  }, []);

  useEffect(() => {
    void loadFolderSyncStatus();
  }, [loadFolderSyncStatus]);

  const refreshPanel = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const scan = await postMonitorScan();
      setLastFolderSyncAt(scan.last_scan_at);
      await fetchPanelData();
      await loadFolderSyncStatus();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao atualizar o painel");
      setResumo(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fetchPanelData, loadFolderSyncStatus]);

  const folderSyncLabel = useMemo(() => {
    if (hasMonitoredPaths === false) {
      return "Configure as pastas GovBox/IRPF em Configurações para sincronizar.";
    }
    const formatted = formatDateTimeIso(lastFolderSyncAt);
    if (formatted) {
      return `Última sincronização das pastas monitoradas: ${formatted}`;
    }
    return "Nenhuma sincronização das pastas monitoradas registada ainda.";
  }, [hasMonitoredPaths, lastFolderSyncAt]);

  const scrollToDeclaracoesTable = useCallback(() => {
    requestAnimationFrame(() => {
      declaracoesTableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const clearTableFilters = useCallback(() => {
    setDetailSituacao("");
    setDetailUsuarioId("");
    setDetailResultado("");
    setDetailStatusRfb("");
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const s = await fetchFonteLocal();
        if (!s.configured) {
          setSyncCfg(false);
          setSyncMsg(null);
          setSyncOk(null);
          return;
        }
        setSyncCfg(true);
        const ok = s.ok === true;
        setSyncOk(ok);
        if (ok) {
          const n = Array.isArray(s.tables) ? s.tables.length : 0;
          setSyncMsg(`SQLite auxiliar OK (${n} tabelas).`);
        } else {
          setSyncMsg(String(s.message ?? "Não foi possível ler a fonte SQLite configurada."));
        }
      } catch (e) {
        setSyncMsg(e instanceof Error ? e.message : "Erro em /api/sync/fonte-local");
        setSyncOk(false);
        setSyncCfg(true);
      }
    })();
  }, []);

  const pieData = useMemo(
    () =>
      resumo
        ? Object.entries(resumo.por_status).map(([key, value]) => ({
            name: STATUS_LABEL[key] ?? key,
            value,
            key,
          }))
        : [],
    [resumo],
  );

  const barData = useMemo(
    () =>
      resumo
        ? Object.entries(resumo.por_resultado).map(([key, value]) => ({
            name: RESULT_LABEL[key] ?? key,
            value,
            key,
          }))
        : [],
    [resumo],
  );

  const onPieSliceClick = useCallback(
    (_: unknown, index: number) => {
      const d = pieData[index];
      if (!d) return;
      setDetailSituacao((prev) => (prev === d.key ? "" : d.key));
      scrollToDeclaracoesTable();
    },
    [pieData, scrollToDeclaracoesTable],
  );

  const onBarClick = useCallback(
    (_: unknown, index: number) => {
      const d = barData[index];
      if (!d) return;
      setDetailResultado((prev) => (prev === d.key ? "" : d.key));
      scrollToDeclaracoesTable();
    },
    [barData, scrollToDeclaracoesTable],
  );

  const fiscalCardTotals = useMemo(() => {
    let pagarCount = 0;
    let pagarTotal = 0;
    let restituirCount = 0;
    let restituirTotal = 0;
    for (const r of rows) {
      const raw = Number(r.valor_imposto_ou_restituicao);
      const val = Number.isFinite(raw) ? raw : 0;
      if (r.resultado_fiscal === "imposto_pagar") {
        pagarCount += 1;
        pagarTotal += val;
      } else if (r.resultado_fiscal === "restituir") {
        restituirCount += 1;
        restituirTotal += val;
      }
    }
    return {
      pagar: { count: pagarCount, total: pagarTotal },
      restituir: { count: restituirCount, total: restituirTotal },
    };
  }, [rows]);

  const filteredTableRows = useMemo(() => {
    let list = rows;
    if (detailSituacao) list = list.filter((r) => r.status === detailSituacao);
    if (detailUsuarioId) {
      const uid = Number(detailUsuarioId);
      list = list.filter((r) => r.usuario_responsavel_id === uid);
    }
    if (detailResultado) {
      if (detailResultado === "nao_informado") {
        list = list.filter((r) => !r.resultado_fiscal || r.resultado_fiscal === "nao_informado");
      } else {
        list = list.filter((r) => r.resultado_fiscal === detailResultado);
      }
    }
    if (detailStatusRfb) list = list.filter((r) => r.status_processamento_rfb === detailStatusRfb);
    const rank = (x: string | null) =>
      x === "imposto_pagar" ? 0 : x === "restituir" ? 1 : 2;
    return [...list].sort((a, b) => {
      const d = rank(a.resultado_fiscal) - rank(b.resultado_fiscal);
      if (d !== 0) return d;
      return Number(b.valor_imposto_ou_restituicao ?? 0) - Number(a.valor_imposto_ou_restituicao ?? 0);
    });
  }, [rows, detailSituacao, detailUsuarioId, detailResultado, detailStatusRfb]);

  const handleExportExcel = useCallback(() => {
    const base = dashboardExportFilenameBase();
    exportDeclaracoesExcel(filteredTableRows, base, STATUS_LABEL, RESULT_LABEL);
  }, [filteredTableRows]);

  const handleExportPdf = useCallback(() => {
    const base = dashboardExportFilenameBase();
    exportDeclaracoesPdf(filteredTableRows, base, STATUS_LABEL, RESULT_LABEL);
  }, [filteredTableRows]);

  return (
    <>
      <header className="top-bar">
        <div>
          <h2>Dashboard</h2>
          <p className="top-bar-meta">Resumo da carteira e priorização</p>
          <p className="top-bar-sync-meta" role="status">
            {folderSyncLabel}
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
          <button type="button" className="btn btn-primary" disabled={loading} onClick={() => void refreshPanel()}>
            Atualizar painel
          </button>
        </div>
      </header>
      <main className="content-area">
        <SyncBannerText configured={syncCfg} ok={syncOk} msg={syncMsg} />
        {err ? <div className="error-toast">{err}</div> : null}
        <div className="dashboard-toolbar">
          <label>
            Situação
            <select value={situacao} onChange={(e) => setSituacao(e.target.value)}>
              <option value="">Todas</option>
              <option value="em_edicao">Em edição</option>
              <option value="entregue">Transmitida</option>
              <option value="rascunho">Rascunho</option>
            </select>
          </label>
          <label>
            Usuário (responsável)
            <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
              <option value="">Todos</option>
              {usuarios.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status (RFB)
            <select value={statusRfb} onChange={(e) => setStatusRfb(e.target.value)}>
              <option value="">Todos</option>
              {RFB_STATUS_CODES.map((c) => (
                <option key={c} value={c}>
                  {RFB_STATUS_META[c].title}
                  {RFB_STATUS_META[c].hint ? ` (${RFB_STATUS_META[c].hint})` : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="dashboard-root">
          <div className="dashboard-cards">
            <div className="dash-card">
              <span className="dash-card-label">Declarações (filtro)</span>
              <span className="dash-card-value">{rows.length}</span>
            </div>
            <div className="dash-card dash-card--success">
              <span className="dash-card-label">Transmitidas</span>
              <span className="dash-card-value">{resumo?.por_status["entregue"] ?? 0}</span>
            </div>
            <div className="dash-card dash-card--split" aria-label="Imposto a pagar e valor a restituir">
              <div className="dash-card-split-seg dash-card-split-seg--pagar">
                <span className="dash-card-label">Imposto a pagar</span>
                <div className="dash-card-split-metrics">
                  <div className="dash-card-split-count">
                    <span className="dash-card-value">{fiscalCardTotals.pagar.count}</span>
                    <span className="dash-card-split-sub">
                      {fiscalCardTotals.pagar.count === 1 ? "declaração" : "declarações"}
                    </span>
                  </div>
                  <div className="dash-card-split-total">Total: {formatBRL(fiscalCardTotals.pagar.total)}</div>
                </div>
              </div>
              <div className="dash-card-split-seg dash-card-split-seg--restituir">
                <span className="dash-card-label">Valor a restituir</span>
                <div className="dash-card-split-metrics">
                  <div className="dash-card-split-count">
                    <span className="dash-card-value">{fiscalCardTotals.restituir.count}</span>
                    <span className="dash-card-split-sub">
                      {fiscalCardTotals.restituir.count === 1 ? "declaração" : "declarações"}
                    </span>
                  </div>
                  <div className="dash-card-split-total">Total: {formatBRL(fiscalCardTotals.restituir.total)}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="dashboard-grid">
            <div className="dashboard-panel">
              <h3>Por situação</h3>
              <p className="dashboard-chart-hint">Clique numa fatia para filtrar a tabela abaixo (clique de novo para limpar).</p>
              <div className="chart-box chart-box--interactive">
                {pieData.length ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                        onClick={onPieSliceClick}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={pieData[i].key} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="chart-empty">Sem dados.</p>
                )}
              </div>
            </div>
            <div className="dashboard-panel">
              <h3>Por resultado fiscal</h3>
              <p className="dashboard-chart-hint">
                Isento (azul), imposto a pagar (vermelho), restituir (verde). Clique numa barra para filtrar a tabela.
              </p>
              <div className="chart-box chart-box--interactive">
                {barData.length ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} onClick={onBarClick}>
                        {barData.map((entry) => (
                          <Cell key={entry.key} fill={RESULTADO_BAR_FILL[entry.key] ?? "#78909c"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="chart-empty">Sem dados.</p>
                )}
              </div>
            </div>
            <div
              ref={declaracoesTableRef}
              id="dashboard-declaracoes"
              className="dashboard-panel dashboard-panel--wide"
            >
              <div className="dashboard-report-head">
                <h3>Contribuintes</h3>
              </div>
              <p className="dashboard-chart-hint">
                Filtros abaixo aplicam-se só a esta grelha (sobre os dados já carregados pelo painel). Exportações usam a mesma seleção.
              </p>
              <div className="dashboard-table-toolbar">
                <div className="dashboard-table-filters">
                  <label>
                    Situação
                    <select value={detailSituacao} onChange={(e) => setDetailSituacao(e.target.value)}>
                      <option value="">Todas</option>
                      <option value="rascunho">Rascunho</option>
                      <option value="em_edicao">Em edição</option>
                      <option value="entregue">Transmitida</option>
                    </select>
                  </label>
                  <label>
                    Usuário (responsável)
                    <select value={detailUsuarioId} onChange={(e) => setDetailUsuarioId(e.target.value)}>
                      <option value="">Todos</option>
                      {usuarios.map((u) => (
                        <option key={u.id} value={String(u.id)}>
                          {u.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Resultado fiscal
                    <select value={detailResultado} onChange={(e) => setDetailResultado(e.target.value)}>
                      <option value="">Todos</option>
                      <option value="imposto_pagar">Imposto a pagar</option>
                      <option value="restituir">Restituir</option>
                      <option value="isento">Isento</option>
                      <option value="nao_informado">Não informado</option>
                    </select>
                  </label>
                  <label>
                    Status (RFB)
                    <select value={detailStatusRfb} onChange={(e) => setDetailStatusRfb(e.target.value)}>
                      <option value="">Todos</option>
                      {RFB_STATUS_CODES.map((c) => (
                        <option key={c} value={c}>
                          {RFB_STATUS_META[c].title}
                          {RFB_STATUS_META[c].hint ? ` (${RFB_STATUS_META[c].hint})` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="button" className="btn btn-ghost btn-small" onClick={clearTableFilters}>
                    Limpar filtros da tabela
                  </button>
                </div>
                <div className="dashboard-export-actions">
                  <button type="button" className="btn btn-ghost btn-small" onClick={handleExportExcel}>
                    Exportar Excel
                  </button>
                  <button type="button" className="btn btn-ghost btn-small" onClick={handleExportPdf}>
                    Exportar PDF
                  </button>
                </div>
              </div>
              <div className="dashboard-report-table-wrap">
                <table className="dashboard-report-table">
                  <thead>
                    <tr>
                      <th>Contribuinte</th>
                      <th>Situação</th>
                      <th>Resultado</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTableRows.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div className="cell-strong">{r.titular_nome}</div>
                          <div className="cell-sub">{r.titular_cpf ?? "—"}</div>
                        </td>
                        <td>
                          <span className={`badge badge-${r.status}`}>{STATUS_LABEL[r.status] ?? r.status}</span>
                        </td>
                        <td>
                          {r.resultado_fiscal ? RESULT_LABEL[r.resultado_fiscal] ?? r.resultado_fiscal : "—"}
                        </td>
                        <td>{formatBRL(r.valor_imposto_ou_restituicao)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredTableRows.length ? <p className="empty">Sem dados.</p> : null}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

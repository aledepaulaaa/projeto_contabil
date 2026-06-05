import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDeclaracoes, fetchInsightRelatorio } from "../api/client";
import "../styles/insights.css";
import { Declaracao } from "../interfaces/IDeclaracao";

type ContribuinteOption = {
  cpfDigits: string;
  nome: string;
  nDecl: number;
};

type InsightAnaliseBloco = {
  id: string;
  titulo: string;
  pontos: string[];
};

type InsightPorAnoRow = {
  declaracao_id?: number;
  ano_calendario: number;
  status: string;
  resultado_fiscal?: string | null;
  valor_imposto_ou_restituicao_brl?: string;
  rendimentos_tributaveis_brl?: string | null;
  rendimentos_isentos_brl?: string | null;
  total_rendimentos_brl?: string | null;
  patrimonio_liquido_declarado_brl?: string | null;
  caixa_pos_ir_aprox_brl?: string | null;
  malha_fina?: boolean;
  restituicao_paga?: boolean | null;
  tem_resumo_patrimonio?: boolean;
  data_entrega?: string | null;
};

type InsightMetricas = {
  declaracoes_analisadas?: number;
  anos_calendario?: number[];
  por_resultado_fiscal?: Record<string, number>;
  totais_brl?: {
    imposto_pagar_soma?: string;
    restituir_soma?: string;
    isento_soma?: string;
    outros_soma?: string;
  };
  contagens?: {
    malha_fina?: number;
    restituicao_marcada_paga?: number;
    com_resumo_patrimonial_texto?: number;
    com_rendimentos_totais_preenchidos?: number;
    com_patrimonio_liquido_preenchido?: number;
  };
  totais_rendimentos?: { soma_total_rendimentos_trib_mais_isentos_brl?: string | null };
  por_ano?: InsightPorAnoRow[];
  variacao_valor_entre_anos?: { de: number; para: number; delta_brl: string; delta_pct_fmt?: string }[];
};

type InsightRelatorio = {
  valido: boolean;
  cpf?: string;
  titular_nome?: string | null;
  gerado_em?: string;
  message?: string;
  resumo_executivo?: string;
  declaracoes?: unknown[];
  metricas?: InsightMetricas;
  analises?: InsightAnaliseBloco[];
};

function normalizeCpfDigits(v: string | null | undefined): string {
  return (v || "").replace(/\D/g, "").slice(0, 11);
}

function formatCpfDisplay(digits: string): string {
  if (digits.length !== 11) return digits;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function buildContribuintesComCpf(decls: Declaracao[]): ContribuinteOption[] {
  const byCpf = new Map<string, Declaracao[]>();
  for (const r of decls) {
    const c = normalizeCpfDigits(r.titular_cpf);
    if (c.length !== 11) continue;
    const arr = byCpf.get(c) ?? [];
    arr.push(r);
    byCpf.set(c, arr);
  }
  const out: ContribuinteOption[] = [];
  for (const [cpfDigits, list] of byCpf) {
    const nome =
      list.map((x) => x.titular_nome?.trim()).find((n) => n && n.length > 0) ?? "Nome não informado";
    out.push({ cpfDigits, nome, nDecl: list.length });
  }
  out.sort((a, b) => a.nome.localeCompare(b.nome, "pt", { sensitivity: "base" }));
  return out;
}

function isRelatorio(x: unknown): x is InsightRelatorio {
  return typeof x === "object" && x !== null && "valido" in x;
}

function isMetricas(x: unknown): x is InsightMetricas {
  return typeof x === "object" && x !== null;
}

export function InsightsPage() {
  const [contribuintes, setContribuintes] = useState<ContribuinteOption[]>([]);
  const [loadListErr, setLoadListErr] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [selectedCpf, setSelectedCpf] = useState("");
  const [relatorio, setRelatorio] = useState<InsightRelatorio | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const [showTech, setShowTech] = useState(false);

  const loadContribuintes = useCallback(async () => {
    setListLoading(true);
    setLoadListErr(null);
    try {
      const rows = await fetchDeclaracoes({});
      setContribuintes(buildContribuintesComCpf(rows));
    } catch (e) {
      setLoadListErr(e instanceof Error ? e.message : "Erro ao carregar declarações");
      setContribuintes([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContribuintes();
  }, [loadContribuintes]);

  const selectedLabel = useMemo(() => {
    if (!selectedCpf) return null;
    const o = contribuintes.find((c) => c.cpfDigits === selectedCpf);
    return o ? `${o.nome} (${formatCpfDisplay(selectedCpf)})` : null;
  }, [selectedCpf, contribuintes]);

  async function onGerar(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setRelatorio(null);
    setShowTech(false);
    if (!selectedCpf || selectedCpf.length !== 11) {
      setErr("Selecione um contribuinte na lista.");
      return;
    }
    setGerando(true);
    try {
      const raw = await fetchInsightRelatorio(selectedCpf);
      if (!isRelatorio(raw)) {
        setErr("Resposta inválida do servidor.");
        return;
      }
      setRelatorio(raw);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro ao gerar relatório");
    } finally {
      setGerando(false);
    }
  }

  const podeGerar = selectedCpf.length === 11 && !gerando && !listLoading;

  return (
    <>
      <header className="top-bar">
        <div>
          <h2>Insights</h2>
          <p className="top-bar-meta">Relatório por contribuinte — mesma base de declarações do menu Declarações (CPF)</p>
        </div>
      </header>
      <main className="content-area insights-page">
        {loadListErr ? <div className="error-toast">{loadListErr}</div> : null}
        {err ? <div className="error-toast">{err}</div> : null}

        <section className="insights-hero" aria-labelledby="insights-hero-title">
          <div className="insights-hero-inner">
            <span className="insights-badge">Inteligência fiscal</span>
            <h2 id="insights-hero-title">Painel de insights</h2>
            <p className="insights-hero-lead">
              Escolha o titular a partir das declarações já gravadas e gere o relatório completo com análise
              agregada por dimensão (patrimônio, renda, deduções, saúde financeira, alertas e linha do tempo).
            </p>
            <form className="insights-query" onSubmit={onGerar}>
              <label htmlFor="insights-contribuinte">Contribuinte (declarações na base)</label>
              <div className="insights-select-wrap">
                <select
                  id="insights-contribuinte"
                  className="insights-select"
                  value={selectedCpf}
                  onChange={(ev) => {
                    setSelectedCpf(ev.target.value);
                    setRelatorio(null);
                    setErr(null);
                  }}
                  disabled={listLoading || contribuintes.length === 0}
                >
                  <option value="">
                    {listLoading
                      ? "A carregar lista…"
                      : contribuintes.length === 0
                        ? "Nenhuma declaração com CPF completo na base"
                        : "Selecione um contribuinte"}
                  </option>
                  {contribuintes.map((c) => (
                    <option key={c.cpfDigits} value={c.cpfDigits}>
                      {c.nome} — {formatCpfDisplay(c.cpfDigits)} ({c.nDecl} decl.)
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={!podeGerar}>
                {gerando ? "A gerar…" : "Gerar"}
              </button>
            </form>
          </div>
        </section>

        {!listLoading && contribuintes.length === 0 && !loadListErr ? (
          <p className="insights-footnote" style={{ marginTop: 0 }}>
            Não há declarações com CPF de 11 dígitos para listar.{" "}
            <Link to="/declaracoes">Abrir Declarações (CPF)</Link> e confirme o titular com CPF preenchido.
          </p>
        ) : null}

        {relatorio ? (
          <section className="insights-result-panel" aria-live="polite">
            <h3 style={{ marginTop: 0 }}>Relatório gerado</h3>
            {!relatorio.valido ? (
              <p className="cell-sub" style={{ margin: 0 }}>
                {relatorio.message ?? "Não foi possível gerar o relatório para este identificador."}
              </p>
            ) : (
              <>
                <p className="cell-sub" style={{ margin: "0 0 0.35rem" }}>
                  {relatorio.gerado_em ? (
                    <>
                      Gerado em <span style={{ fontFamily: "var(--mono)" }}>{relatorio.gerado_em}</span>
                      {relatorio.cpf ? (
                        <>
                          {" "}
                          · CPF <strong>{relatorio.cpf}</strong>
                        </>
                      ) : null}
                      {relatorio.titular_nome ? (
                        <>
                          {" "}
                          · <strong>{relatorio.titular_nome}</strong>
                        </>
                      ) : null}
                    </>
                  ) : null}
                </p>
                {relatorio.resumo_executivo ? (
                  <p style={{ margin: "0.75rem 0 0", fontSize: "1.02rem", lineHeight: 1.55 }}>
                    {relatorio.resumo_executivo}
                  </p>
                ) : null}
                {isMetricas(relatorio.metricas) && (relatorio.metricas.declaracoes_analisadas ?? 0) > 0 ? (
                  <>
                    <h4 style={{ margin: "1.25rem 0 0", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
                      Indicadores numéricos (base atual)
                    </h4>
                    <div className="insights-kpi-grid">
                      <div className="insights-kpi-card">
                        <p className="insights-kpi-label">Declarações</p>
                        <p className="insights-kpi-value">{relatorio.metricas.declaracoes_analisadas}</p>
                      </div>
                      <div className="insights-kpi-card">
                        <p className="insights-kpi-label">Anos na série</p>
                        <p className="insights-kpi-value">{(relatorio.metricas.anos_calendario ?? []).length}</p>
                      </div>
                      <div className="insights-kpi-card">
                        <p className="insights-kpi-label">Σ imposto a pagar</p>
                        <p className="insights-kpi-value">{relatorio.metricas.totais_brl?.imposto_pagar_soma ?? "—"}</p>
                      </div>
                      <div className="insights-kpi-card">
                        <p className="insights-kpi-label">Σ restituição</p>
                        <p className="insights-kpi-value">{relatorio.metricas.totais_brl?.restituir_soma ?? "—"}</p>
                      </div>
                      <div className="insights-kpi-card">
                        <p className="insights-kpi-label">Malha fina</p>
                        <p className="insights-kpi-value">{relatorio.metricas.contagens?.malha_fina ?? 0}</p>
                      </div>
                      <div className="insights-kpi-card">
                        <p className="insights-kpi-label">Rest. paga (marc.)</p>
                        <p className="insights-kpi-value">{relatorio.metricas.contagens?.restituicao_marcada_paga ?? 0}</p>
                      </div>
                      <div className="insights-kpi-card">
                        <p className="insights-kpi-label">Σ rend. (trib.+isent.)</p>
                        <p className="insights-kpi-value">
                          {relatorio.metricas.totais_rendimentos?.soma_total_rendimentos_trib_mais_isentos_brl ?? "—"}
                        </p>
                      </div>
                      <div className="insights-kpi-card">
                        <p className="insights-kpi-label">Anos c/ rendimento</p>
                        <p className="insights-kpi-value">
                          {relatorio.metricas.contagens?.com_rendimentos_totais_preenchidos ?? 0}
                        </p>
                      </div>
                    </div>
                    {relatorio.metricas.por_ano && relatorio.metricas.por_ano.length > 0 ? (
                      <div className="insights-metric-table-wrap">
                        <table className="insights-metric-table">
                          <thead>
                            <tr>
                              <th>Ano</th>
                              <th>Status</th>
                              <th>Resultado</th>
                              <th>Valor (IR)</th>
                              <th>Rend. total</th>
                              <th>Caixa pós-IR*</th>
                              <th>Patr. líq.</th>
                              <th>Malha</th>
                              <th>Rest. paga</th>
                            </tr>
                          </thead>
                          <tbody>
                            {relatorio.metricas.por_ano.map((row) => (
                              <tr key={row.declaracao_id ?? `${row.ano_calendario}-${row.status}`}>
                                <td className="num">{row.ano_calendario}</td>
                                <td>{row.status}</td>
                                <td>{row.resultado_fiscal ?? "—"}</td>
                                <td className="num">{row.valor_imposto_ou_restituicao_brl ?? "—"}</td>
                                <td className="num">{row.total_rendimentos_brl ?? "—"}</td>
                                <td className="num">{row.caixa_pos_ir_aprox_brl ?? "—"}</td>
                                <td className="num">{row.patrimonio_liquido_declarado_brl ?? "—"}</td>
                                <td>{row.malha_fina ? "Sim" : "Não"}</td>
                                <td>{row.restituicao_paga === true ? "Sim" : row.restituicao_paga === false ? "Não" : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="cell-sub" style={{ margin: "0.35rem 0.5rem 0.5rem" }}>
                          *Caixa pós-IR aprox.: rendimentos tributáveis + isentos − imposto a pagar ou + restituição,
                          conforme resultado fiscal declarado.
                        </p>
                      </div>
                    ) : null}
                  </>
                ) : null}
                {selectedLabel ? (
                  <p className="cell-sub" style={{ margin: "0.65rem 0 0" }}>
                    Contribuinte selecionado: {selectedLabel}.{" "}
                    <Link to={`/declaracoes?cpf=${encodeURIComponent(selectedCpf)}`}>Ver declarações</Link>
                  </p>
                ) : null}
              </>
            )}
            <button type="button" className="insights-tech-toggle" onClick={() => setShowTech((v) => !v)}>
              {showTech ? "Ocultar" : "Ver"} dados técnicos (JSON)
            </button>
            {showTech ? (
              <pre className="insights-tech-pre mono-path">{JSON.stringify(relatorio, null, 2)}</pre>
            ) : null}
          </section>
        ) : null}

        {relatorio?.valido && relatorio.analises?.length ? (
          <div className="insights-grid" style={{ marginTop: "1.25rem" }}>
            {relatorio.analises.map((bloco) => (
              <article
                key={bloco.id}
                className={`insights-card${bloco.id === "patrimonio" || bloco.id === "temporal" || bloco.id === "evolucao_caixa" ? " insights-card-wide" : ""}`}
              >
                <div className="insights-card-head">
                  <span className="insights-card-icon" aria-hidden>
                    {bloco.id === "patrimonio"
                      ? "💎"
                      : bloco.id === "evolucao_caixa"
                        ? "💵"
                        : bloco.id === "renda"
                          ? "📊"
                          : bloco.id === "deducao"
                            ? "🧾"
                            : bloco.id === "saude"
                              ? "📈"
                              : bloco.id === "investimentos"
                                ? "🏠"
                                : bloco.id === "alertas"
                                  ? "🔍"
                                  : bloco.id === "temporal"
                                    ? "📅"
                                    : "•"}
                  </span>
                  <h3 className="insights-card-title">{bloco.titulo}</h3>
                </div>
                <ul>
                  {bloco.pontos.map((line, idx) => (
                    <li key={`${bloco.id}-${idx}`}>{line}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        ) : null}

        {relatorio?.valido ? (
          <p className="insights-footnote" style={{ marginTop: "1rem" }}>
            <strong>Dados numéricos:</strong> totais e tabela por ano usam os campos gravados na declaração
            (valor, resultado fiscal, malha fina, restituição paga). Rendimentos por fonte, deduções detalhadas e
            quadros de bens exigem extração futura do arquivo IRPF — até lá, preencha «evolução patrimonial» e
            observações para enriquecer o contexto.
          </p>
        ) : null}

        {!relatorio ? (
          <p className="insights-footnote">
            <strong>Como funciona:</strong> a lista reflete titulares distintos com CPF válido nas declarações
            guardadas (igual ao universo que pode filtrar em <Link to="/declaracoes">Declarações</Link>). O botão{" "}
            <strong>Gerar</strong> monta o relatório no servidor a partir desses registos; métricas mais finas
            dependerão do enriquecimento progressivo dos dados extraídos de cada declaração.
          </p>
        ) : null}
      </main>
    </>
  );
}

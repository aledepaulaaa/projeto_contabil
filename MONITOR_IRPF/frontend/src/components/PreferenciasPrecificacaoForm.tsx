import { FormEvent, useCallback, useEffect, useState } from "react";
import { fetchPrecificacaoParametros, putPrecificacaoParametros } from "../api/client";
import { TIPO_COBRANCA_PADRAO_OPTIONS } from "../constants/precificacao";
import type { PersonalizadoEscalonamento } from "../interfaces/IPersonalizadoEscalonamento";
import type { PrecificacaoParametros } from "../interfaces/IPrecificacaoParametros";
import type { TipoCobrancaPadrao } from "../types/TTipoCobrancaPadrao";

function toInputString(v: string | number | undefined): string {
  if (v === undefined || v === null) return "";
  return String(v).replace(",", ".");
}

function emptyPersonalizadoEscalonamento(): PersonalizadoEscalonamento {
  return {
    fontes_pagamento_1_a_3: "0",
    fontes_pagamento_4_a_10: "0",
    fontes_pagamento_11_ou_mais: "0",
    valor_por_dependente: "0",
    investimento_em_acoes: "0",
    bens_1_a_5: "0",
    bens_6_a_10: "0",
    bens_11_ou_mais: "0",
  };
}

function escalonamentoFromApi(raw: Partial<PersonalizadoEscalonamento> | undefined | null): PersonalizadoEscalonamento {
  const e = raw ?? {};
  return {
    fontes_pagamento_1_a_3: toInputString(e.fontes_pagamento_1_a_3 ?? "0"),
    fontes_pagamento_4_a_10: toInputString(e.fontes_pagamento_4_a_10 ?? "0"),
    fontes_pagamento_11_ou_mais: toInputString(e.fontes_pagamento_11_ou_mais ?? "0"),
    valor_por_dependente: toInputString(e.valor_por_dependente ?? "0"),
    investimento_em_acoes: toInputString(e.investimento_em_acoes ?? "0"),
    bens_1_a_5: toInputString(e.bens_1_a_5 ?? "0"),
    bens_6_a_10: toInputString(e.bens_6_a_10 ?? "0"),
    bens_11_ou_mais: toInputString(e.bens_11_ou_mais ?? "0"),
  };
}

function parseMoneyToApiString(s: string): string {
  return String(Number(s.replace(",", ".")) || 0);
}

const ROWS_INICIO: {
  field: "valor_padrao" | "valor_minimo" | "valor_maximo";
  titulo: string;
  descricao: string;
}[] = [
  {
    field: "valor_padrao",
    titulo: "Valor padrão",
    descricao: "Montante quando o cliente usa «Valor padrão» no cadastro.",
  },
  {
    field: "valor_minimo",
    titulo: "Valor mínimo",
    descricao: "Montante quando o cliente usa «Valor mínimo».",
  },
  {
    field: "valor_maximo",
    titulo: "Valor máximo",
    descricao: "Montante quando o cliente usa «Valor máximo».",
  },
];

const ROW_BONIFICADO = {
  field: "valor_bonificado" as const,
  titulo: "Bonificado",
  descricao: "Montante de referência quando o cliente está como «Bonificado» (ex.: zero).",
};

function emptyForm(): PrecificacaoParametros {
  return {
    valor_padrao: "0",
    valor_minimo: "0",
    valor_maximo: "0",
    valor_personalizado_referencia: "0",
    personalizado_escalonamento: emptyPersonalizadoEscalonamento(),
    valor_bonificado: "0",
    tipo_cobranca_padrao: "padrao",
  };
}

type EscKey = keyof PersonalizadoEscalonamento;

export function PreferenciasPrecificacaoForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [form, setForm] = useState<PrecificacaoParametros>(emptyForm);
  const [personalizadoAberto, setPersonalizadoAberto] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const p = await fetchPrecificacaoParametros();
      const tcp = p.tipo_cobranca_padrao ?? "padrao";
      setForm({
        valor_padrao: toInputString(p.valor_padrao),
        valor_minimo: toInputString(p.valor_minimo),
        valor_maximo: toInputString(p.valor_maximo),
        valor_personalizado_referencia: toInputString(p.valor_personalizado_referencia ?? "0"),
        personalizado_escalonamento: escalonamentoFromApi(p.personalizado_escalonamento),
        valor_bonificado: toInputString(p.valor_bonificado),
        tipo_cobranca_padrao:
          tcp === "padrao" || tcp === "minimo" || tcp === "maximo" || tcp === "bonificado" ? tcp : "padrao",
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function setField(field: keyof PrecificacaoParametros, value: string) {
    if (field === "personalizado_escalonamento") return;
    setForm((f) => ({ ...f, [field]: value }));
  }

  function setEscField(key: EscKey, value: string) {
    setForm((f) => ({
      ...f,
      personalizado_escalonamento: { ...f.personalizado_escalonamento, [key]: value },
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setSaving(true);
    try {
      const esc = form.personalizado_escalonamento;
      const body: PrecificacaoParametros = {
        valor_padrao: parseMoneyToApiString(form.valor_padrao),
        valor_minimo: parseMoneyToApiString(form.valor_minimo),
        valor_maximo: parseMoneyToApiString(form.valor_maximo),
        valor_personalizado_referencia: parseMoneyToApiString(form.valor_personalizado_referencia),
        personalizado_escalonamento: {
          fontes_pagamento_1_a_3: parseMoneyToApiString(esc.fontes_pagamento_1_a_3),
          fontes_pagamento_4_a_10: parseMoneyToApiString(esc.fontes_pagamento_4_a_10),
          fontes_pagamento_11_ou_mais: parseMoneyToApiString(esc.fontes_pagamento_11_ou_mais),
          valor_por_dependente: parseMoneyToApiString(esc.valor_por_dependente),
          investimento_em_acoes: parseMoneyToApiString(esc.investimento_em_acoes),
          bens_1_a_5: parseMoneyToApiString(esc.bens_1_a_5),
          bens_6_a_10: parseMoneyToApiString(esc.bens_6_a_10),
          bens_11_ou_mais: parseMoneyToApiString(esc.bens_11_ou_mais),
        },
        valor_bonificado: parseMoneyToApiString(form.valor_bonificado),
        tipo_cobranca_padrao: form.tipo_cobranca_padrao,
      };
      await putPrecificacaoParametros(body);
      setOk("Tabela de precificação guardada.");
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  }

  function moneyInput(
    label: string,
    value: string,
    onChange: (v: string) => void,
    id: string,
    hint?: string,
  ) {
    return (
      <div className="precificacao-personalizado-field">
        <label htmlFor={id}>{label}</label>
        {hint ? (
          <span className="cell-sub" style={{ fontSize: "0.78rem" }}>
            {hint}
          </span>
        ) : null}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          className="client-contact-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onMouseDown={(ev) => ev.stopPropagation()}
          onClick={(ev) => ev.stopPropagation()}
          aria-label={label}
        />
      </div>
    );
  }

  if (loading) {
    return <p className="monitor-hint">A carregar parâmetros…</p>;
  }

  const pe = form.personalizado_escalonamento;

  return (
    <form onSubmit={onSubmit}>
      {err ? <div className="error-toast">{err}</div> : null}
      {ok ? <div className="info-toast">{ok}</div> : null}
      <div className="field" style={{ marginBottom: "1rem", maxWidth: "36rem" }}>
        <label>
          <strong>Tipo de cobrança padrão</strong> (sincronização / importação IRPF e novo cadastro manual)
        </label>
        <select
          className="declaracoes-resp-select"
          style={{ marginTop: "0.35rem", display: "block", maxWidth: "24rem" }}
          value={form.tipo_cobranca_padrao}
          onChange={(e) =>
            setForm((f) => ({ ...f, tipo_cobranca_padrao: e.target.value as TipoCobrancaPadrao }))
          }
          aria-label="Tipo de cobrança padrão para novos clientes automáticos"
        >
          {TIPO_COBRANCA_PADRAO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="cell-sub" style={{ marginTop: "0.35rem" }}>
          Clientes criados a partir das declarações no BD ou importados do ano anterior recebem este tipo até ser
          alterado no cadastro. «Valor personalizado» não está disponível aqui — use o cadastro do cliente.
        </p>
      </div>
      <div className="table-wrap">
        <table className="data-table precificacao-prefs-table">
          <thead>
            <tr>
              <th>Tipo de precificação</th>
              <th>Descrição</th>
              <th style={{ minWidth: "10rem" }}>Valor (R$)</th>
            </tr>
          </thead>
          <tbody>
            {ROWS_INICIO.map((r) => (
              <tr key={r.field}>
                <td className="cell-strong">{r.titulo}</td>
                <td>
                  <span className="cell-sub">{r.descricao}</span>
                </td>
                <td>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="client-contact-input"
                    style={{ width: "100%", maxWidth: "12rem" }}
                    value={form[r.field]}
                    onChange={(e) => setField(r.field, e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    required
                    aria-label={`Valor para ${r.titulo}`}
                  />
                </td>
              </tr>
            ))}
            <tr className="precificacao-prefs-personalizado-row">
              <td colSpan={3} style={{ paddingTop: "1rem", paddingBottom: "1rem", verticalAlign: "top" }}>
                <button
                  type="button"
                  className="precificacao-personalizado-toggle"
                  aria-expanded={personalizadoAberto}
                  onClick={() => setPersonalizadoAberto((v) => !v)}
                >
                  <span aria-hidden>{personalizadoAberto ? "▼" : "▶"}</span>
                  Valor personalizado (referência por lançamentos e critérios)
                </button>
                <p className="cell-sub" style={{ margin: "0.35rem 0 0 1.25rem", maxWidth: "48rem" }}>
                  O montante cobrado em «Personalizado» continua a ser o definido no <strong>cadastro do cliente</strong>.
                  Os valores abaixo são <strong>referência interna</strong> por faixa de fontes de pagamento, dependentes,
                  investimento em ações e bens.
                </p>
                {personalizadoAberto ? (
                  <div className="precificacao-personalizado-panel">
                    <p className="precificacao-personalizado-hint">
                      Referência geral única (opcional): mantém um valor-base além dos escalões.
                    </p>
                    {moneyInput(
                      "Referência geral (R$)",
                      form.valor_personalizado_referencia,
                      (v) => setField("valor_personalizado_referencia", v),
                      "pref-pers-ref-geral",
                    )}
                    <div className="precificacao-personalizado-grid" style={{ marginTop: "1rem" }}>
                      <div className="precificacao-personalizado-group">
                        <h4>Fontes de pagamento</h4>
                        {moneyInput(
                          "1 a 3 fontes",
                          pe.fontes_pagamento_1_a_3,
                          (v) => setEscField("fontes_pagamento_1_a_3", v),
                          "pref-pers-f1",
                        )}
                        {moneyInput(
                          "4 a 10 fontes",
                          pe.fontes_pagamento_4_a_10,
                          (v) => setEscField("fontes_pagamento_4_a_10", v),
                          "pref-pers-f2",
                        )}
                        {moneyInput(
                          "11 ou mais fontes",
                          pe.fontes_pagamento_11_ou_mais,
                          (v) => setEscField("fontes_pagamento_11_ou_mais", v),
                          "pref-pers-f3",
                        )}
                      </div>
                      <div className="precificacao-personalizado-group">
                        <h4>Dependentes e investimentos</h4>
                        {moneyInput(
                          "Valor por dependente (R$)",
                          pe.valor_por_dependente,
                          (v) => setEscField("valor_por_dependente", v),
                          "pref-pers-dep",
                        )}
                        {moneyInput(
                          "Com investimento em ações (R$)",
                          pe.investimento_em_acoes,
                          (v) => setEscField("investimento_em_acoes", v),
                          "pref-pers-acoes",
                          "Referência quando o caso inclui investimento em ações.",
                        )}
                      </div>
                      <div className="precificacao-personalizado-group">
                        <h4>Bens</h4>
                        {moneyInput(
                          "1 a 5 bens",
                          pe.bens_1_a_5,
                          (v) => setEscField("bens_1_a_5", v),
                          "pref-pers-b1",
                        )}
                        {moneyInput(
                          "6 a 10 bens",
                          pe.bens_6_a_10,
                          (v) => setEscField("bens_6_a_10", v),
                          "pref-pers-b2",
                        )}
                        {moneyInput(
                          "11 ou mais bens",
                          pe.bens_11_ou_mais,
                          (v) => setEscField("bens_11_ou_mais", v),
                          "pref-pers-b3",
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </td>
            </tr>
            <tr key={ROW_BONIFICADO.field}>
              <td className="cell-strong">{ROW_BONIFICADO.titulo}</td>
              <td>
                <span className="cell-sub">{ROW_BONIFICADO.descricao}</span>
              </td>
              <td>
                <input
                  type="text"
                  inputMode="decimal"
                  className="client-contact-input"
                  style={{ width: "100%", maxWidth: "12rem" }}
                  value={form[ROW_BONIFICADO.field]}
                  onChange={(e) => setField(ROW_BONIFICADO.field, e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  required
                  aria-label={`Valor para ${ROW_BONIFICADO.titulo}`}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="actions-row" style={{ marginTop: "1rem" }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          Guardar tabela de precificação
        </button>
        <button type="button" className="btn btn-ghost" disabled={saving} onClick={() => void load()}>
          Recarregar
        </button>
      </div>
    </form>
  );
}

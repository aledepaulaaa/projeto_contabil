import { FormEvent, useCallback, useEffect, useState } from "react";
import { fetchAsaasConfig, putAsaasConfig } from "../api/client";

export function AsaasIntegracaoPanel() {
  const [loading, setLoading] = useState(true);
  const [cfgErr, setCfgErr] = useState<string | null>(null);
  const [cfgOk, setCfgOk] = useState<string | null>(null);
  const [savingCfg, setSavingCfg] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [dueDays, setDueDays] = useState(7);

  const loadCfg = useCallback(async () => {
    setLoading(true);
    setCfgErr(null);
    try {
      const c = await fetchAsaasConfig();
      setEnabled(Boolean(c.enabled));
      const d = Number(c.dueDays);
      setDueDays(Number.isFinite(d) && d >= 0 ? Math.min(365, Math.floor(d)) : 7);
      setApiKey("");
    } catch (e) {
      setCfgErr(e instanceof Error ? e.message : "Erro ao carregar configuração");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCfg();
  }, [loadCfg]);

  async function onSaveConfig(e: FormEvent) {
    e.preventDefault();
    setCfgErr(null);
    setCfgOk(null);
    setSavingCfg(true);
    try {
      const body: Record<string, unknown> = {
        enabled,
        dueDays: Math.min(365, Math.max(0, Math.floor(Number(dueDays)) || 7)),
      };
      if (apiKey.trim()) body.apiKey = apiKey.trim();
      await putAsaasConfig(body);
      setCfgOk("Configuração Asaas guardada.");
      setApiKey("");
      await loadCfg();
    } catch (ex) {
      setCfgErr(ex instanceof Error ? ex.message : "Erro ao guardar");
    } finally {
      setSavingCfg(false);
    }
  }

  if (loading) {
    return <p className="monitor-hint">A carregar integração Asaas…</p>;
  }

  return (
    <div className="asaas-integracao">
      {cfgErr ? <div className="error-toast">{cfgErr}</div> : null}
      {cfgOk ? <div className="info-toast">{cfgOk}</div> : null}

      <form className="form-grid cols-2" onSubmit={onSaveConfig}>
        <p className="cell-sub" style={{ gridColumn: "1 / -1", marginTop: 0 }}>
          A geração de cobranças é feita em <strong>Precificação e Cobrança</strong>, por cliente, com o valor de
          honorário já calculado. Aqui define apenas a <strong>API Key</strong> e os{" "}
          <strong>dias até ao vencimento</strong> contados a partir do dia em que a cobrança é gerada.
        </p>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(ev) => setEnabled(ev.target.checked)}
            />{" "}
            Integração Asaas ativa
          </label>
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>API Key (access_token)</label>
          <input
            type="password"
            value={apiKey}
            onChange={(ev) => setApiKey(ev.target.value)}
            placeholder="Cole a chave; deixe vazio para manter a atual"
            autoComplete="new-password"
          />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Dias até ao vencimento (após gerar a cobrança)</label>
          <input
            type="number"
            min={0}
            max={365}
            value={dueDays}
            onChange={(ev) => setDueDays(Number(ev.target.value))}
            aria-label="Dias até ao vencimento após gerar cobrança"
          />
          <p className="cell-sub" style={{ marginTop: "0.35rem" }}>
            Ex.: 7 = vencimento uma semana após a criação da cobrança no Asaas.
          </p>
        </div>
        <div className="actions-row" style={{ gridColumn: "1 / -1" }}>
          <button type="submit" className="btn btn-primary" disabled={savingCfg}>
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}

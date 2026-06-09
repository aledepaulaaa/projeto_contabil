import { FormEvent, useCallback, useEffect, useState } from "react";
import { fetchAsaasConfig, putAsaasConfig } from "../api/client";

export function AsaasIntegracaoPanel() {
  const [loading, setLoading] = useState(true);
  const [cfgErr, setCfgErr] = useState<string | null>(null);
  const [cfgOk, setCfgOk] = useState<string | null>(null);
  const [savingCfg, setSavingCfg] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [sandboxMode, setSandboxMode] = useState(true);
  const [sandboxApiKey, setSandboxApiKey] = useState("");
  const [productionApiKey, setProductionApiKey] = useState("");
  const [dueDays, setDueDays] = useState(7);

  const loadCfg = useCallback(async () => {
    setLoading(true);
    setCfgErr(null);
    try {
      const c = await fetchAsaasConfig();
      setEnabled(Boolean(c.enabled));
      setSandboxMode(c.sandboxMode !== false);
      const d = Number(c.dueDays);
      setDueDays(Number.isFinite(d) && d >= 0 ? Math.min(365, Math.floor(d)) : 7);
      setSandboxApiKey(c.sandboxApiKey ?? "");
      setProductionApiKey(c.productionApiKey ?? "");
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
        sandboxMode,
        dueDays: Math.min(365, Math.max(0, Math.floor(Number(dueDays)) || 7)),
      };
      if (sandboxApiKey.trim()) body.sandboxApiKey = sandboxApiKey.trim();
      if (productionApiKey.trim()) body.productionApiKey = productionApiKey.trim();
      await putAsaasConfig(body);
      setCfgOk(`Configuração Asaas guardada com sucesso. Ambiente ativado: ${sandboxMode ? "Sandbox (Testes)" : "Produção"}.`);
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
        <div className="field" style={{ gridColumn: "1 / -1", display: "flex", gap: "2rem" }}>
          <label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(ev) => setEnabled(ev.target.checked)}
            />{" "}
            Integração Asaas ativa
          </label>
          
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div className={`status-badge ${sandboxMode ? "status-warning" : "status-success"}`} style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "bold" }}>
              {sandboxMode ? "TESTE" : "PROD"}
            </div>
            <input
              type="checkbox"
              checked={sandboxMode}
              onChange={(ev) => setSandboxMode(ev.target.checked)}
            />{" "}
            Modo Sandbox (Testes)
          </label>
        </div>
        
        {sandboxMode ? (
          <div className="field" style={{ gridColumn: "1 / -1", backgroundColor: "rgba(255, 152, 0, 0.05)", padding: "1rem", borderRadius: "8px", border: "1px dashed #ff9800" }}>
            <label style={{ color: "#e65100" }}>API Key (Sandbox / Ambiente de Testes)</label>
            <input
              type="password"
              value={sandboxApiKey}
              onChange={(ev) => setSandboxApiKey(ev.target.value)}
              placeholder="Cole a chave de sandbox (sandbox.asaas.com); deixe vazio para manter a atual"
              autoComplete="new-password"
            />
            {sandboxApiKey === "***" && <div style={{ color: "green", fontSize: "0.85rem", marginTop: "0.25rem", fontWeight: "bold" }}>✓ Chave Sandbox salva no servidor.</div>}
            <p className="cell-sub" style={{ marginTop: "0.25rem", color: "#e65100" }}>
              Esta chave será usada exclusivamente enquanto o "Modo Sandbox" estiver ativo. Cobranças geradas não serão reais.
            </p>
          </div>
        ) : (
          <div className="field" style={{ gridColumn: "1 / -1", backgroundColor: "rgba(76, 175, 80, 0.05)", padding: "1rem", borderRadius: "8px", border: "1px dashed #4caf50" }}>
            <label style={{ color: "#2e7d32" }}>API Key (Produção / Ambiente Real)</label>
            <input
              type="password"
              value={productionApiKey}
              onChange={(ev) => setProductionApiKey(ev.target.value)}
              placeholder="Cole a chave de produção (asaas.com); deixe vazio para manter a atual"
              autoComplete="new-password"
            />
            {productionApiKey === "***" && <div style={{ color: "green", fontSize: "0.85rem", marginTop: "0.25rem", fontWeight: "bold" }}>✓ Chave de Produção salva no servidor.</div>}
            <p className="cell-sub" style={{ marginTop: "0.25rem", color: "#2e7d32" }}>
              Esta chave será usada para gerar cobranças reais com validade jurídica.
            </p>
          </div>
        )}
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

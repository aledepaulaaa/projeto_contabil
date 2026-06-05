import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  fetchSerproConfig,
  putSerproConfig,
  postSerproExtrairChave,
  postSerproTestarToken
} from "../api/client";

export function SerproIntegracaoPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [consumerKey, setConsumerKey] = useState("");
  const [consumerSecret, setConsumerSecret] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://gateway.apiserpro.serpro.gov.br/renda-pf-trial/v1");
  const [authUrl, setAuthUrl] = useState("https://autenticacao.sapi.serpro.gov.br/authenticate");
  const [roleType, setRoleType] = useState("TERCEIROS");
  const [certPassword, setCertPassword] = useState("");

  const [hasCert, setHasCert] = useState(false);
  const [hasPrivateKey, setHasPrivateKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const c = await fetchSerproConfig();
      setEnabled(Boolean(c.enabled));
      setConsumerKey(c.consumerKey ?? "");
      setBaseUrl(c.baseUrl || "https://gateway.apiserpro.serpro.gov.br/renda-pf-trial/v1");
      setAuthUrl(c.authUrl || "https://autenticacao.sapi.serpro.gov.br/authenticate");
      setRoleType(c.roleType || "TERCEIROS");
      setHasCert(Boolean(c.hasCert));
      setHasPrivateKey(Boolean(c.hasPrivateKey));

      // Limpa inputs sensitivos no load
      setConsumerSecret("");
      setCertPassword("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao carregar integração SERPRO");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setSaving(true);
    setConnectionStatus(null);
    try {
      const body: Record<string, unknown> = {
        enabled,
        consumerKey: consumerKey.trim(),
        baseUrl: baseUrl.trim(),
        authUrl: authUrl.trim(),
        roleType: roleType.trim(),
      };
      if (consumerSecret.trim()) {
        body.consumerSecret = consumerSecret.trim();
      }
      if (certPassword.trim()) {
        body.certPassword = certPassword.trim();
      }
      await putSerproConfig(body);
      setOk("Configurações SERPRO guardadas com sucesso.");
      setConsumerSecret("");
      setCertPassword("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao guardar configurações SERPRO");
    } finally {
      setSaving(false);
    }
  }

  async function onExtractKey() {
    setErr(null);
    setOk(null);
    setExtracting(true);
    setConnectionStatus(null);
    try {
      const res = await postSerproExtrairChave();
      if (res.ok) {
        setOk(res.message);
        await load();
      } else {
        setErr(res.message);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao extrair chave privada do certificado");
    } finally {
      setExtracting(false);
    }
  }

  async function onTestAuth() {
    setErr(null);
    setOk(null);
    setTesting(true);
    setConnectionStatus(null);
    try {
      const res = await postSerproTestarToken();
      setConnectionStatus(res);
      if (res.ok) {
        setOk(res.message);
      } else {
        setErr(res.message);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao testar autenticação");
      setConnectionStatus({ ok: false, message: e instanceof Error ? e.message : "Erro de conexão" });
    } finally {
      setTesting(false);
    }
  }

  if (loading) return <p className="monitor-hint">A carregar integração SERPRO…</p>;

  return (
    <div className="serpro-integracao">
      {err ? <div className="error-toast">{err}</div> : null}
      {ok ? <div className="info-toast">{ok}</div> : null}

      <form className="form-grid cols-2" onSubmit={onSave}>
        <p className="cell-sub" style={{ gridColumn: "1 / -1", marginTop: 0 }}>
          Integração com a API do SERPRO (Integra Contador / SAPI) para consulta de dados cadastrais e fiscais do contribuinte (Consulta Renda).
          Esta integração exige um <strong>certificado digital A1 (PFX)</strong> carregado nas configurações de Contador.
        </p>

        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />{" "}
            Integração SERPRO ativa
          </label>
        </div>

        <div className="field">
          <label>Consumer Key</label>
          <input
            style={{ width: "80%" }}
            type="text"
            value={consumerKey}
            onChange={(e) => setConsumerKey(e.target.value)}
            placeholder="Cole o Consumer Key do portal SERPRO"
          />
        </div>

        <div className="field">
          <label>Consumer Secret</label>
          <input
            style={{ width: "80%" }}
            type="password"
            value={consumerSecret}
            onChange={(e) => setConsumerSecret(e.target.value)}
            placeholder="Deixe em branco para manter o atual"
            autoComplete="new-password"
          />
        </div>

        <div className="field">
          <label>URL Base da API</label>
          <input
            style={{ width: "80%" }}
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="Ex.: https://gateway.apiserpro.serpro.gov.br/renda-pf-trial/v1"
          />
        </div>

        <div className="field">
          <label>URL de Autenticação (SAPI)</label>
          <input
            style={{ width: "80%" }}
            type="text"
            value={authUrl}
            onChange={(e) => setAuthUrl(e.target.value)}
            placeholder="Ex.: https://autenticacao.sapi.serpro.gov.br/authenticate"
          />
        </div>

        <div className="field">
          <label>Role Type</label>
          <select
            value={roleType}
            onChange={(e) => setRoleType(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
          >
            <option value="TERCEIROS">TERCEIROS (Apenas e-CNPJ)</option>
            <option value="TITULAR">TITULAR (Pessoa Física - e-CPF)</option>
            <option value="REPRESENTANTE_LEGAL">REPRESENTANTE_LEGAL</option>
          </select>
        </div>

        <div className="field">
          <label>Senha do Certificado PFX (Opcional)</label>
          <input
            style={{ width: "80%" }}
            type="password"
            value={certPassword}
            onChange={(e) => setCertPassword(e.target.value)}
            placeholder="Preencha se desejar sincronizar com a senha do Contador"
            autoComplete="new-password"
          />
        </div>

        <div className="actions-row" style={{ gridColumn: "1 / -1" }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "A Guardar..." : "Guardar Configurações"}
          </button>
        </div>
      </form>

      <hr style={{ margin: "2rem 0", borderColor: "var(--border-color, #eaeaea)", borderStyle: "solid", borderWidth: "1px 0 0 0" }} />

      <div className="form-grid cols-2">
        <h3 style={{ gridColumn: "1 / -1", margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>Passo 2: Extrair Chave Privada RSA</h3>

        <p className="cell-sub" style={{ gridColumn: "1 / -1", marginTop: 0 }}>
          A API do SERPRO exige a chave privada RSA do eCNPJ do contador para decodificar as respostas de dados.
          Certifique-se de fazer o upload do certificado PFX e configurar a senha no menu <strong>Contador</strong> primeiro.
        </p>

        <div className="field" style={{ gridColumn: "1 / -1", marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
            <div>
              <strong>Certificado A1:</strong>{" "}
              {hasCert ? (
                <span style={{ color: "green", fontWeight: "bold" }}>✓ Carregado</span>
              ) : (
                <span style={{ color: "red", fontWeight: "bold" }}>✗ Não Carregado (Aceda ao menu Contador)</span>
              )}
            </div>
            <div>
              <strong>Chave Privada Extratada:</strong>{" "}
              {hasPrivateKey ? (
                <span style={{ color: "green", fontWeight: "bold" }}>✓ Gerada com Sucesso</span>
              ) : (
                <span style={{ color: "orange", fontWeight: "bold" }}>⚠ Pendente de Extração</span>
              )}
            </div>
          </div>
        </div>

        <div className="actions-row" style={{ gridColumn: "1 / -1" }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onExtractKey}
            disabled={extracting || !hasCert}
          >
            {extracting ? "A Extrair..." : "🔑 Extrair Chave Privada do Certificado"}
          </button>
        </div>
      </div>

      <hr style={{ margin: "2rem 0", borderColor: "var(--border-color, #eaeaea)", borderStyle: "solid", borderWidth: "1px 0 0 0" }} />

      <div className="form-grid cols-2">
        <h3 style={{ gridColumn: "1 / -1", margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>Passo 3: Validar Autenticação (SAPI)</h3>

        {connectionStatus && (
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <div
              style={{
                padding: "1rem",
                borderRadius: "4px",
                backgroundColor: connectionStatus.ok ? "rgba(76, 175, 80, 0.1)" : "rgba(244, 67, 54, 0.1)",
                border: `1px solid ${connectionStatus.ok ? "#4caf50" : "#f44336"}`,
                color: connectionStatus.ok ? "#2e7d32" : "#c62828",
                marginBottom: "1rem"
              }}
            >
              {connectionStatus.ok ? "✔️ " : "❌ "} {connectionStatus.message}
            </div>
          </div>
        )}

        <div className="actions-row" style={{ gridColumn: "1 / -1" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onTestAuth}
            disabled={testing || !hasCert || !hasPrivateKey}
          >
            {testing ? "A Testar..." : "🔄 Testar Autenticação (SAPI)"}
          </button>
        </div>
      </div>
    </div>
  );
}

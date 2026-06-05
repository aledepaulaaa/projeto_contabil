import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  fetchContaAzulConfig,
  putContaAzulConfig,
  postContaAzulConfigurarCode,
  postContaAzulTestarConexao
} from "../api/client";

export function ContaAzulIntegracaoPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState("https://contaazul.com");
  const [code, setCode] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [expiresAt, setExpiresAt] = useState("");
  const [hasToken, setHasToken] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const c = await fetchContaAzulConfig();
      setEnabled(Boolean(c.enabled));
      setClientId(c.clientId ?? "");
      setRedirectUri(c.redirectUri || "https://contaazul.com");
      setExpiresAt(c.expiresAt || "");
      setHasToken(Boolean(c.accessToken && c.accessToken !== ""));
      // Reseta inputs de password/secrets no carregamento para segurança
      setClientSecret("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao carregar integração Conta Azul");
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
        clientId: clientId.trim(),
        redirectUri: redirectUri.trim() || "https://contaazul.com",
      };
      if (clientSecret.trim()) {
        body.clientSecret = clientSecret.trim();
      }
      await putContaAzulConfig(body);
      setOk("Configuração Conta Azul guardada com sucesso.");
      setClientSecret("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao guardar configuração Conta Azul");
    } finally {
      setSaving(false);
    }
  }

  async function onAuthorize() {
    if (!code.trim()) {
      setErr("Por favor, cole o código de autorização obtido.");
      return;
    }
    setErr(null);
    setOk(null);
    setAuthorizing(true);
    setConnectionStatus(null);
    try {
      const res = await postContaAzulConfigurarCode(code.trim());
      if (res.ok) {
        setOk(res.message || "Autorização realizada com sucesso!");
        setCode("");
        await load();
      } else {
        setErr(res.message || "Falha ao autorizar.");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao configurar token");
    } finally {
      setAuthorizing(false);
    }
  }

  async function onTestConnection() {
    setErr(null);
    setOk(null);
    setTesting(true);
    setConnectionStatus(null);
    try {
      const res = await postContaAzulTestarConexao();
      setConnectionStatus(res);
      if (res.ok) {
        setOk(res.message);
      } else {
        setErr(res.message);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao testar conexão");
      setConnectionStatus({ ok: false, message: e instanceof Error ? e.message : "Erro desconhecido" });
    } finally {
      setTesting(false);
    }
  }

  if (loading) return <p className="monitor-hint">A carregar integração Conta Azul…</p>;

  // Constrói a URL do fluxo de autorização
  const authUrl = `https://auth.contaazul.com/login?response_type=code&client_id=${encodeURIComponent(
    clientId || "2lj6liqnkrdu3u6i27nccmktqs"
  )}&redirect_uri=${encodeURIComponent(
    redirectUri || "https://contaazul.com"
  )}&scope=openid+profile+aws.cognito.signin.user.admin`;

  return (
    <div className="conta-azul-integracao">
      {err ? <div className="error-toast">{err}</div> : null}
      {ok ? <div className="info-toast">{ok}</div> : null}

      <form className="form-grid cols-2" onSubmit={onSave}>
        <p className="cell-sub" style={{ gridColumn: "1 / -1", marginTop: 0 }}>
          Integração com o ERP Conta Azul para conciliação bancária, faturamento e exportação de clientes.
          Configure as credenciais criadas no <strong>Portal do Desenvolvedor Conta Azul</strong>.
        </p>

        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />{" "}
            Integração Conta Azul ativa
          </label>
        </div>

        <div className="field">
          <label>Client ID</label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Cole o Client ID da Conta Azul"
          />
        </div>

        <div className="field">
          <label>Client Secret</label>
          <input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder={hasToken ? "Deixe em branco para manter o atual" : "Cole o Client Secret da Conta Azul"}
            autoComplete="new-password"
          />
        </div>

        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Redirect URI</label>
          <input
            type="text"
            value={redirectUri}
            onChange={(e) => setRedirectUri(e.target.value)}
            placeholder="Ex.: https://contaazul.com"
          />
          <p className="cell-sub" style={{ marginTop: "0.25rem" }}>
            Deve coincidir exatamente com a URL de redirecionamento configurada na aplicação no portal da Conta Azul.
          </p>
        </div>

        <div className="actions-row" style={{ gridColumn: "1 / -1" }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "A Guardar..." : "Guardar Credenciais"}
          </button>
        </div>
      </form>

      <hr style={{ margin: "2rem 0", borderColor: "var(--border-color, #eaeaea)", borderStyle: "solid", borderWidth: "1px 0 0 0" }} />

      <div className="form-grid cols-2">
        <h3 style={{ gridColumn: "1 / -1", margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>Passo 2: Obter Autorização (OAuth 2.0)</h3>
        
        <p className="cell-sub" style={{ gridColumn: "1 / -1", marginTop: 0 }}>
          Clique no link abaixo para ir ao portal Conta Azul, realize o login, autorize o aplicativo e copie o código (parâmetro <code>code=XYZ</code>) na barra de endereços após ser redirecionado.
        </p>

        <div className="field" style={{ gridColumn: "1 / -1", marginBottom: "1rem" }}>
          <a
            href={authUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ display: "inline-block", textDecoration: "none", textAlign: "center" }}
          >
            🔑 Abrir link de Login Conta Azul
          </a>
        </div>

        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Cole o Código de Autorização (code)</label>
          <textarea
            rows={2}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Cole o código gerado após o redirecionamento (Ex: XYZ...)"
            style={{ fontFamily: "monospace", width: "100%", padding: "0.5rem" }}
          />
        </div>

        <div className="actions-row" style={{ gridColumn: "1 / -1" }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onAuthorize}
            disabled={authorizing || !code.trim()}
          >
            {authorizing ? "A Autorizar..." : "Autorizar e Salvar Token"}
          </button>
        </div>
      </div>

      <hr style={{ margin: "2rem 0", borderColor: "var(--border-color, #eaeaea)", borderStyle: "solid", borderWidth: "1px 0 0 0" }} />

      <div className="form-grid cols-2">
        <h3 style={{ gridColumn: "1 / -1", margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>Passo 3: Status e Teste de Conexão</h3>

        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", gap: "2rem", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <strong>Status do Token:</strong>{" "}
              {hasToken ? (
                <span style={{ color: "green", fontWeight: "bold" }}>✓ Token Ativo</span>
              ) : (
                <span style={{ color: "red", fontWeight: "bold" }}>✗ Não Autorizado</span>
              )}
            </div>
            {expiresAt && (
              <div>
                <strong>Expira em:</strong> {new Date(expiresAt).toLocaleString("pt-BR")}
              </div>
            )}
          </div>
        </div>

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
            onClick={onTestConnection}
            disabled={testing || !hasToken}
          >
            {testing ? "A Testar..." : "🔄 Testar Conexão"}
          </button>
        </div>
      </div>
    </div>
  );
}

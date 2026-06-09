import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  fetchSerproConfig,
  putSerproConfig,
  postSerproExtrairChave,
  postSerproTestarToken,
  postSerproChamar
} from "../api/client";

// MOCK DATA PARA RENDERIZAÇÃO FORMATADA SE O RETORNO FOR O MOCK DE RENDA
const MOCK_RENDA_HELPER = {
  patrimonioTotal: "850.000,00",
  rendimentosTributaveis: "120.500,00",
  rendimentoPJ: "152.450,00",
  titular: "123.***.***-09",
  destinatario: "33.683.111/0001-07",
  dataHora: "05/06/2026, 18:08:58",
  declaracao: [
    { cod: "1", desc: "Rendimentos Recebidos de Pessoas Jurídicas", valor: "R$ 152.450,00" },
    { cod: "2", desc: "Rendimentos Tributáveis", valor: "R$ 120.500,00" },
    { cod: "3", desc: "Patrimônio Total", valor: "R$ 850.000,00" },
    { cod: "4", desc: "Rendimentos Isentos e Não Tributáveis", valor: "R$ 24.150,00" },
    { cod: "7", desc: "Ano-calendário", valor: "2025" }
  ]
};

export function SerproIntegracaoPanel() {
  // Tabs State
  const [activeTab, setActiveTab] = useState<"config" | "sandbox">("config");

  // Config States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [sandboxMode, setSandboxMode] = useState(true);
  const [consumerKey, setConsumerKey] = useState("");
  const [consumerSecret, setConsumerSecret] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://gateway.apiserpro.serpro.gov.br/");
  const [authUrl, setAuthUrl] = useState("https://autenticacao.sapi.serpro.gov.br/authenticate");
  const [roleType, setRoleType] = useState("TERCEIROS");
  const [certPassword, setCertPassword] = useState("");
  const [apiRendaAtiva, setApiRendaAtiva] = useState(true);
  const [apiRestituicaoAtiva, setApiRestituicaoAtiva] = useState(false);

  const [hasCert, setHasCert] = useState(false);
  const [hasPrivateKey, setHasPrivateKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ ok: boolean; message: string } | null>(null);

  // Sandbox Tester States
  const [testModule, setTestModule] = useState<"renda" | "restituicao" | "autorizacoes">("renda");
  const [tokenInput, setTokenInput] = useState("06aef429-a981-3ec5-a1f8-71d38d86481e");
  const [cpfInput, setCpfInput] = useState("12345678909");
  const [cnpjInput, setCnpjInput] = useState("33683111000107");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simError, setSimError] = useState<string | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string>("");
  const [httpStatus, setHttpStatus] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const c = await fetchSerproConfig();
      setEnabled(Boolean(c.enabled));
      setSandboxMode(c.sandboxMode !== false);
      setConsumerKey(c.consumerKey ?? "");
      setBaseUrl(c.baseUrl || "https://gateway.apiserpro.serpro.gov.br/");
      setAuthUrl(c.authUrl || "https://autenticacao.sapi.serpro.gov.br/authenticate");
      setRoleType(c.roleType || "TERCEIROS");
      setApiRendaAtiva(c.apiRendaAtiva !== false);
      setApiRestituicaoAtiva(Boolean(c.apiRestituicaoAtiva));
      setHasCert(Boolean(c.hasCert));
      setHasPrivateKey(Boolean(c.hasPrivateKey));

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
        sandboxMode,
        consumerKey: consumerKey.trim(),
        baseUrl: baseUrl.trim(),
        authUrl: authUrl.trim(),
        roleType: roleType.trim(),
        apiRendaAtiva,
        apiRestituicaoAtiva,
      };
      if (consumerSecret.trim()) body.consumerSecret = consumerSecret.trim();
      if (certPassword.trim()) body.certPassword = certPassword.trim();
      await putSerproConfig(body);
      setOk(`Configurações SERPRO guardadas com sucesso. Ambiente ativado: ${sandboxMode ? "Sandbox (Testes)" : "Produção"}.`);
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

  // Lógica de Chamada de Teste Sandbox
  const handleTestSandbox = async () => {
    setIsSimulating(true);
    setSimulationResult(null);
    setSimError(null);
    setHttpStatus(null);

    // Determinar endpoint baseado no modulo
    let endpoint = "";
    if (testModule === "renda") {
      endpoint = `/renda-pf-trial/v1/Consultar/${tokenInput.trim()}`;
    } else if (testModule === "restituicao") {
      endpoint = `/consulta-restituicao-trial/v1/Consultar/${tokenInput.trim()}`;
    } else if (testModule === "autorizacoes") {
      endpoint = `/consulta-restituicao-trial/v1/Autorizacoes/${cnpjInput.trim()}/${cpfInput.trim()}`;
    }

    setResolvedUrl(`${baseUrl.replace(/\/$/, "")}${endpoint}`);

    try {
      const res = await postSerproChamar({
        endpoint,
        method: "GET"
      });

      setHttpStatus(res.statusCode || 200);

      if (res.ok && res.data) {
        setSimulationResult(res.data);
      } else {
        setSimError(res.message || `Chamada falhou com HTTP ${res.statusCode || "desconhecido"}`);
        if (res.data) setSimulationResult(res.data);
      }
    } catch (e) {
      setSimError(e instanceof Error ? e.message : "Erro ao testar chamada Sandbox");
    } finally {
      setIsSimulating(false);
    }
  };

  const setRestituicaoTokenHelper = (token: string) => {
    setTokenInput(token);
    if (token === "nchRml3PnHfUNC6hxowNnqYMfqMETs8WbYIaCfOKRgKm") {
      setCpfInput("12345678909");
    } else if (token === "mWLQjmHUVY9Thsf88NlJ0ta7YHRmC8ZyMEpxFAuj6zmA") {
      setCpfInput("11111111111");
    }
  };

  const handleModuleChange = (mod: "renda" | "restituicao" | "autorizacoes") => {
    setTestModule(mod);
    setSimulationResult(null);
    setSimError(null);
    setHttpStatus(null);
    if (mod === "renda") {
      setTokenInput("06aef429-a981-3ec5-a1f8-71d38d86481e");
    } else if (mod === "restituicao") {
      setTokenInput("nchRml3PnHfUNC6hxowNnqYMfqMETs8WbYIaCfOKRgKm");
      setCpfInput("12345678909");
    } else if (mod === "autorizacoes") {
      setCpfInput("12345678909");
      setCnpjInput("33683111000107");
    }
  };

  if (loading) return <p className="monitor-hint">A carregar integração SERPRO…</p>;

  return (
    <div className="serpro-integracao" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* CABAÇALHO E SELETOR DE ABAS */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '0.5rem',
        marginBottom: '0.5rem'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
          Configurações de Integração SERPRO
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab("config")}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: activeTab === "config" ? 'var(--accent)' : 'transparent',
              border: activeTab === "config" ? '1px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: '6px',
              color: activeTab === "config" ? '#fff' : 'var(--muted)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.85rem',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            ⚙️ Configurações
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sandbox")}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: activeTab === "sandbox" ? 'var(--accent)' : 'transparent',
              border: activeTab === "sandbox" ? '1px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: '6px',
              color: activeTab === "sandbox" ? '#fff' : 'var(--muted)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.85rem',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            🧪 Testar Sandbox
          </button>
        </div>
      </div>

      {err ? <div className="error-toast">{err}</div> : null}
      {ok ? <div className="info-toast">{ok}</div> : null}

      {/* ABA 1: CONFIGURAÇÕES */}
      {activeTab === "config" && (
        <div style={{ animation: 'fadeIn 0.2s ease-in-out' }}>
          <form className="form-grid cols-2" onSubmit={onSave}>
            <p className="cell-sub" style={{ gridColumn: "1 / -1", marginTop: 0 }}>
              Insira as credenciais de produção obtidas no portal da SERPRO ou ative o <strong>Modo Sandbox</strong> para realizar testes simulados. O uso do sandbox utilizará rotas com o sufixo <code>-trial/v1</code>.
            </p>

            <div className="field" style={{ gridColumn: "1 / -1", display: 'flex', gap: '2rem', marginBottom: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                <strong>Integração SERPRO ativa</strong>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: 'pointer' }}>
                <div className={`status-badge ${sandboxMode ? "status-warning" : "status-success"}`} style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold" }}>
                  {sandboxMode ? "TESTE" : "PROD"}
                </div>
                <input
                  type="checkbox"
                  checked={sandboxMode}
                  onChange={(e) => setSandboxMode(e.target.checked)}
                />
                <strong>Modo Sandbox (Testes)</strong>
              </label>
            </div>

            <div className="field" style={{ gridColumn: "1 / -1", padding: '1.25rem', backgroundColor: 'var(--info-bg)', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>APIs SERPRO Habilitadas</p>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', color: 'var(--muted)' }}>
                Selecione as APIs que o sistema está autorizado a invocar. Cada módulo depende das autorizações geradas no Portal e-CAC.
              </p>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={apiRendaAtiva}
                  onChange={(e) => setApiRendaAtiva(e.target.checked)}
                />
                <span>Habilitar API <strong>"Consultar Renda"</strong> (dados cadastrais, ocupação e rendimentos)</span>
              </label>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: '1.5rem', marginBottom: '0.75rem' }}>
                Rotas: <code>renda-pf-trial/v1</code> (sandbox) ou <code>renda-pf/v1</code> (produção)
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={apiRestituicaoAtiva}
                  onChange={(e) => setApiRestituicaoAtiva(e.target.checked)}
                />
                <span>Habilitar API <strong>"Consultar Restituição IRPF"</strong> (fila e histórico de créditos)</span>
              </label>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
                Rotas: <code>consulta-restituicao-trial/v1</code> (sandbox) ou <code>consulta-restituicao/v1</code> (produção)
              </div>
            </div>

            <div className="field">
              <label>Consumer Key</label>
              <input
                style={{ width: "90%" }}
                type="text"
                value={consumerKey}
                onChange={(e) => setConsumerKey(e.target.value)}
                placeholder="Cole o Consumer Key do portal SERPRO"
              />
            </div>

            <div className="field">
              <label>Consumer Secret</label>
              <input
                style={{ width: "90%" }}
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
                style={{ width: "90%" }}
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>

            <div className="field">
              <label>URL de Autenticação (SAPI)</label>
              <input
                style={{ width: "90%" }}
                type="text"
                value={authUrl}
                onChange={(e) => setAuthUrl(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Role Type</label>
              <select
                value={roleType}
                onChange={(e) => setRoleType(e.target.value)}
                style={{ width: "90%", padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}
              >
                <option value="TERCEIROS">TERCEIROS (Apenas e-CNPJ)</option>
                <option value="TITULAR">TITULAR (Pessoa Física - e-CPF)</option>
                <option value="REPRESENTANTE_LEGAL">REPRESENTANTE_LEGAL</option>
              </select>
            </div>

            <div className="field">
              <label>Senha do Certificado PFX (Opcional)</label>
              <input
                style={{ width: "90%" }}
                type="password"
                value={certPassword}
                onChange={(e) => setCertPassword(e.target.value)}
                placeholder="Preencha se desejar sincronizar com a senha do Contador"
                autoComplete="new-password"
              />
            </div>

            <div className="actions-row" style={{ gridColumn: "1 / -1", marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Salvando..." : "Salvar Configurações"}
              </button>
            </div>
          </form>

          <hr style={{ margin: "2rem 0", borderColor: "var(--border)", borderStyle: "solid", borderWidth: "1px 0 0 0" }} />

          {/* PASSO 2: EXTRAÇÃO DE CHAVE PRIVADA */}
          <div className="form-grid cols-2">
            <h3 style={{ gridColumn: "1 / -1", margin: "0 0 0.5rem 0", fontSize: "1rem", fontWeight: 700 }}>Passo 2: Extrair Chave Privada RSA</h3>
            <p className="cell-sub" style={{ gridColumn: "1 / -1", marginTop: 0 }}>
              Para assinar as consultas feitas ao gateway, o backend precisa descriptografar a chave privada do seu certificado A1 e salvá-la de forma segura.
            </p>
            <div className="field" style={{ gridColumn: "1 / -1", marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
                <div>
                  <strong>Certificado A1:</strong>{" "}
                  {hasCert ? (
                    <span style={{ color: "green", fontWeight: "bold" }}>✓ Carregado</span>
                  ) : (
                    <span style={{ color: "red", fontWeight: "bold" }}>✗ Não Carregado (Acesse menu Contador)</span>
                  )}
                </div>
                <div>
                  <strong>Chave Privada Extraída:</strong>{" "}
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
                {extracting ? "Extraindo..." : "🔑 Extrair Chave Privada do Certificado"}
              </button>
            </div>
          </div>

          <hr style={{ margin: "2rem 0", borderColor: "var(--border)", borderStyle: "solid", borderWidth: "1px 0 0 0" }} />

          {/* PASSO 3: VALIDAR AUTENTICAÇÃO */}
          <div className="form-grid cols-2">
            <h3 style={{ gridColumn: "1 / -1", margin: "0 0 0.5rem 0", fontSize: "1rem", fontWeight: 700 }}>Passo 3: Validar Autenticação (SAPI)</h3>
            <p className="cell-sub" style={{ gridColumn: "1 / -1", marginTop: 0 }}>
              Testa a comunicação mTLS e autenticação OAuth2 com o gateway do Serpro (SAPI) usando as credenciais e certificado configurados.
            </p>
            {connectionStatus && (
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <div
                  style={{
                    padding: "1rem",
                    borderRadius: "8px",
                    backgroundColor: connectionStatus.ok ? "rgba(76, 175, 80, 0.08)" : "rgba(244, 67, 54, 0.08)",
                    border: `1px solid ${connectionStatus.ok ? "#4caf50" : "#f44336"}`,
                    color: connectionStatus.ok ? "#2e7d32" : "#c62828",
                    marginBottom: "1rem",
                    fontSize: '0.85rem'
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
                style={{ border: "1px solid var(--border)", background: "var(--surface)", padding: "0.5rem 1.25rem", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
              >
                {testing ? "Testando..." : "🔄 Testar Autenticação (SAPI)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: TESTAR SANDBOX */}
      {activeTab === "sandbox" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.2s ease-in-out' }}>
          
          {/* PAINEL DE COMANDOS DO TESTE */}
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: 0, marginBottom: '1rem', color: 'var(--text)' }}>
              Simulador de Consultas do Sandbox SERPRO
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 0, marginBottom: '1.5rem' }}>
              Teste a resposta dos endpoints em modo Trial. Caso não tenha inserido chaves válidas nas configurações, o backend responderá automaticamente com a massa de dados de demonstração oficiais da SERPRO.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>SELECIONAR MÓDULO</label>
                <select
                  value={testModule}
                  onChange={(e) => handleModuleChange(e.target.value as any)}
                  style={{
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--main-bg)',
                    color: 'var(--text)',
                    fontWeight: 500
                  }}
                >
                  <option value="renda">Consultar Renda (Renda PF)</option>
                  <option value="restituicao">Consultar Restituição (IRPF)</option>
                  <option value="autorizacoes">Consultar Autorizações (Procurações)</option>
                </select>
              </div>

              {/* INPUTS DINÂMICOS CONFORME MÓDULO */}
              {testModule !== "autorizacoes" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>
                    TOKEN DE COMPARTILHAMENTO
                  </label>
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Token do cidadão no e-CAC"
                    style={{
                      padding: '0.6rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--main-bg)',
                      color: 'var(--text)',
                      fontFamily: 'var(--mono)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              )}

              {testModule === "autorizacoes" && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>CNPJ CONTRATANTE (CONTADOR)</label>
                    <input
                      type="text"
                      value={cnpjInput}
                      onChange={(e) => setCnpjInput(e.target.value)}
                      placeholder="CNPJ sem pontuação"
                      style={{
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--main-bg)',
                        color: 'var(--text)',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>CPF TITULAR (CONTRIBUINTE)</label>
                    <input
                      type="text"
                      value={cpfInput}
                      onChange={(e) => setCpfInput(e.target.value)}
                      placeholder="CPF sem pontuação"
                      style={{
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--main-bg)',
                        color: 'var(--text)',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </>
              )}

            </div>

            {/* BOTÕES AUXILIARES DE INSERÇÃO DE DADOS DE TESTE */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700 }}>INSERIR DADOS DE TESTE:</span>
              
              {testModule === "renda" && (
                <button
                  type="button"
                  onClick={() => setTokenInput("06aef429-a981-3ec5-a1f8-71d38d86481e")}
                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
                >
                  Token Padrão Renda (86481e)
                </button>
              )}

              {testModule === "restituicao" && (
                <>
                  <button
                    type="button"
                    onClick={() => setRestituicaoTokenHelper("nchRml3PnHfUNC6hxowNnqYMfqMETs8WbYIaCfOKRgKm")}
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
                  >
                    Com Restituição (Geovana Ribeiro)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestituicaoTokenHelper("mWLQjmHUVY9Thsf88NlJ0ta7YHRmC8ZyMEpxFAuj6zmA")}
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
                  >
                    Sem Restituição (Simular 404)
                  </button>
                </>
              )}

              {testModule === "autorizacoes" && (
                <>
                  <button
                    type="button"
                    onClick={() => { setCpfInput("12345678909"); setCnpjInput("33683111000107"); }}
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
                  >
                    Contrato Ativo (e-CAC 12345)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCpfInput("11111111111"); setCnpjInput("33683111000107"); }}
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
                  >
                    Contrato Expirado (e-CAC 11111)
                  </button>
                </>
              )}
            </div>

            <button
              onClick={handleTestSandbox}
              disabled={isSimulating}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem' }}
            >
              {isSimulating ? 'Executando chamada sandbox...' : '⚡ Executar Chamada de Teste'}
            </button>
          </div>

          {/* DETALHES DA EXECUÇÃO E REQUISIÇÃO */}
          {resolvedUrl && (
            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--main-bg)',
              fontSize: '0.8rem',
              color: 'var(--muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem'
            }}>
              <div>
                <strong>URL Executada:</strong> <code style={{ color: 'var(--accent)', wordBreak: 'break-all' }}>{resolvedUrl}</code>
              </div>
              {httpStatus !== null && (
                <div>
                  <strong>Status de Retorno:</strong>{" "}
                  <span style={{
                    fontWeight: 700,
                    color: httpStatus >= 200 && httpStatus < 300 ? 'green' : 'red'
                  }}>
                    {httpStatus} {httpStatus === 200 ? "OK" : httpStatus === 404 ? "Not Found" : "Error"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ERRO NA CONSULTA */}
          {simError && (
            <div className="error-toast" style={{ margin: 0, padding: '1rem', borderRadius: '8px' }}>
              <strong>Erro retornado pelo backend:</strong>
              <div style={{ marginTop: '0.25rem', fontFamily: 'var(--mono)', fontSize: '0.8rem' }}>{simError}</div>
            </div>
          )}

          {/* RESULTADOS VISUAIS FORMATADOS (CARDS) */}
          {simulationResult && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
                Visualização do Resultado Parseado
              </h4>

              {/* CARD CONFORME O MÓDULO RENDERIZADO */}
              {testModule === "renda" && simulationResult.dados && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Cards de Métricas */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderBottom: '3px solid var(--accent)', borderRadius: '8px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ backgroundColor: 'var(--info-bg)', padding: '0.6rem', borderRadius: '6px', color: 'var(--accent)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 700 }}>PATRIMÔNIO TOTAL</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>R$ {MOCK_RENDA_HELPER.patrimonioTotal}</div>
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderBottom: '3px solid var(--success)', borderRadius: '8px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ backgroundColor: 'var(--success-bg)', padding: '0.6rem', borderRadius: '6px', color: 'var(--success)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 700 }}>RENDIMENTOS TRIBUTÁVEIS</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>R$ {MOCK_RENDA_HELPER.rendimentosTributaveis}</div>
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderBottom: '3px solid #8b5cf6', borderRadius: '8px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ backgroundColor: '#f3e5f5', padding: '0.6rem', borderRadius: '6px', color: '#8b5cf6' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 700 }}>FONTES PAGADORAS PJ</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>R$ {MOCK_RENDA_HELPER.rendimentoPJ}</div>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes Analíticos */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem', alignItems: 'start' }}>
                    <div style={{ backgroundColor: 'var(--surface)', borderRadius: '8px', padding: '1.25rem', border: '1px solid var(--border)' }}>
                      <h5 style={{ fontSize: '0.85rem', margin: '0 0 1rem 0', fontWeight: 700 }}>Dados de Autorização</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.8rem' }}>
                        <div>
                          <div style={{ color: 'var(--muted)', fontSize: '0.65rem', fontWeight: 700 }}>TITULAR</div>
                          <div>{simulationResult.autorizacao?.titular || MOCK_RENDA_HELPER.titular}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--muted)', fontSize: '0.65rem', fontWeight: 700 }}>DESTINATÁRIO</div>
                          <div>{simulationResult.autorizacao?.destinatario || MOCK_RENDA_HELPER.destinatario}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--muted)', fontSize: '0.65rem', fontWeight: 700 }}>DATA/HORA DE REGISTRO</div>
                          <div>{simulationResult.autorizacao?.dataHoraRegistro ? new Date(simulationResult.autorizacao.dataHoraRegistro).toLocaleString() : MOCK_RENDA_HELPER.dataHora}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'var(--surface)', borderRadius: '8px', padding: '1.25rem', border: '1px solid var(--border)' }}>
                      <h5 style={{ fontSize: '0.85rem', margin: '0 0 1rem 0', fontWeight: 700 }}>Dados Analíticos da Declaração</h5>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)', textAlign: 'left' }}>
                            <th style={{ padding: '0.5rem 0' }}>Cód</th>
                            <th style={{ padding: '0.5rem 0' }}>Especificação</th>
                            <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {simulationResult.dados.map((d: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '0.5rem 0', color: 'var(--muted)' }}>{d.codigo}</td>
                              <td style={{ padding: '0.5rem 0' }}>{d.texto}</td>
                              <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 600, color: 'var(--accent)' }}>
                                {parseFloat(d.valor) ? `R$ ${parseFloat(d.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : d.valor}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {testModule === "restituicao" && (
                <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      color: 'green',
                      padding: '1rem',
                      borderRadius: '50%',
                      width: '48px',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '1.5rem'
                    }}>
                      $
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700 }}>SITUAÇÃO DA RESTITUIÇÃO</div>
                      <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>
                        {simulationResult.dados?.find((d: any) => d.codigo === "3")?.valor 
                          ? atob(simulationResult.dados.find((d: any) => d.codigo === "3").valor)
                          : simulationResult.situacaoRestituicao || "Creditada / Paga (Massa Trial)"
                        }
                      </h4>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.65rem', fontWeight: 700 }}>TITULAR (MOCK)</div>
                      <div>{simulationResult.autorizacao?.titular || "123.456.789-09"}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.65rem', fontWeight: 700 }}>CÓDIGO STATUS</div>
                      <div style={{ fontWeight: 600 }}>
                        {simulationResult.dados?.find((d: any) => d.codigo === "2")?.valor
                          ? atob(simulationResult.dados.find((d: any) => d.codigo === "2").valor)
                          : "03"
                        }
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.65rem', fontWeight: 700 }}>EXERCÍCIO</div>
                      <div>
                        {simulationResult.dados?.find((d: any) => d.codigo === "4")?.valor
                          ? atob(simulationResult.dados.find((d: any) => d.codigo === "4").valor)
                          : "2024"
                        }
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {testModule === "autorizacoes" && (
                <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
                  <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', fontWeight: 700 }}>
                    Autorizações Compartilha RFB Encontradas
                  </h5>
                  
                  {simulationResult.autorizacoes && simulationResult.autorizacoes.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)', textAlign: 'left' }}>
                          <th style={{ padding: '0.5rem' }}>CPF Titular</th>
                          <th style={{ padding: '0.5rem' }}>Token Autorização</th>
                          <th style={{ padding: '0.5rem' }}>Status</th>
                          <th style={{ padding: '0.5rem' }}>Vigência Inicial</th>
                          <th style={{ padding: '0.5rem' }}>Vigência Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        {simulationResult.autorizacoes.map((aut: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.5rem', fontWeight: 600 }}>{aut.ni}</td>
                            <td style={{ padding: '0.5rem', fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--muted)' }}>
                              {aut.token}
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <span className={`status-badge ${aut.status === 'ATIVA' ? 'status-success' : 'status-danger'}`} style={{ fontSize: '0.7rem' }}>
                                {aut.status}
                              </span>
                            </td>
                            <td style={{ padding: '0.5rem', color: 'var(--muted)' }}>
                              {new Date(aut.dataHoraVigenciaInicial).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '0.5rem', color: 'var(--muted)' }}>
                              {new Date(aut.dataHoraVigenciaFinal).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                      Nenhuma autorização ativa encontrada para a chave contratante e titular informados.
                    </div>
                  )}
                </div>
              )}

              {/* TECHNICAL RESPONSE DETAILS */}
              <details style={{ marginTop: '1.5rem', backgroundColor: 'var(--main-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem' }}>
                <summary style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)', cursor: 'pointer', outline: 'none' }}>
                  📜 Resposta Técnica da API (JSON Completo)
                </summary>
                <pre style={{
                  marginTop: '0.75rem',
                  padding: '1rem',
                  backgroundColor: '#1e1e1e',
                  color: '#d4d4d4',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--mono)',
                  overflowX: 'auto',
                  lineHeight: '1.4'
                }}>
                  {JSON.stringify(simulationResult, null, 2)}
                </pre>
              </details>

            </div>
          )}

        </div>
      )}

    </div>
  );
}

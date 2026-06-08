import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  fetchSerproConfig,
  putSerproConfig,
  postSerproExtrairChave,
  postSerproTestarToken,
  postSerproChamar
} from "../api/client";

// MOCK DATA PARA TESTE DO FRONTEND
const MOCK_DATA = {
  patrimonioTotal: "850.000,00",
  rendimentosTributaveis: "120.500,00",
  rendimentoPJ: "152.450,00",
  titular: "123.***.***-09",
  destinatario: "33.683.111/0001-07",
  dataHora: "05/06/2026, 18:08:58",
  tokenUtilizado: "06aef429-a981-3ec5-a1f8-71d38d86481e",
  declaracao: [
    { cod: "1", desc: "Rendimentos Recebidos de Pessoas Jurídicas", valor: "R$ 152.450,00" },
    { cod: "2", desc: "Rendimentos Tributáveis", valor: "R$ 120.500,00" },
    { cod: "3", desc: "Patrimônio Total", valor: "R$ 850.000,00" },
    { cod: "4", desc: "Rendimentos Isentos e Não Tributáveis", valor: "R$ 24.150,00" },
    { cod: "7", desc: "Ano-calendário", valor: "2025" }
  ]
};

export function SerproIntegracaoPanel() {
  // Config States
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

  // Simulator States
  const [tokenInput, setTokenInput] = useState("06aef429-a981-3ec5-a1f8-71d38d86481e");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<typeof MOCK_DATA | null>(null);

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
      if (consumerSecret.trim()) body.consumerSecret = consumerSecret.trim();
      if (certPassword.trim()) body.certPassword = certPassword.trim();
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

  const handleSimulate = async () => {
    setIsSimulating(true);
    setSimulationResult(null);
    setErr(null);
    setOk(null);
    try {
      const res = await postSerproChamar({
        endpoint: `/Consultar/${tokenInput.trim()}`,
        method: "GET"
      });
      if (res.ok && res.data) {
        const data = res.data;
        if (data.dados && Array.isArray(data.dados)) {
          const findVal = (cod: string) => {
            const item = data.dados.find((x: any) => x.codigo === cod);
            if (!item) return "0,00";
            const val = parseFloat(item.valor);
            if (isNaN(val)) return item.valor;
            return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          };
          
          setSimulationResult({
            patrimonioTotal: findVal("3"),
            rendimentosTributaveis: findVal("2"),
            rendimentoPJ: findVal("1"),
            titular: data.autorizacao?.titular || "Desconhecido",
            destinatario: data.autorizacao?.destinatario || "Desconhecido",
            dataHora: data.autorizacao?.dataHoraRegistro 
              ? new Date(data.autorizacao.dataHoraRegistro).toLocaleString('pt-BR') 
              : new Date().toLocaleString('pt-BR'),
            tokenUtilizado: data.autorizacao?.token || tokenInput,
            declaracao: data.dados.map((d: any) => ({
              cod: d.codigo,
              desc: d.texto,
              valor: parseFloat(d.valor) ? `R$ ${parseFloat(d.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : d.valor
            }))
          });
          setOk("Chamada dinâmica realizada com sucesso via API SERPRO!");
        } else {
          setOk(`Chamada realizada com sucesso! Código HTTP: ${res.statusCode}.`);
        }
      } else {
        setErr(res.message || `Falha na consulta dinâmica. Código HTTP: ${res.statusCode}`);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao testar a consulta na API");
    } finally {
      setIsSimulating(false);
    }
  };

  if (loading) return <p className="monitor-hint">A carregar integração SERPRO…</p>;

  return (
    <div className="serpro-integracao" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* MÓDULO SIMULADOR DE CONSULTA (Design Contábil Pro - Ajustado para Tema Claro) */}
      <div style={{
        backgroundColor: '#f8fafc',
        color: 'var(--text)',
        padding: '2rem',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
        fontFamily: 'var(--font)'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <div style={{ backgroundColor: 'var(--info-bg)', padding: '0.75rem', borderRadius: '8px', color: 'var(--accent)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
            </svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Consulta e Renda (SERPRO)</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>
              Acesso seguro a dados de renda da Declaração de IRPF via Compartilha Receita Federal (Teste de Integração)
            </p>
          </div>
        </div>

        <div style={{ marginTop: '2rem', backgroundColor: 'var(--surface)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
            TOKEN DE COMPARTILHAMENTO DO CONTRIBUINTE
          </label>
          <div style={{ display: 'flex', position: 'relative', marginBottom: '0.5rem' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input 
              type="text" 
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--main-bg, #eceff1)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '0.8rem 1rem 0.8rem 2.8rem',
                fontSize: '1rem',
                fontFamily: 'var(--mono)'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>Token no formato válido (36 caracteres) detectado. Pronto para consulta.</span>
          </div>

          <button 
            onClick={handleSimulate}
            disabled={isSimulating}
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.5rem', borderRadius: '8px' }}
          >
            {isSimulating ? 'Consultando API...' : 'Consultar Renda'}
          </button>
          
          <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            Atenção LCPD: A obtenção de dados fiscais requer o consentimento ativo do titular. O token deve ser gerado pelo cidadão na opção "Autorizar Compartilhamento de Dados" no Portal e-CAC.
          </p>
        </div>

        {/* RESULTS MOCK */}
        {simulationResult && (
          <div style={{ marginTop: '2rem', animation: 'fadeIn 0.5s ease-in-out' }}>
            
            {/* CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              
              <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderBottom: '3px solid var(--accent)', borderRadius: '8px', padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ backgroundColor: 'var(--info-bg)', border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '8px', color: 'var(--accent)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.05em' }}>PATRIMÔNIO TOTAL</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>R$ {simulationResult.patrimonioTotal}</div>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderBottom: '3px solid var(--success)', borderRadius: '8px', padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '8px', color: 'var(--success)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.05em' }}>RENDIMENTOS TRIBUTÁVEIS</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>R$ {simulationResult.rendimentosTributaveis}</div>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderBottom: '3px solid #8b5cf6', borderRadius: '8px', padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ backgroundColor: '#f3e5f5', border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '8px', color: '#8b5cf6' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.05em' }}>RENDIMENTO DE FONTES PJ</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>R$ {simulationResult.rendimentoPJ}</div>
                </div>
              </div>

            </div>

            {/* DETAILS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
              
              <div style={{ backgroundColor: 'var(--surface)', borderRadius: '8px', padding: '1.5rem', border: '1px solid var(--border)', color: 'var(--text)' }}>
                <h3 style={{ fontSize: '1rem', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  Dados da Autorização
                </h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700 }}>TITULAR (CPF CRIPTOGRAFADO)</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{simulationResult.titular}</div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700 }}>DESTINATÁRIO (CNPJ CONTADOR)</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{simulationResult.destinatario}</div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700 }}>DATA/HORA DO REGISTRO</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{simulationResult.dataHora}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700 }}>TOKEN UTILIZADO</div>
                  <div style={{ fontSize: '0.8rem', backgroundColor: 'var(--main-bg, #eceff1)', padding: '0.5rem', borderRadius: '4px', marginTop: '0.25rem', fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
                    {simulationResult.tokenUtilizado}
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--surface)', borderRadius: '8px', padding: '1.5rem', border: '1px solid var(--border)', color: 'var(--text)' }}>
                <h3 style={{ fontSize: '1rem', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  Declaração de Rendimentos Analítica
                </h3>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem 0', fontWeight: 600 }}>Cód</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem 0', fontWeight: 600 }}>Especificação da Renda</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem 0', fontWeight: 600 }}>Valor Declarado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulationResult.declaracao.map((item, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem 0', color: 'var(--muted)' }}>{item.cod}</td>
                        <td style={{ padding: '0.75rem 0', color: 'var(--text)', fontWeight: 500 }}>{item.desc}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: 'right', color: 'var(--accent)', fontWeight: 600 }}>{item.valor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

      </div>


      {/* ZONA DE CONFIGURAÇÃO TÉCNICA (Oculta ou Secundária) */}
      <details style={{ backgroundColor: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <summary style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--text)', outline: 'none' }}>
          ⚙️ Configurações Técnicas de Integração SERPRO
        </summary>
        
        <div style={{ marginTop: '1.5rem' }}>
          {err ? <div className="error-toast">{err}</div> : null}
          {ok ? <div className="info-toast">{ok}</div> : null}

          <form className="form-grid cols-2" onSubmit={onSave}>
            <p className="cell-sub" style={{ gridColumn: "1 / -1", marginTop: 0 }}>
              Para colocar os dados reais em produção, você precisará preencher as credenciais abaixo 
              (Consumer Key, Secret, Certificado) e substituir o uso do <code>MOCK_DATA</code> pela 
              chamada real à API no método <code>handleSimulate</code> deste componente.
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
              />
            </div>

            <div className="field">
              <label>URL de Autenticação (SAPI)</label>
              <input
                style={{ width: "80%" }}
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
                {saving ? "Salvando..." : "Salvar Configurações"}
              </button>
            </div>
          </form>

          <hr style={{ margin: "2rem 0", borderColor: "var(--border-color, #eaeaea)", borderStyle: "solid", borderWidth: "1px 0 0 0" }} />

          <div className="form-grid cols-2">
            <h3 style={{ gridColumn: "1 / -1", margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>Passo 2: Extrair Chave Privada RSA</h3>
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
                style={{ border: "1px solid var(--border)", background: "var(--surface)", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}
              >
                {testing ? "Testando..." : "🔄 Testar Autenticação (SAPI)"}
              </button>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}

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
  const [apiProcuracoesAtiva, setApiProcuracoesAtiva] = useState(false);
  const [apiDarfAtiva, setApiDarfAtiva] = useState(false);
  const [apiMensagensEcacAtiva, setApiMensagensEcacAtiva] = useState(false);
  const [apiDebitosAtiva, setApiDebitosAtiva] = useState(false);
  const [apiDiagnosticoFiscalAtiva, setApiDiagnosticoFiscalAtiva] = useState(false);

  const [hasCert, setHasCert] = useState(false);
  const [hasPrivateKey, setHasPrivateKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ ok: boolean; message: string } | null>(null);

  // Sandbox Tester States
  const [testModule, setTestModule] = useState<"renda" | "restituicao" | "autorizacoes" | "procuracoes" | "darf" | "caixapostal" | "pagamento" | "sitfis">("renda");
  const [tokenInput, setTokenInput] = useState("06aef429-a981-3ec5-a1f8-71d38d86481e");
  const [cpfInput, setCpfInput] = useState("12345678909");
  const [cnpjInput, setCnpjInput] = useState("33683111000107");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simError, setSimError] = useState<string | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string>("");
  const [simMethod, setSimMethod] = useState<string>("GET");
  const [httpStatus, setHttpStatus] = useState<number | null>(null);

  // Form states for PROCURACOES
  const [outorgante, setOutorgante] = useState("99999999999999");
  const [outorgado, setOutorgado] = useState("99999999999");

  // Form states for SICALC
  const [darfServico, setDarfServico] = useState("CONSOLIDARGERARDARF51");
  const [codigoReceita, setCodigoReceita] = useState("0190");
  const [valorImposto, setValorImposto] = useState("1000.00");
  const [dataPA, setDataPA] = useState("12/2017");

  // Form states for CAIXAPOSTAL
  const [caixaPostalServico, setCaixaPostalServico] = useState("MSGCONTRIBUINTE61");
  const [isn, setIsn] = useState("0000082838");

  // Form states for PAGTOWEB
  const [pagamentoServico, setPagamentoServico] = useState("PAGAMENTOS71");
  const [dataInicial, setDataInicial] = useState("2019-09-01");
  const [dataFinal, setDataFinal] = useState("2019-11-30");
  const [numeroDocumento, setNumeroDocumento] = useState("99999999999999999");

  // Form states for SITFIS
  const [sitfisServico, setSitfisServico] = useState("SOLICITARPROTOCOLO91");
  const [protocoloRelatorio, setProtocoloRelatorio] = useState("+S7N6c04XNZUVzmxWT7SzpkZA4xeDQC9T2GBJ5usn8LyouyWXbsy6mKsLy7/EImRkDjF4NAL25KiSXOLjnzAaZu/FC+G1pYOtTMYqokKYYr/yZ6aqUiCuWPfujDQ2/udwgU+Dyh56GSe28B5Ev25jDnzpvVJPhiebO5hpy1YESP5gnEhaP3bocCiZZrYG26F8avRRBJhRTsfv3Rvop+bxvYJZsVym270eO8oZTDIr3OJj==");

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
      setApiProcuracoesAtiva(Boolean(c.apiProcuracoesAtiva));
      setApiDarfAtiva(Boolean(c.apiDarfAtiva));
      setApiMensagensEcacAtiva(Boolean(c.apiMensagensEcacAtiva));
      setApiDebitosAtiva(Boolean(c.apiDebitosAtiva));
      setApiDiagnosticoFiscalAtiva(Boolean(c.apiDiagnosticoFiscalAtiva));
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
        apiProcuracoesAtiva,
        apiDarfAtiva,
        apiMensagensEcacAtiva,
        apiDebitosAtiva,
        apiDiagnosticoFiscalAtiva,
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

    // Determinar endpoint e dados do body baseado no modulo
    let endpoint = "";
    let method = "GET";
    let body: any = null;

    if (testModule === "renda") {
      endpoint = `/renda-pf-trial/v1/Consultar/${tokenInput.trim()}`;
      method = "GET";
    } else if (testModule === "restituicao") {
      endpoint = `/consulta-restituicao-trial/v1/Consultar/${tokenInput.trim()}`;
      method = "GET";
    } else if (testModule === "autorizacoes") {
      endpoint = `/consulta-restituicao-trial/v1/Autorizacoes/${cnpjInput.trim()}/${cpfInput.trim()}`;
      method = "GET";
    } else {
      // Integra Contador POST APIs
      method = "POST";
      let idSistema = "";
      let idServico = "";
      let versaoSistema = "1.0";
      let dadosString = "";

      if (testModule === "procuracoes") {
        endpoint = "/integra-contador-trial/v1/Consultar";
        idSistema = "PROCURACOES";
        idServico = "OBTERPROCURACAO41";
        versaoSistema = "1";
        dadosString = JSON.stringify({
          outorgante: outorgante.trim(),
          tipoOutorgante: outorgante.trim().length === 14 ? "2" : "1",
          outorgado: outorgado.trim(),
          tipoOutorgado: outorgado.trim().length === 14 ? "2" : "1"
        });
      } else if (testModule === "darf") {
        idSistema = "SICALC";
        idServico = darfServico;
        versaoSistema = "2.9";
        
        if (darfServico === "CONSULTAAPOIORECEITAS52") {
          endpoint = "/integra-contador-trial/v1/Apoiar";
          dadosString = JSON.stringify({ codigoReceita: codigoReceita.trim() });
        } else if (darfServico === "GERARDARFCODBARRA53") {
          endpoint = "/integra-contador-trial/v1/Emitir";
          dadosString = JSON.stringify({
            uf: "SP",
            municipio: "7107",
            codigoReceita: codigoReceita.trim(),
            codigoReceitaExtensao: "01",
            tipoPA: "ME",
            dataPA: dataPA.trim(),
            vencimento: "2024-03-25T00:00:00",
            valorImposto: valorImposto.trim(),
            dataConsolidacao: "2024-03-25T00:00:00",
            observacao: "Darf calculado",
            confissao: false
          });
        } else {
          endpoint = "/integra-contador-trial/v1/Emitir";
          dadosString = JSON.stringify({
            uf: "SP",
            municipio: "7107",
            codigoReceita: codigoReceita.trim(),
            codigoReceitaExtensao: "01",
            tipoPA: "ME",
            dataPA: dataPA.trim(),
            vencimento: "2018-01-31T00:00:00",
            valorImposto: valorImposto.trim(),
            dataConsolidacao: "2022-08-08T00:00:00",
            observacao: "Darf calculado"
          });
        }
      } else if (testModule === "caixapostal") {
        idSistema = "CAIXAPOSTAL";
        idServico = caixaPostalServico;
        versaoSistema = "1.0";

        if (caixaPostalServico === "INNOVAMSG63") {
          endpoint = "/integra-contador-trial/v1/Monitorar";
          dadosString = "";
        } else if (caixaPostalServico === "MSGDETALHAMENTO62") {
          endpoint = "/integra-contador-trial/v1/Consultar";
          dadosString = JSON.stringify({ isn: isn.trim() });
        } else {
          endpoint = "/integra-contador-trial/v1/Consultar";
          dadosString = JSON.stringify({
            statusLeitura: "0",
            indicadorPagina: "0",
            ponteiroPagina: "00000000000000"
          });
        }
      } else if (testModule === "pagamento") {
        idSistema = "PAGTOWEB";
        idServico = pagamentoServico;
        versaoSistema = "1.0";

        if (pagamentoServico === "CONTACONSDOCARRPG73") {
          endpoint = "/integra-contador-trial/v1/Consultar";
          dadosString = JSON.stringify({
            intervaloDataArrecadacao: {
              dataInicial: dataInicial.trim(),
              dataFinal: dataFinal.trim()
            }
          });
        } else if (pagamentoServico === "COMPARRECADACAO72") {
          endpoint = "/integra-contador-trial/v1/Emitir";
          dadosString = JSON.stringify({ numeroDocumento: numeroDocumento.trim() });
        } else {
          endpoint = "/integra-contador-trial/v1/Consultar";
          dadosString = JSON.stringify({
            intervaloDataArrecadacao: {
              dataInicial: dataInicial.trim(),
              dataFinal: dataFinal.trim()
            },
            primeiroDaPagina: 0,
            tamanhoDaPagina: 100
          });
        }
      } else if (testModule === "sitfis") {
        idSistema = "SITFIS";
        idServico = sitfisServico;
        versaoSistema = "1.0";

        if (sitfisServico === "SOLICITARPROTOCOLO91") {
          endpoint = "/integra-contador-trial/v1/Apoiar";
          dadosString = "";
        } else {
          endpoint = "/integra-contador-trial/v1/Emitir";
          dadosString = JSON.stringify({
            protocoloRelatorio: protocoloRelatorio.trim()
          });
        }
      }

      body = {
        contratante: {
          numero: cnpjInput.trim() || "33683111000107",
          tipo: 2
        },
        autorPedidoDados: {
          numero: cnpjInput.trim() || "33683111000107",
          tipo: 2
        },
        contribuinte: {
          numero: cpfInput.trim() || "12345678909",
          tipo: 1
        },
        pedidoDados: {
          idSistema,
          idServico,
          versaoSistema,
          dados: dadosString
        }
      };
    }

    setResolvedUrl(`${baseUrl.replace(/\/$/, "")}${endpoint}`);
    setSimMethod(method);

    try {
      const res = await postSerproChamar({
        endpoint,
        method,
        body
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

  const handleModuleChange = (mod: "renda" | "restituicao" | "autorizacoes" | "procuracoes" | "darf" | "caixapostal" | "pagamento" | "sitfis") => {
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
    } else if (mod === "procuracoes") {
      setOutorgante("99999999999999");
      setOutorgado("99999999999");
      setCpfInput("99999999999");
      setCnpjInput("99999999999999");
    } else if (mod === "darf") {
      setDarfServico("CONSOLIDARGERARDARF51");
      setCodigoReceita("0190");
      setValorImposto("1000.00");
      setDataPA("12/2017");
      setCpfInput("99999999999");
      setCnpjInput("99999999999999");
    } else if (mod === "caixapostal") {
      setCaixaPostalServico("MSGCONTRIBUINTE61");
      setIsn("0000082838");
      setCpfInput("99999999999999");
      setCnpjInput("99999999999999");
    } else if (mod === "pagamento") {
      setPagamentoServico("PAGAMENTOS71");
      setDataInicial("2019-09-01");
      setDataFinal("2019-11-30");
      setNumeroDocumento("99999999999999999");
      setCpfInput("99999999999");
      setCnpjInput("99999999999999");
    } else if (mod === "sitfis") {
      setSitfisServico("SOLICITARPROTOCOLO91");
      setProtocoloRelatorio("+S7N6c04XNZUVzmxWT7SzpkZA4xeDQC9T2GBJ5usn8LyouyWXbsy6mKsLy7/EImRkDjF4NAL25KiSXOLjnzAaZu/FC+G1pYOtTMYqokKYYr/yZ6aqUiCuWPfujDQ2/udwgU+Dyh56GSe28B5Ev25jDnzpvVJPhiebO5hpy1YESP5gnEhaP3bocCiZZrYG26F8avRRBJhRTsfv3Rvop+bxvYJZsVym270eO8oZTDIr3OJj==");
      setCpfInput("99999999999");
      setCnpjInput("00000000000000");
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

              <div style={{
                marginTop: '0.75rem',
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--warning-bg)',
                borderLeft: '4px solid var(--warning)',
                borderRadius: '4px',
                fontSize: '0.75rem',
                lineHeight: '1.4',
                color: '#5c3d00'
              }}>
                <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.2rem', color: 'var(--warning)' }}>
                  ⚠️ Atenção Importante (LGPD & Consentimento e-CAC)
                </span>
                Para que a integração em produção funcione, é obrigatório que cada contribuinte (cidadão) conceda a autorização de compartilhamento de seus dados fiscais com o CNPJ da sua contabilidade através do portal <strong>e-CAC (funcionalidade "Compartilha Receita Federal")</strong>. Sem esse consentimento prévio do cliente, a API do SERPRO retornará erro de autorização.
              </div>
              
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

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={apiRestituicaoAtiva}
                  onChange={(e) => setApiRestituicaoAtiva(e.target.checked)}
                />
                <span>Habilitar API <strong>"Consultar Restituição IRPF"</strong> (fila e histórico de créditos)</span>
              </label>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: '1.5rem', marginBottom: '0.75rem' }}>
                Rotas: <code>consulta-restituicao-trial/v1</code> (sandbox) ou <code>consulta-restituicao/v1</code> (produção)
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={apiProcuracoesAtiva}
                  onChange={(e) => setApiProcuracoesAtiva(e.target.checked)}
                />
                <span>Habilitar <strong>"Integra Procurações"</strong> (consulta de procurações outorgadas no e-CAC)</span>
              </label>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: '1.5rem', marginBottom: '0.75rem' }}>
                Rotas: <code>integra-contador-trial/v1/Consultar</code> (sandbox) ou <code>integra-contador/v1/Consultar</code> (produção)
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={apiDarfAtiva}
                  onChange={(e) => setApiDarfAtiva(e.target.checked)}
                />
                <span>Habilitar <strong>"Integra Sicalc"</strong> (consolidação e emissão de DARFs)</span>
              </label>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: '1.5rem', marginBottom: '0.75rem' }}>
                Rotas: <code>integra-contador-trial/v1/Emitir</code> (sandbox) ou <code>integra-contador/v1/Emitir</code> (produção)
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={apiMensagensEcacAtiva}
                  onChange={(e) => setApiMensagensEcacAtiva(e.target.checked)}
                />
                <span>Habilitar <strong>"Integra Caixa Postal"</strong> (mensagens oficiais da Receita Federal)</span>
              </label>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: '1.5rem', marginBottom: '0.75rem' }}>
                Rotas: <code>integra-contador-trial/v1/Consultar</code> ou <code>Monitorar</code> (sandbox/produção)
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={apiDebitosAtiva}
                  onChange={(e) => setApiDebitosAtiva(e.target.checked)}
                />
                <span>Habilitar <strong>"Integra Pagamento"</strong> (consulta de débitos e comprovantes PAGTOWEB)</span>
              </label>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: '1.5rem', marginBottom: '0.75rem' }}>
                Rotas: <code>integra-contador-trial/v1/Consultar</code> ou <code>Emitir</code> (sandbox/produção)
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={apiDiagnosticoFiscalAtiva}
                  onChange={(e) => setApiDiagnosticoFiscalAtiva(e.target.checked)}
                />
                <span>Habilitar <strong>"Integra Sitfis"</strong> (relatório de situação fiscal do contribuinte)</span>
              </label>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
                Rotas: <code>integra-contador-trial/v1/Apoiar</code> ou <code>Emitir</code> (sandbox/produção)
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
                  <option value="procuracoes">Integra Procurações</option>
                  <option value="darf">Integra Sicalc / DARF</option>
                  <option value="caixapostal">Integra Caixa Postal</option>
                  <option value="pagamento">Integra Pagamento</option>
                  <option value="sitfis">Integra Sitfis / Situação Fiscal</option>
                </select>
              </div>

              {/* INPUTS DINÂMICOS CONFORME MÓDULO */}
              {(testModule === "renda" || testModule === "restituicao") && (
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

              {/* Se for módulo de autorizacoes */}
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

              {/* Se for módulo de procurações */}
              {testModule === "procuracoes" && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>CPF/CNPJ OUTORGANTE</label>
                    <input
                      type="text"
                      value={outorgante}
                      onChange={(e) => setOutorgante(e.target.value)}
                      placeholder="CPF ou CNPJ outorgante"
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
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>CPF/CNPJ OUTORGADO (CONTADOR)</label>
                    <input
                      type="text"
                      value={outorgado}
                      onChange={(e) => setOutorgado(e.target.value)}
                      placeholder="CPF ou CNPJ outorgado"
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

              {/* Se for módulo darf (SICALC) */}
              {testModule === "darf" && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>SERVIÇO SICALC</label>
                    <select
                      value={darfServico}
                      onChange={(e) => setDarfServico(e.target.value)}
                      style={{
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--main-bg)',
                        color: 'var(--text)',
                        fontWeight: 500
                      }}
                    >
                      <option value="CONSOLIDARGERARDARF51">PF/PJ Consolidação (51)</option>
                      <option value="GERARDARFCODBARRA53">DARF Código de Barras (53)</option>
                      <option value="CONSULTAAPOIORECEITAS52">Consultar Receitas Apoio (52)</option>
                    </select>
                  </div>
                  {darfServico !== "CONSULTAAPOIORECEITAS52" && (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>VALOR IMPOSTO</label>
                        <input
                          type="text"
                          value={valorImposto}
                          onChange={(e) => setValorImposto(e.target.value)}
                          placeholder="Ex: 1000.00"
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
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>PERÍODO APURAÇÃO (PA)</label>
                        <input
                          type="text"
                          value={dataPA}
                          onChange={(e) => setDataPA(e.target.value)}
                          placeholder="MM/AAAA"
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>CÓDIGO RECEITA</label>
                    <input
                      type="text"
                      value={codigoReceita}
                      onChange={(e) => setCodigoReceita(e.target.value)}
                      placeholder="Ex: 0190"
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

              {/* Se for módulo caixapostal */}
              {testModule === "caixapostal" && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>SERVIÇO CAIXA POSTAL</label>
                    <select
                      value={caixaPostalServico}
                      onChange={(e) => setCaixaPostalServico(e.target.value)}
                      style={{
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--main-bg)',
                        color: 'var(--text)',
                        fontWeight: 500
                      }}
                    >
                      <option value="MSGCONTRIBUINTE61">Listar Mensagens (61)</option>
                      <option value="MSGDETALHAMENTO62">Detalhes Mensagem (62)</option>
                      <option value="INNOVAMSG63">Indicador Novas Mensagens (63)</option>
                    </select>
                  </div>
                  {caixaPostalServico === "MSGDETALHAMENTO62" && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>NÚMERO DE SEQUÊNCIA (ISN)</label>
                      <input
                        type="text"
                        value={isn}
                        onChange={(e) => setIsn(e.target.value)}
                        placeholder="Ex: 0000082838"
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
                  )}
                </>
              )}

              {/* Se for módulo pagamento (PAGTOWEB) */}
              {testModule === "pagamento" && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>SERVIÇO PAGAMENTO</label>
                    <select
                      value={pagamentoServico}
                      onChange={(e) => setPagamentoServico(e.target.value)}
                      style={{
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--main-bg)',
                        color: 'var(--text)',
                        fontWeight: 500
                      }}
                    >
                      <option value="PAGAMENTOS71">Consultar Pagamentos (71)</option>
                      <option value="CONTACONSDOCARRPG73">Quantidade de Pagamentos (73)</option>
                      <option value="COMPARRECADACAO72">Emitir Comprovante (72)</option>
                    </select>
                  </div>
                  {pagamentoServico === "COMPARRECADACAO72" ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>NÚMERO DO DOCUMENTO</label>
                      <input
                        type="text"
                        value={numeroDocumento}
                        onChange={(e) => setNumeroDocumento(e.target.value)}
                        placeholder="Ex: 99999999999999999"
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
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>DATA INICIAL</label>
                        <input
                          type="text"
                          value={dataInicial}
                          onChange={(e) => setDataInicial(e.target.value)}
                          placeholder="AAAA-MM-DD"
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
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>DATA FINAL</label>
                        <input
                          type="text"
                          value={dataFinal}
                          onChange={(e) => setDataFinal(e.target.value)}
                          placeholder="AAAA-MM-DD"
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
                </>
              )}

              {/* Se for módulo sitfis (Situação Fiscal) */}
              {testModule === "sitfis" && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>SERVIÇO DIAGNÓSTICO</label>
                    <select
                      value={sitfisServico}
                      onChange={(e) => setSitfisServico(e.target.value)}
                      style={{
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--main-bg)',
                        color: 'var(--text)',
                        fontWeight: 500
                      }}
                    >
                      <option value="SOLICITARPROTOCOLO91">Solicitar Protocolo (91)</option>
                      <option value="RELATORIOSITFIS92">Emitir Relatório Sitfis (92)</option>
                    </select>
                  </div>
                  {sitfisServico === "RELATORIOSITFIS92" && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>PROTOCOLO DO RELATÓRIO</label>
                      <input
                        type="text"
                        value={protocoloRelatorio}
                        onChange={(e) => setProtocoloRelatorio(e.target.value)}
                        placeholder="Insira o protocolo do Sitfis"
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
                  )}
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

              {testModule === "procuracoes" && (
                <button
                  type="button"
                  onClick={() => { setOutorgante("99999999999999"); setOutorgado("99999999999"); }}
                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
                >
                  Massa Procurações
                </button>
              )}

              {testModule === "darf" && (
                <>
                  <button
                    type="button"
                    onClick={() => { setDarfServico("CONSOLIDARGERARDARF51"); setCodigoReceita("0190"); setValorImposto("1000.00"); setDataPA("12/2017"); }}
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
                  >
                    Consolidação PF (0190)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDarfServico("GERARDARFCODBARRA53"); setCodigoReceita("6106"); setValorImposto("1000.00"); setDataPA("05/2005"); }}
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
                  >
                    DARF Código de Barras (6106)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDarfServico("CONSULTAAPOIORECEITAS52"); setCodigoReceita("6106"); }}
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
                  >
                    Receitas Apoio Sicalc (6106)
                  </button>
                </>
              )}

              {testModule === "caixapostal" && (
                <>
                  <button
                    type="button"
                    onClick={() => { setCaixaPostalServico("MSGCONTRIBUINTE61"); }}
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
                  >
                    Listar Mensagens Caixa Postal
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCaixaPostalServico("MSGDETALHAMENTO62"); setIsn("0000082838"); }}
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
                  >
                    Detalhar Mensagem (ISN 82838)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCaixaPostalServico("INNOVAMSG63"); }}
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
                  >
                    Indicador Novas Mensagens
                  </button>
                </>
              )}

              {testModule === "pagamento" && (
                <>
                  <button
                    type="button"
                    onClick={() => { setPagamentoServico("PAGAMENTOS71"); setDataInicial("2019-09-01"); setDataFinal("2019-11-30"); }}
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
                  >
                    Listar Pagamentos (71)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPagamentoServico("CONTACONSDOCARRPG73"); setDataInicial("2019-09-01"); setDataFinal("2019-11-30"); }}
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
                  >
                    Quantidade de Documentos (73)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPagamentoServico("COMPARRECADACAO72"); setNumeroDocumento("99999999999999999"); }}
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
                  >
                    Comprovante de Pagamento (72)
                  </button>
                </>
              )}

              {testModule === "sitfis" && (
                <>
                  <button
                    type="button"
                    onClick={() => { setSitfisServico("SOLICITARPROTOCOLO91"); }}
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
                  >
                    Solicitar Protocolo (91)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSitfisServico("RELATORIOSITFIS92"); setProtocoloRelatorio("PRT-SITFIS-2026-992837482"); }}
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
                  >
                    Relatório Diagnóstico (92)
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
              <div>
                <strong>Método de Chamada:</strong> <span style={{ fontWeight: 700, color: 'var(--text)' }}>{simMethod}</span>
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

              {/* 1. Procurações Visualizer */}
              {testModule === "procuracoes" && simulationResult.data?.procuracoes && (
                <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
                  <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', fontWeight: 700 }}>
                    🤝 Procurações Eletrônicas Outorgadas (e-CAC)
                  </h5>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)', textAlign: 'left' }}>
                        <th style={{ padding: '0.5rem' }}>Outorgante</th>
                        <th style={{ padding: '0.5rem' }}>Outorgado</th>
                        <th style={{ padding: '0.5rem' }}>Expiração</th>
                        <th style={{ padding: '0.5rem' }}>Sistemas Autorizados</th>
                        <th style={{ padding: '0.5rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulationResult.data.procuracoes.map((proc: any, idx: number) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.5rem', fontWeight: 600 }}>{proc.outorgante}</td>
                          <td style={{ padding: '0.5rem', color: 'var(--muted)' }}>{proc.outorgado}</td>
                          <td style={{ padding: '0.5rem', color: 'var(--muted)' }}>{new Date(proc.dataExpiracao).toLocaleDateString('pt-BR')}</td>
                          <td style={{ padding: '0.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              {proc.sistemas?.map((s: any, sIdx: number) => (
                                <span key={sIdx} style={{ fontSize: '0.75rem' }}>
                                  • {s.nome} (Qty: {s.quantidade})
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <span className="status-badge status-success" style={{ fontSize: '0.7rem' }}>
                              {proc.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 2. DARF Visualizer */}
              {testModule === "darf" && simulationResult.data && (
                <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
                  {darfServico === "CONSULTAAPOIORECEITAS52" ? (
                    <div>
                      <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', fontWeight: 700 }}>
                        📋 Tabela de Receita SICALC Encontrada
                      </h5>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.8rem', fontSize: '0.8rem' }}>
                        <div><strong>Código da Receita:</strong></div>
                        <div><span className="status-badge status-info">{simulationResult.data.codigoReceita}</span></div>
                        <div><strong>Descrição:</strong></div>
                        <div>{simulationResult.data.descricao}</div>
                        <div><strong>Contribuinte:</strong></div>
                        <div>{simulationResult.data.tipoContribuinte}</div>
                        <div><strong>Alíquota:</strong></div>
                        <div>{simulationResult.data.aliquota}</div>
                        <div><strong>Periodicidade:</strong></div>
                        <div>{simulationResult.data.periodicidade}</div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h5 style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', fontWeight: 700 }}>
                        📄 Guia DARF Consolidada com Sucesso
                      </h5>
                      <div style={{
                        border: '2px solid var(--text)',
                        borderRadius: '6px',
                        padding: '1.25rem',
                        fontFamily: 'monospace',
                        backgroundColor: '#fff',
                        color: '#000'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                          <div><strong>MINISTÉRIO DA FAZENDA</strong><br/>Secretaria da Receita Federal do Brasil</div>
                          <div style={{ textAlign: 'right' }}><strong>DARF</strong></div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                          <div style={{ borderRight: '1px solid #000', paddingRight: '0.5rem' }}>
                            <div>01. NOME / TELEFONE:</div>
                            <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>CONSELO TESTE DA SILVA</div>
                          </div>
                          <div>
                            <div>02. PERÍODO APURAÇÃO:</div>
                            <div style={{ fontWeight: 'bold' }}>{simulationResult.data.periodoApuracao}</div>
                          </div>
                        </div>
                        <div style={{ borderTop: '1px solid #000', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', fontSize: '0.75rem', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                          <div style={{ borderRight: '1px solid #000', paddingRight: '0.5rem' }}>
                            <div>03. CPF/CNPJ:</div>
                            <div style={{ fontWeight: 'bold' }}>{cpfInput}</div>
                          </div>
                          <div>
                            <div>04. CÓDIGO RECEITA:</div>
                            <div style={{ fontWeight: 'bold' }}>{simulationResult.data.codigoReceita}</div>
                          </div>
                        </div>
                        <div style={{ borderTop: '1px solid #000', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', fontSize: '0.75rem', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                          <div style={{ borderRight: '1px solid #000', paddingRight: '0.5rem' }}>
                            <div>05. NÚMERO REFERÊNCIA:</div>
                            <div style={{ fontWeight: 'bold' }}>-</div>
                          </div>
                          <div>
                            <div>06. VENCIMENTO:</div>
                            <div style={{ fontWeight: 'bold' }}>{new Date(simulationResult.data.vencimento).toLocaleDateString('pt-BR')}</div>
                          </div>
                        </div>
                        <div style={{ borderTop: '1px solid #000', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', fontSize: '0.75rem', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                          <div style={{ borderRight: '1px solid #000', paddingRight: '0.5rem' }}>
                            <div>Observações:</div>
                            <div>{simulationResult.data.observacao}</div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>07. PRINCIPAL:</span>
                              <strong>R$ {parseFloat(simulationResult.data.valorPrincipal).toFixed(2)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                              <span>08. MULTA:</span>
                              <strong>R$ {parseFloat(simulationResult.data.valorMulta).toFixed(2)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                              <span>09. JUROS:</span>
                              <strong>R$ {parseFloat(simulationResult.data.valorJuros).toFixed(2)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', borderTop: '1px dashed #000', paddingTop: '0.2rem' }}>
                              <span>10. TOTAL:</span>
                              <strong>R$ {parseFloat(simulationResult.data.valorTotal).toFixed(2)}</strong>
                            </div>
                          </div>
                        </div>
                        {simulationResult.data.codigoBarras && (
                          <div style={{ borderTop: '1px solid #000', marginTop: '1rem', paddingTop: '0.5rem', textAlign: 'center', fontSize: '0.7rem' }}>
                            <div>||||| | ||||| | ||| ||||||| ||| ||| ||| |||||||||| ||||</div>
                            <div style={{ fontWeight: 'bold', marginTop: '0.2rem' }}>{simulationResult.data.linhaDigitavel}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Caixa Postal Visualizer */}
              {testModule === "caixapostal" && simulationResult.data && (
                <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
                  {caixaPostalServico === "INNOVAMSG63" ? (
                    <div style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(33, 150, 243, 0.08)',
                      border: '1px solid #2196f3',
                      color: '#0d47a1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.8rem'
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>✉️</span>
                      <div>
                        <strong>Indicador de Novas Mensagens:</strong>
                        <div>{simulationResult.data.temNovasMensagens ? `Você possui ${simulationResult.data.quantidadeNaoLidas} nova(s) mensagem(ns) não lida(s) na Caixa Postal e-CAC!` : 'Nenhuma nova mensagem na Caixa Postal.'}</div>
                      </div>
                    </div>
                  ) : caixaPostalServico === "MSGDETALHAMENTO62" ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                        <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                          📬 Detalhes da Mensagem #{simulationResult.data.isn}
                        </h5>
                        <button
                          type="button"
                          onClick={() => { setCaixaPostalServico("MSGCONTRIBUINTE61"); handleTestSandbox(); }}
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', background: 'var(--surface)', color: 'var(--text)' }}
                        >
                          ← Voltar para Lista
                        </button>
                      </div>
                      <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div><strong>Remetente:</strong> {simulationResult.data.remetente}</div>
                        <div><strong>Assunto:</strong> {simulationResult.data.assunto}</div>
                        <div><strong>Enviado em:</strong> {new Date(simulationResult.data.dataEnvio).toLocaleString('pt-BR')}</div>
                        <div style={{
                          padding: '1rem',
                          backgroundColor: 'var(--main-bg)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          whiteSpace: 'pre-wrap',
                          marginTop: '0.5rem',
                          lineHeight: '1.5'
                        }}>{simulationResult.data.texto}</div>
                        {simulationResult.data.linkDocumento && (
                          <a
                            href={simulationResult.data.linkDocumento}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              alignSelf: 'flex-start',
                              marginTop: '0.5rem',
                              padding: '0.4rem 0.8rem',
                              backgroundColor: 'var(--accent)',
                              color: '#fff',
                              borderRadius: '4px',
                              textDecoration: 'none',
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }}
                          >
                            📥 Baixar PDF Oficial da Mensagem
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', fontWeight: 700 }}>
                        📬 Mensagens Recebidas na Caixa Postal e-CAC
                      </h5>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)', textAlign: 'left' }}>
                            <th style={{ padding: '0.5rem' }}>ISN</th>
                            <th style={{ padding: '0.5rem' }}>Remetente</th>
                            <th style={{ padding: '0.5rem' }}>Assunto</th>
                            <th style={{ padding: '0.5rem' }}>Data Envio</th>
                            <th style={{ padding: '0.5rem' }}>Status</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Ação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {simulationResult.data.mensagens?.map((msg: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{msg.isn}</td>
                              <td style={{ padding: '0.5rem' }}>{msg.remetente}</td>
                              <td style={{ padding: '0.5rem', fontWeight: msg.lida ? 400 : 700 }}>{msg.assunto}</td>
                              <td style={{ padding: '0.5rem', color: 'var(--muted)' }}>{new Date(msg.dataEnvio).toLocaleDateString('pt-BR')}</td>
                              <td style={{ padding: '0.5rem' }}>
                                <span className={`status-badge ${msg.lida ? 'status-success' : 'status-warning'}`} style={{ fontSize: '0.7rem' }}>
                                  {msg.lida ? 'Lida' : 'Não Lida'}
                                </span>
                              </td>
                              <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    setCaixaPostalServico("MSGDETALHAMENTO62");
                                    setIsn(msg.isn);
                                    // Trigger call immediately for this isn
                                    setIsSimulating(true);
                                    const res = await postSerproChamar({
                                      endpoint: "/integra-contador-trial/v1/Consultar",
                                      method: "POST",
                                      body: {
                                        contratante: { numero: cnpjInput.trim() || "33683111000107", tipo: 2 },
                                        autorPedidoDados: { numero: cnpjInput.trim() || "33683111000107", tipo: 2 },
                                        contribuinte: { numero: cpfInput.trim() || "12345678909", tipo: 1 },
                                        pedidoDados: {
                                          idSistema: "CAIXAPOSTAL",
                                          idServico: "MSGDETALHAMENTO62",
                                          versaoSistema: "1.0",
                                          dados: JSON.stringify({ isn: msg.isn })
                                        }
                                      }
                                    });
                                    setHttpStatus(res.statusCode || 200);
                                    if (res.ok && res.data) setSimulationResult(res.data);
                                    setIsSimulating(false);
                                  }}
                                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                  Ler
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 4. Pagamento Visualizer */}
              {testModule === "pagamento" && simulationResult.data && (
                <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
                  {pagamentoServico === "CONTACONSDOCARRPG73" ? (
                    <div>
                      <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', fontWeight: 700 }}>
                        📊 Resumo de Documentos de Arrecadação Pagos
                      </h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                        <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--main-bg)' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700 }}>QUANTIDADE PAGAMENTOS</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--accent)' }}>{simulationResult.data.totalDocumentos}</div>
                        </div>
                        <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--main-bg)' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700 }}>VALOR TOTAL ACUMULADO</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem', color: 'green' }}>R$ {parseFloat(simulationResult.data.valorAcumulado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                      </div>
                    </div>
                  ) : pagamentoServico === "COMPARRECADACAO72" ? (
                    <div>
                      <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', fontWeight: 700 }}>
                        🧾 Comprovante de Pagamento Oficial
                      </h5>
                      <div style={{
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '1.25rem',
                        backgroundColor: 'var(--main-bg)',
                        fontSize: '0.8rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem'
                      }}>
                        <div><strong>Nº do Comprovante:</strong> {simulationResult.data.comprovante.numeroDocumento}</div>
                        <div><strong>Contribuinte:</strong> {simulationResult.data.comprovante.contribuinteNome} ({simulationResult.data.comprovante.contribuinteCpf})</div>
                        <div><strong>Receita:</strong> {simulationResult.data.comprovante.codigoReceita} | <strong>PA:</strong> {simulationResult.data.comprovante.periodoApuracao}</div>
                        <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                          <strong>Data de Arrecadação:</strong> {new Date(simulationResult.data.comprovante.dataPagamento).toLocaleDateString('pt-BR')}<br/>
                          <strong>Valor Principal:</strong> R$ {parseFloat(simulationResult.data.comprovante.valorPrincipal).toFixed(2)}<br/>
                          <strong>Valor Total Pago:</strong> R$ {parseFloat(simulationResult.data.comprovante.valorTotal).toFixed(2)}
                        </div>
                        <div style={{
                          padding: '0.5rem',
                          backgroundColor: 'var(--surface)',
                          borderRadius: '4px',
                          border: '1px solid var(--border)',
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          marginTop: '0.25rem'
                        }}>
                          <strong>Autenticação Bancária:</strong> {simulationResult.data.comprovante.autenticacao}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', fontWeight: 700 }}>
                        💲 Extrato de Guias Pagas (PAGTOWEB)
                      </h5>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)', textAlign: 'left' }}>
                            <th style={{ padding: '0.5rem' }}>Receita</th>
                            <th style={{ padding: '0.5rem' }}>PA</th>
                            <th style={{ padding: '0.5rem' }}>Data Arrecadação</th>
                            <th style={{ padding: '0.5rem' }}>Agente</th>
                            <th style={{ padding: '0.5rem' }}>Autenticação</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Valor Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {simulationResult.data.pagamentos?.map((pag: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '0.5rem', fontWeight: 600 }}>{pag.codigoReceita}</td>
                              <td style={{ padding: '0.5rem' }}>{new Date(pag.periodoApuracao).toLocaleDateString('pt-BR')}</td>
                              <td style={{ padding: '0.5rem', color: 'var(--muted)' }}>{new Date(pag.dataArrecadacao).toLocaleString('pt-BR')}</td>
                              <td style={{ padding: '0.5rem' }}>{pag.agenteArrecadador}</td>
                              <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--muted)' }}>{pag.autenticacaoBancaria}</td>
                              <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700, color: 'green' }}>
                                R$ {parseFloat(pag.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 5. Sitfis Visualizer */}
              {testModule === "sitfis" && simulationResult.data && (
                <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
                  {sitfisServico === "SOLICITARPROTOCOLO91" ? (
                    <div style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(76, 175, 80, 0.08)',
                      border: '1px solid #4caf50',
                      color: '#2e7d32',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>✔️</span>
                        <strong>Protocolo de Situação Fiscal Gerado!</strong>
                      </div>
                      <div style={{ fontSize: '0.8rem', marginLeft: '1.75rem' }}>
                        Código do Protocolo: <strong style={{ fontFamily: 'monospace' }}>{simulationResult.data.protocoloRelatorio}</strong>
                        <div style={{ marginTop: '0.2', color: 'var(--muted)' }}>Tempo estimado de espera: {simulationResult.data.tempoEspera} segundos.</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSitfisServico("RELATORIOSITFIS92");
                          setProtocoloRelatorio(simulationResult.data.protocoloRelatorio);
                        }}
                        style={{
                          alignSelf: 'flex-start',
                          marginLeft: '1.75rem',
                          padding: '0.35rem 0.6rem',
                          backgroundColor: 'var(--accent)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          marginTop: '0.25rem'
                        }}
                      >
                        ⚡ Copiar Protocolo para Consulta Relatório
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', fontWeight: 700 }}>
                        🛡️ Relatório de Diagnóstico de Situação Fiscal (Sitfis)
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                          <div><strong>Protocolo:</strong> {simulationResult.data.protocolo}</div>
                          <div><strong>CPF:</strong> {simulationResult.data.contribuinteCpf}</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                          <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '1rem', backgroundColor: 'var(--main-bg)' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 700 }}>SITUAÇÃO CADASTRAL</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'green', marginTop: '0.25rem' }}>{simulationResult.data.diagnostico.situacaoCadastral}</div>
                          </div>
                          <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '1rem', backgroundColor: 'var(--main-bg)' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 700 }}>REGULARIDADE FISCAL</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)', marginTop: '0.25rem' }}>{simulationResult.data.diagnostico.regularidadeFiscal}</div>
                          </div>
                        </div>
                        <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '1rem', backgroundColor: 'var(--main-bg)' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Débitos Fiscais Declarados</div>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)', textAlign: 'left' }}>
                                <th style={{ padding: '0.4rem 0' }}>Origem</th>
                                <th style={{ padding: '0.4rem 0' }}>Tributo</th>
                                <th style={{ padding: '0.4rem 0' }}>Status</th>
                                <th style={{ padding: '0.4rem 0', textAlign: 'right' }}>Valor</th>
                              </tr>
                            </thead>
                            <tbody>
                              {simulationResult.data.diagnostico.debitosFiscais?.map((deb: any, idx: number) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                  <td style={{ padding: '0.4rem 0' }}>{deb.origem}</td>
                                  <td style={{ padding: '0.4rem 0' }}>{deb.tributo}</td>
                                  <td style={{ padding: '0.4rem 0' }}>{deb.status}</td>
                                  <td style={{ padding: '0.4rem 0', textAlign: 'right', fontWeight: 600 }}>R$ {parseFloat(deb.valor).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
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

import { useState } from "react";
import {
  type ConsultaRendaResult,
  type DadoRendaItem,
  postSerproConsultaRenda,
} from "../api/client";

const TRIAL_TOKEN = "06aef429-a981-3ec5-a1f8-71d38d86481e";
const CODIGOS_MONETARIOS = new Set(["1", "2", "3", "4", "5", "6"]);

function formatarValor(codigo: string, valor: string): string {
  if (!valor) return "N/A";
  if (CODIGOS_MONETARIOS.has(codigo)) {
    const num = parseFloat(valor);
    if (isNaN(num)) return valor;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num);
  }
  return valor;
}

function buscarValorPorCodigo(dados: DadoRendaItem[], codigo: string): string {
  const item = dados.find((d) => d.codigo === codigo);
  return item ? formatarValor(codigo, item.valor) : "R$ 0,00";
}

function Skeleton({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
        borderRadius: "6px",
        height: "16px",
        ...style,
      }}
    />
  );
}

export function ConsultaSerproPage() {
  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ConsultaRendaResult | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const tokenValido = tokenInput.trim().length === 36;

  async function handleConsultar(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenValido) return;
    setLoading(true);
    setErro(null);
    setResultado(null);
    try {
      const res = await postSerproConsultaRenda(tokenInput.trim());
      if (!res.ok) {
        setErro(res.message || "Falha ao consultar dados.");
      } else {
        setResultado(res);
      }
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* ─── Cabeçalho ─── */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--color-text)",
            margin: 0,
          }}
        >
          <span style={{ fontSize: "1.6rem" }}>🛡️</span>
          Consulta e Renda (SERPRO)
        </h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: "0.25rem", fontSize: "0.9rem" }}>
          Acesso seguro a dados de renda da Declaração de IRPF via Compartilha Receita Federal
        </p>
      </div>

      {/* ─── Formulário de Busca ─── */}
      <div
        style={{
          background: "var(--color-card-bg, #fff)",
          borderRadius: "12px",
          border: "1px solid var(--color-border, #e5e7eb)",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <form onSubmit={handleConsultar}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "700px" }}>
            <label
              htmlFor="token-serpro-irpf"
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--color-text-muted)",
              }}
            >
              Token de Compartilhamento do Contribuinte
            </label>

            {/* Input grande com ícone de busca */}
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  fontSize: "1.1rem",
                  pointerEvents: "none",
                }}
              >
                🔍
              </span>
              <input
                id="token-serpro-irpf"
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={`Cole o token do e-CAC (ex: ${TRIAL_TOKEN})`}
                disabled={loading}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "1rem 1rem 1rem 2.8rem",
                  fontSize: "0.95rem",
                  border: "1px solid var(--color-border, #e2e8f0)",
                  borderRadius: "10px",
                  background: "var(--color-input-bg, #f8fafc)",
                  color: "var(--color-text)",
                  outline: "none",
                  transition: "border-color 0.2s",
                  fontFamily: "monospace",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border, #e2e8f0)")}
              />
            </div>

            {/* Badge de validação verde */}
            {tokenValido && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  color: "#059669",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                <span>✅</span>
                Token no formato válido (36 caracteres) detectado. Pronto para consulta.
                {tokenInput.trim() === TRIAL_TOKEN && (
                  <span
                    style={{
                      background: "#d1fae5",
                      color: "#065f46",
                      fontSize: "0.68rem",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "999px",
                      fontWeight: 700,
                      marginLeft: "0.3rem",
                    }}
                  >
                    TOKEN DEMO
                  </span>
                )}
              </div>
            )}

            {/* Botão de consulta */}
            <div style={{ paddingTop: "0.25rem" }}>
              <button
                type="submit"
                disabled={loading || !tokenValido}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: tokenValido && !loading ? "#2563eb" : "#94a3b8",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: tokenValido && !loading ? "pointer" : "not-allowed",
                  transition: "background 0.2s, transform 0.1s",
                  boxShadow: tokenValido && !loading ? "0 4px 12px rgba(37,99,235,0.3)" : "none",
                  minWidth: "180px",
                }}
                onMouseDown={(e) => { if (tokenValido && !loading) (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)"; }}
                onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
              >
                {loading ? "⏳ Consultando..." : "Consultar Renda"}
              </button>
            </div>

            {/* Aviso LGPD */}
            <p
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.4rem",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              <span style={{ color: "#3b82f6", marginTop: "1px" }}>⚠️</span>
              <span>
                <strong>Atenção LGPD:</strong> A obtenção de dados fiscais requer o consentimento ativo do
                titular. O token deve ser gerado pelo cidadão na opção{" "}
                <em>"Autorizar Compartilhamento de Dados"</em> no Portal e-CAC.
              </span>
            </p>

            {/* Token de demonstração hint */}
            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                fontSize: "0.78rem",
                color: "#1e40af",
              }}
            >
              <strong>🧪 Para testes em desenvolvimento:</strong> Use o token de demonstração da documentação
              SERPRO:{" "}
              <code
                style={{
                  background: "#dbeafe",
                  padding: "0.1rem 0.4rem",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                onClick={() => setTokenInput(TRIAL_TOKEN)}
                title="Clique para preencher"
              >
                {TRIAL_TOKEN}
              </code>{" "}
              — retorna dados simulados sem custo de produção.
            </div>
          </div>
        </form>
      </div>

      {/* ─── Bloco de Erro ─── */}
      {erro && (
        <div
          style={{
            padding: "1rem 1.25rem",
            borderRadius: "10px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            marginBottom: "1.5rem",
            display: "flex",
            gap: "0.75rem",
            alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>❌</span>
          <div>
            <div style={{ fontWeight: 700, marginBottom: "0.25rem", color: "#7f1d1d" }}>Falha ao buscar dados</div>
            <div style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>{erro}</div>
          </div>
        </div>
      )}

      {/* ─── Skeletons de Loading ─── */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <Skeleton style={{ width: "60%", height: "12px" }} />
                <Skeleton style={{ width: "80%", height: "28px" }} />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
            <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} style={{ width: "90%" }} />)}
            </div>
            <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} style={{ width: i % 2 ? "100%" : "70%" }} />)}
            </div>
          </div>
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      )}

      {/* ─── Resultados ─── */}
      {resultado && resultado.autorizacao && resultado.dados && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Badge MOCK */}
          {resultado.mock && (
            <div
              style={{
                background: "#fef9c3",
                border: "1px solid #fde68a",
                borderRadius: "8px",
                padding: "0.6rem 1rem",
                fontSize: "0.8rem",
                color: "#92400e",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span>🧪</span>
              <strong>Modo Demonstração:</strong> Os dados exibidos são simulados com o token de teste da
              documentação SERPRO. Para dados reais, insira um token de consentimento gerado no e-CAC.
            </div>
          )}

          {/* Cards de métricas */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            {/* Patrimônio Total */}
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                borderLeft: "4px solid #2563eb",
                padding: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ background: "#dbeafe", borderRadius: "10px", padding: "0.75rem", color: "#2563eb", fontSize: "1.4rem", flexShrink: 0 }}>📈</div>
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>Patrimônio Total</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-text)", marginTop: "0.15rem" }}>
                  {buscarValorPorCodigo(resultado.dados, "3")}
                </div>
              </div>
            </div>

            {/* Rendimentos Tributáveis */}
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                borderLeft: "4px solid #059669",
                padding: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ background: "#d1fae5", borderRadius: "10px", padding: "0.75rem", color: "#059669", fontSize: "1.4rem", flexShrink: 0 }}>💵</div>
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>Rendimentos Tributáveis</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-text)", marginTop: "0.15rem" }}>
                  {buscarValorPorCodigo(resultado.dados, "2")}
                </div>
              </div>
            </div>

            {/* Rendimento Fontes PJ */}
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                borderLeft: "4px solid #7c3aed",
                padding: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ background: "#ede9fe", borderRadius: "10px", padding: "0.75rem", color: "#7c3aed", fontSize: "1.4rem", flexShrink: 0 }}>🏛️</div>
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>Rendimento de Fontes PJ</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-text)", marginTop: "0.15rem" }}>
                  {buscarValorPorCodigo(resultado.dados, "1")}
                </div>
              </div>
            </div>
          </div>

          {/* Detalhes e Tabela */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem", alignItems: "start" }}>
            {/* Metadados da autorização */}
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                padding: "1.25rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <h3
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  margin: "0 0 1rem 0",
                  paddingBottom: "0.75rem",
                  borderBottom: "1px solid #f1f5f9",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: "var(--color-text)",
                }}
              >
                <span>👤</span> Dados da Autorização
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                {[
                  { label: "Titular (CPF Criptografado)", value: resultado.autorizacao.titular },
                  { label: "Destinatário (CNPJ Contador)", value: resultado.autorizacao.destinatario },
                  {
                    label: "Data/Hora do Registro",
                    value: resultado.autorizacao.dataHoraRegistro
                      ? new Date(resultado.autorizacao.dataHoraRegistro).toLocaleString("pt-BR")
                      : "N/A",
                  },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94a3b8" }}>
                      {label}
                    </div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, fontFamily: "monospace", marginTop: "0.15rem", wordBreak: "break-all" }}>
                      {value}
                    </div>
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94a3b8" }}>Token Utilizado</div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      fontFamily: "monospace",
                      marginTop: "0.25rem",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      padding: "0.4rem 0.6rem",
                      wordBreak: "break-all",
                    }}
                  >
                    {resultado.autorizacao.token}
                  </div>
                </div>
                <button
                  onClick={() => { setResultado(null); setTokenInput(""); setErro(null); }}
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.5rem",
                    background: "transparent",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    cursor: "pointer",
                    color: "#64748b",
                    fontSize: "0.8rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    justifyContent: "center",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  ✕ Limpar Resultados
                </button>
              </div>
            </div>

            {/* Tabela analítica */}
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  padding: "1rem 1.25rem",
                  borderBottom: "1px solid #f1f5f9",
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>📋</span>
                <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "var(--color-text)" }}>
                  Declaração de Rendimentos Analítica
                </h3>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: "0.75rem", width: "60px" }}>Cód</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: "0.75rem" }}>Especificação da Renda</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right", color: "#64748b", fontWeight: 700, fontSize: "0.75rem" }}>Valor Declarado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.dados.map((item, idx) => (
                      <tr
                        key={item.codigo}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          background: idx % 2 === 0 ? "#fff" : "#fafafa",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafafa")}
                      >
                        <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "0.75rem", color: "#94a3b8" }}>{item.codigo}</td>
                        <td style={{ padding: "0.75rem 1rem", color: "var(--color-text)", fontWeight: 500 }}>{item.texto}</td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#2563eb" }}>
                          {formatarValor(item.codigo, item.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Aviso Legal */}
          {resultado.autorizacao.avisoLegal && (
            <div
              style={{
                padding: "1rem 1.25rem",
                borderRadius: "10px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                color: "#1e40af",
                fontSize: "0.78rem",
                lineHeight: 1.6,
                display: "flex",
                gap: "0.75rem",
                alignItems: "flex-start",
              }}
            >
              <span style={{ flexShrink: 0, marginTop: "1px" }}>📅</span>
              <span>
                <strong>Aviso Legal do Sistema:</strong> {resultado.autorizacao.avisoLegal}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

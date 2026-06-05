import { FormEvent, useCallback, useEffect, useState } from "react";
import { fetchRfbInfosimplesConfig, putRfbInfosimplesConfig } from "../api/client";

export function RfbIntegracaoPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [tokenAcesso, setTokenAcesso] = useState("");
  const [tokenSecreto, setTokenSecreto] = useState("");
  const [timeoutSec, setTimeoutSec] = useState(300);
  const [perfilProcuradorCnpj, setPerfilProcuradorCnpj] = useState("");
  const [useContadorCert, setUseContadorCert] = useState(true);
  const [pkcs12Cert, setPkcs12Cert] = useState("");
  const [pkcs12Pass, setPkcs12Pass] = useState("");
  const [loginCpf, setLoginCpf] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [chaveCriptografia, setChaveCriptografia] = useState("");
  const [cifrarModo, setCifrarModo] = useState<"auto" | "yes" | "no">("auto");
  const [criptografiaMaterial, setCriptografiaMaterial] = useState<"chave_conta" | "token" | "token_secreto">(
    "chave_conta",
  );
  const [criptografiaBase64Ruby, setCriptografiaBase64Ruby] = useState(true);
  const [cifrarApenasPkcs12Pass, setCifrarApenasPkcs12Pass] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const c = await fetchRfbInfosimplesConfig();
      setEnabled(Boolean(c.enabled));
      setTimeoutSec(Number(c.timeoutSec) > 0 ? Math.min(600, Math.max(30, Number(c.timeoutSec))) : 300);
      setPerfilProcuradorCnpj(c.perfilProcuradorCnpj ?? "");
      setUseContadorCert(c.useContadorCert ?? true);
      const cp = c.cifrarParametrosPkcs12;
      setCifrarModo(cp === true ? "yes" : cp === false ? "no" : "auto");
      setCriptografiaMaterial(
        c.criptografiaMaterial === "token"
          ? "token"
          : c.criptografiaMaterial === "token_secreto"
            ? "token_secreto"
            : "chave_conta",
      );
      setCriptografiaBase64Ruby(c.criptografiaBase64Ruby !== false);
      setCifrarApenasPkcs12Pass(Boolean(c.cifrarApenasPkcs12Pass));
      setTokenAcesso("");
      setTokenSecreto("");
      setPkcs12Cert("");
      setPkcs12Pass("");
      setLoginCpf("");
      setLoginSenha("");
      setChaveCriptografia("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao carregar integração RFB");
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
    try {
      const body: Record<string, unknown> = {
        enabled,
        timeoutSec: Math.max(30, Math.min(600, Math.floor(Number(timeoutSec) || 300))),
        perfilProcuradorCnpj: perfilProcuradorCnpj.trim() || "",
        useContadorCert,
      };
      if (tokenAcesso.trim()) body.token = tokenAcesso.trim();
      if (tokenSecreto.trim()) body.tokenSecreto = tokenSecreto.trim();
      if (loginCpf.trim()) body.loginCpf = loginCpf.trim();
      if (loginSenha.trim()) body.loginSenha = loginSenha.trim();
      if (!useContadorCert) {
        if (pkcs12Cert.trim()) body.pkcs12Cert = pkcs12Cert.trim();
        if (pkcs12Pass.trim()) body.pkcs12Pass = pkcs12Pass.trim();
      } else if (pkcs12Pass.trim()) {
        body.pkcs12Pass = pkcs12Pass.trim();
      }
      if (chaveCriptografia.trim()) body.criptografiaChave = chaveCriptografia.trim();
      body.cifrarParametrosPkcs12 = cifrarModo === "auto" ? null : cifrarModo === "yes";
      body.criptografiaMaterial = criptografiaMaterial;
      body.criptografiaBase64Ruby = criptografiaBase64Ruby;
      body.cifrarApenasPkcs12Pass = cifrarApenasPkcs12Pass;
      await putRfbInfosimplesConfig(body);
      setOk("Integração API RFB guardada.");
      setTokenAcesso("");
      setTokenSecreto("");
      setPkcs12Cert("");
      setPkcs12Pass("");
      setLoginCpf("");
      setLoginSenha("");
      setChaveCriptografia("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao guardar integração RFB");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="monitor-hint">A carregar integração API RFB…</p>;

  return (
    <div>
      {err ? <div className="error-toast">{err}</div> : null}
      {ok ? <div className="info-toast">{ok}</div> : null}
      <form className="form-grid cols-2" onSubmit={onSave}>
        <p className="cell-sub" style={{ gridColumn: "1 / -1", marginTop: 0 }}>
          Diagnóstico fiscal via InfoSimples (Receita Federal / Situação). Os nomes dos campos seguem o painel
          InfoSimples; o certificado fica em Contador. Esta app envia{" "}
          <code className="mono-path">POST</code> <code className="mono-path">application/x-www-form-urlencoded</code>{" "}
          (como a API v2). Na página de testes da InfoSimples a URL pode mostrar{" "}
          <code className="mono-path">pkcs12_cert=</code> vazio — normal em GET; o certificado cifrado vai no corpo
          POST. Documentação (login):{" "}
          <a href="https://api.infosimples.com/consultas/docs/receita-federal/situacao" target="_blank" rel="noreferrer">
            receita-federal/situacao
          </a>
          . Erro 604: experimente Base64 Ruby, material token/chave/token secreto ou «cifrar apenas senha PKCS12».
        </p>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Integração API
            RFB ativa
          </label>
        </div>

        <h4 className="cell-sub" style={{ gridColumn: "1 / -1", marginBottom: 0 }}>
          As 3 chaves do painel InfoSimples
        </h4>

        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Token para acesso à API</label>
          <input
            type="password"
            value={tokenAcesso}
            onChange={(e) => setTokenAcesso(e.target.value)}
            placeholder="Cole o valor do painel; vazio mantém o atual. Típico 40 caracteres."
            autoComplete="new-password"
          />
          <p className="cell-sub" style={{ marginTop: "0.35rem" }}>
            Enviado no parâmetro <code className="mono-path">token</code> do pedido à API InfoSimples.
          </p>
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Token secreto</label>
          <input
            type="password"
            value={tokenSecreto}
            onChange={(e) => setTokenSecreto(e.target.value)}
            placeholder="Típico 40 caracteres no painel; vazio mantém o atual"
            autoComplete="new-password"
          />
          <p className="cell-sub" style={{ marginTop: "0.35rem" }}>
            Mesmo valor do painel. Pode ser usado como material AES (opção abaixo) para cifrar o PKCS12; o pedido
            continua a usar o token de acesso no parâmetro{" "}
            <code className="mono-path">token</code>.
          </p>
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Chave de criptografia</label>
          <input
            type="password"
            value={chaveCriptografia}
            onChange={(e) => setChaveCriptografia(e.target.value)}
            placeholder="«CHAVE DE CRIPTOGRAFIA» no painel; típico 40 caracteres; vazio mantém a guardada"
            autoComplete="new-password"
          />
          <p className="cell-sub" style={{ marginTop: "0.35rem" }}>
            A cifra AES-256 (compatível com o gem <code className="mono-path">infosimples-data</code>) usa os primeiros
            32 caracteres desta chave. Obrigatória quando o material AES for «CHAVE DE CRIPTOGRAFIA».
          </p>
        </div>

        <h4 className="cell-sub" style={{ gridColumn: "1 / -1", marginBottom: 0 }}>
          Cifra de parâmetros sensíveis (PKCS12 / senha GOV.BR)
        </h4>

        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Cifrar pkcs12 / login_senha antes do POST</label>
          <select
            className="declaracoes-resp-select"
            value={cifrarModo}
            onChange={(e) => setCifrarModo(e.target.value as "auto" | "yes" | "no")}
            aria-label="Modo de cifra InfoSimples"
          >
            <option value="auto">
              Automático (cifrar quando o material escolhido for válido: chave ≥32, token de acesso ≥32 ou token
              secreto ≥32)
            </option>
            <option value="yes">Sim (obriga material válido — ver erros se faltar)</option>
            <option value="no">Não — enviar em claro (testar se 604 persistir com cifra)</option>
          </select>
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Material da chave AES (32 primeiros caracteres → SHA-256, como o gem infosimples-data)</label>
          <select
            className="declaracoes-resp-select"
            value={criptografiaMaterial}
            onChange={(e) =>
              setCriptografiaMaterial(e.target.value as "chave_conta" | "token" | "token_secreto")
            }
            aria-label="Material da chave de cifra"
          >
            <option value="chave_conta">CHAVE DE CRIPTOGRAFIA (campo «Chave de criptografia» acima)</option>
            <option value="token">Token para acesso à API (primeiros 32 caracteres do token já guardado)</option>
            <option value="token_secreto">Token secreto (primeiros 32 do campo «Token secreto» acima)</option>
          </select>
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>
            <input
              type="checkbox"
              checked={criptografiaBase64Ruby}
              onChange={(e) => setCriptografiaBase64Ruby(e.target.checked)}
            />{" "}
            Base64 estilo Ruby (linhas de 60 caracteres + newline final)
          </label>
          <p className="cell-sub" style={{ marginTop: "0.35rem" }}>
            A InfoSimples pode esperar o mesmo formato que <code className="mono-path">Base64.encode64</code> no Ruby.
            Desmarque só se o suporte indicar Base64 numa única linha.
          </p>
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>
            <input
              type="checkbox"
              checked={cifrarApenasPkcs12Pass}
              onChange={(e) => setCifrarApenasPkcs12Pass(e.target.checked)}
            />{" "}
            Cifrar apenas a senha PKCS12 (e login_senha, se houver) — enviar pkcs12_cert em Base64 claro
          </label>
          <p className="cell-sub" style={{ marginTop: "0.35rem" }}>
            Só aplica quando a cifra está ligada (Automático/Sim). Use se o 604 persistir com o certificado inteiro
            cifrado: algumas integrações esperam só a senha cifrada.
          </p>
        </div>

        <h4 className="cell-sub" style={{ gridColumn: "1 / -1", marginBottom: 0 }}>
          Pedido à consulta
        </h4>

        <div className="field">
          <label>Timeout (segundos)</label>
          <input type="number" min={30} max={600} value={timeoutSec} onChange={(e) => setTimeoutSec(Number(e.target.value))} />
        </div>
        <div className="field">
          <label>Perfil procurador CNPJ (opcional)</label>
          <input
            type="text"
            value={perfilProcuradorCnpj}
            onChange={(e) => setPerfilProcuradorCnpj(e.target.value)}
            placeholder="Somente dígitos"
          />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>
            <input type="checkbox" checked={useContadorCert} onChange={(e) => setUseContadorCert(e.target.checked)} />{" "}
            Usar certificado digital do Contador (já enviado no menu Contador)
          </label>
        </div>
        {!useContadorCert ? (
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>PKCS12 Cert (campo da API, já criptografado)</label>
            <textarea
              value={pkcs12Cert}
              onChange={(e) => setPkcs12Cert(e.target.value)}
              placeholder="Cole pkcs12_cert criptografado"
            />
          </div>
        ) : null}
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>PKCS12 Pass (opcional; vazio mantém atual)</label>
          <input
            type="password"
            value={pkcs12Pass}
            onChange={(e) => setPkcs12Pass(e.target.value)}
            placeholder="Senha PKCS12 (criptografada ou plain conforme seu fluxo)"
            autoComplete="new-password"
          />
        </div>
        <div className="field">
          <label>Login CPF GOV.BR (opcional)</label>
          <input type="text" value={loginCpf} onChange={(e) => setLoginCpf(e.target.value)} />
        </div>
        <div className="field">
          <label>Login Senha GOV.BR (opcional)</label>
          <input
            type="password"
            value={loginSenha}
            onChange={(e) => setLoginSenha(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className="actions-row" style={{ gridColumn: "1 / -1" }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}

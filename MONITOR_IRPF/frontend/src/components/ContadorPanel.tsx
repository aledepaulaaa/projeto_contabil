import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  deleteContadorCertificado,
  fetchContadorCertInfo,
  fetchContadorConfig,
  postContadorTestarCertificado,
  putContadorCertSenha,
  putContadorConfig,
  uploadContadorCertificado,
} from "../api/client";
import { ContadorConfig } from "../interfaces/IContadorConfig";

function parseCertMeta(raw: string | null): { filename?: string } {
  if (!raw) return {};
  try {
    const j = JSON.parse(raw) as { filename?: string };
    return typeof j?.filename === "string" ? { filename: j.filename } : {};
  } catch {
    return {};
  }
}

export function ContadorPanel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [cfgErr, setCfgErr] = useState<string | null>(null);
  const [cfgOk, setCfgOk] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [certErr, setCertErr] = useState<string | null>(null);
  const [certOk, setCertOk] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [certPresente, setCertPresente] = useState(false);
  const [certFilename, setCertFilename] = useState<string | null>(null);
  const [senhaConfigurada, setSenhaConfigurada] = useState(false);
  const [certTamanhoBytes, setCertTamanhoBytes] = useState<number | null>(null);
  const [certSenha, setCertSenha] = useState("");
  const [savingSenha, setSavingSenha] = useState(false);

  const [nome, setNome] = useState("");
  const [crc, setCrc] = useState("");
  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  const loadCertInfo = useCallback(async () => {
    try {
      const info = await fetchContadorCertInfo();
      setCertPresente(Boolean(info.presente));
      setSenhaConfigurada(Boolean(info.senha_configurada));
      setCertTamanhoBytes(
        typeof info.tamanho_bytes_certificado === "number" ? info.tamanho_bytes_certificado : null,
      );
      const m = parseCertMeta(info.meta);
      setCertFilename(m.filename ?? null);
    } catch {
      setCertPresente(false);
      setCertFilename(null);
      setSenhaConfigurada(false);
      setCertTamanhoBytes(null);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setCfgErr(null);
    try {
      const c = await fetchContadorConfig();
      setNome(String(c.nome ?? ""));
      setCrc(String(c.crc ?? ""));
      setCpf(String(c.cpf ?? ""));
      setCnpj(String(c.cnpj ?? ""));
      setEmail(String(c.email ?? ""));
      setTelefone(String(c.telefone ?? ""));
      await loadCertInfo();
    } catch (e) {
      setCfgErr(e instanceof Error ? e.message : "Erro ao carregar dados do contador");
    } finally {
      setLoading(false);
    }
  }, [loadCertInfo]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function onSaveCadastro(e: FormEvent) {
    e.preventDefault();
    setCfgErr(null);
    setCfgOk(null);
    setSaving(true);
    try {
      const body: ContadorConfig = {
        nome: nome.trim(),
        crc: crc.trim(),
        cpf: cpf.trim(),
        cnpj: cnpj.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
      };
      await putContadorConfig(body);
      setCfgOk("Dados do contador guardados.");
      await loadAll();
    } catch (ex) {
      setCfgErr(ex instanceof Error ? ex.message : "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  }

  async function onUploadCert() {
    const input = fileRef.current;
    const file = input?.files?.[0];
    if (!file) {
      setCertErr("Escolha um ficheiro .pfx ou .p12.");
      return;
    }
    setCertErr(null);
    setCertOk(null);
    setUploading(true);
    try {
      const senhaParaEnvio = certSenha.trim();
      const up = await uploadContadorCertificado(file, senhaParaEnvio ? { senha: senhaParaEnvio } : undefined);
      const extra =
        typeof up.bytes_recebidos === "number"
          ? ` (${up.bytes_recebidos.toLocaleString("pt-BR")} bytes recebidos).`
          : ".";
      setCertOk(
        senhaParaEnvio
          ? `Certificado e senha gravados no servidor na mesma operação${extra}`
          : `Certificado gravado no servidor${extra} Se o PFX tiver senha, preencha o campo e use «Guardar senha» ou envie de novo com a senha preenchida.`,
      );
      if (senhaParaEnvio) setCertSenha("");
      if (input) input.value = "";
      await loadCertInfo();
    } catch (ex) {
      setCertErr(ex instanceof Error ? ex.message : "Erro no envio do certificado");
    } finally {
      setUploading(false);
    }
  }

  async function onRemoveCert() {
    setCertErr(null);
    setCertOk(null);
    setUploading(true);
    try {
      await deleteContadorCertificado();
      setCertOk("Certificado removido.");
      await loadCertInfo();
    } catch (ex) {
      setCertErr(ex instanceof Error ? ex.message : "Erro ao remover");
    } finally {
      setUploading(false);
    }
  }

  async function onTestCert() {
    setCertErr(null);
    setCertOk(null);
    try {
      const r = await postContadorTestarCertificado();
      setCertOk(r.message);
    } catch (ex) {
      setCertErr(ex instanceof Error ? ex.message : "Erro ao testar");
    }
  }

  async function onSaveSenha() {
    setCertErr(null);
    setCertOk(null);
    const valor = certSenha;
    const substituirOuDefinir = valor.trim().length > 0;
    setSavingSenha(true);
    try {
      await putContadorCertSenha(valor);
      setCertSenha("");
      setCertOk(
        substituirOuDefinir
          ? "Senha do certificado guardada no servidor."
          : "Senha removida do servidor (use apenas se o PFX não tiver senha ou para voltar a configurar).",
      );
      await loadCertInfo();
    } catch (ex) {
      setCertErr(ex instanceof Error ? ex.message : "Erro ao guardar a senha");
    } finally {
      setSavingSenha(false);
    }
  }

  if (loading) {
    return <p className="monitor-hint">A carregar cadastro do contador…</p>;
  }

  return (
    <div className="contador-panel">
      {cfgErr ? <div className="error-toast">{cfgErr}</div> : null}
      {cfgOk ? <div className="info-toast">{cfgOk}</div> : null}

      <form className="form-grid cols-2" onSubmit={onSaveCadastro}>
        <div className="field">
          <label>Nome completo</label>
          <input value={nome} onChange={(ev) => setNome(ev.target.value)} autoComplete="name" />
        </div>
        <div className="field">
          <label>CRC (registro no conselho regional)</label>
          <input value={crc} onChange={(ev) => setCrc(ev.target.value)} placeholder="Ex.: SP-123456/O-1" />
        </div>
        <div className="field">
          <label>CPF</label>
          <input value={cpf} onChange={(ev) => setCpf(ev.target.value)} autoComplete="off" />
        </div>
        <div className="field">
          <label>CNPJ do escritório (opcional)</label>
          <input value={cnpj} onChange={(ev) => setCnpj(ev.target.value)} autoComplete="off" />
        </div>
        <div className="field">
          <label>E-mail</label>
          <input type="email" value={email} onChange={(ev) => setEmail(ev.target.value)} autoComplete="email" />
        </div>
        <div className="field">
          <label>Telefone</label>
          <input type="tel" value={telefone} onChange={(ev) => setTelefone(ev.target.value)} autoComplete="tel" />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "A guardar…" : "Guardar dados"}
          </button>
        </div>
      </form>

      <hr style={{ margin: "1.5rem 0", border: "none", borderTop: "1px solid var(--border)" }} />

      <h4 style={{ margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: 600 }}>Certificado digital A1</h4>
      {certErr ? <div className="error-toast">{certErr}</div> : null}
      {certOk ? <div className="info-toast">{certOk}</div> : null}

      <p className="monitor-hint" style={{ marginTop: 0 }}>
        Preencha a <strong>senha</strong> (se o PFX tiver) e escolha o ficheiro; em <strong>Enviar certificado</strong> o
        servidor grava certificado e senha <strong>de uma vez</strong>. Também pode enviar só o ficheiro e usar{" "}
        <strong>Guardar senha</strong> a seguir. A senha deixa de ser mostrada depois de guardada (o nome do ficheiro
        não substitui a senha real do PFX).
      </p>
      <p className="monitor-hint">
        Os dados ficam em <code className="mono-path">backend/data/irpf_carteira.db</code> (tabela{" "}
        <code className="mono-path">app_kv</code>). Se o projeto estiver numa pasta sincronizada (ex.: OneDrive), evite
        correr o servidor durante conflitos de ficheiro ou use outro caminho de base de dados via variável{" "}
        <code className="mono-path">DATABASE_URL</code>.
      </p>

      <p className="monitor-hint">
        Estado:{" "}
        {certPresente ? (
          <>
            <strong>certificado guardado</strong>
            {certFilename ? ` (${certFilename})` : ""}
            {certTamanhoBytes != null
              ? ` · ${certTamanhoBytes.toLocaleString("pt-BR")} bytes (PKCS#12) na base`
              : ""}
            {senhaConfigurada ? "; senha configurada no servidor" : "; senha ainda não configurada"}
          </>
        ) : (
          <strong>nenhum certificado</strong>
        )}
      </p>

      <div className="form-grid cols-2" style={{ alignItems: "end" }}>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Senha do certificado</label>
          <input
            type="password"
            value={certSenha}
            onChange={(ev) => setCertSenha(ev.target.value)}
            placeholder={
              senhaConfigurada
                ? "Nova senha para substituir a guardada, ou deixe vazio e guarde para remover"
                : "Senha do ficheiro PFX/P12"
            }
            autoComplete="new-password"
          />
          <p className="cell-sub" style={{ marginTop: "0.35rem" }}>
            {senhaConfigurada
              ? "Já existe uma senha no servidor. Preencha apenas para alterar; campo vazio + «Guardar senha» remove a senha guardada."
              : "Obrigatória na maioria dos certificados A1 para testar e usar nas APIs."}
          </p>
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Ficheiro PFX / P12</label>
          <input ref={fileRef} type="file" accept=".pfx,.p12,application/x-pkcs12" />
        </div>
        <div className="field" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", gridColumn: "1 / -1" }}>
          <button type="button" className="btn btn-primary" disabled={uploading} onClick={() => void onUploadCert()}>
            {uploading ? "A processar…" : "Enviar certificado"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={savingSenha}
            onClick={() => void onSaveSenha()}
          >
            {savingSenha ? "A guardar…" : "Guardar senha"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={uploading || !certPresente}
            onClick={() => void onRemoveCert()}
          >
            Remover certificado
          </button>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => void onTestCert()}>
            Testar certificado
          </button>
        </div>
      </div>
    </div>
  );
}

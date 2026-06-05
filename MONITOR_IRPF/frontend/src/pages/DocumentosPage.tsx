import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ANO_MAX,
  ANO_MIN,
  SESSION_CARTEIRA_ANO_KEY,
  anoExercicioLabel,
  readStoredCarteiraAno,
} from "../constants/rfbAndExercise";
import {
  atribuirChecklistCliente,
  documentoEntregaArquivoUrl,
  fetchChecklistModelos,
  fetchDocumentoClienteDetalhe,
  fetchDocumentosClientes,
  gerarLinkDocumentosCliente,
  setPortalDocumentosBloqueado,
} from "../api/client";
import { formatDateTimeIso } from "../utils/formatDateTime";
import { buildWhatsAppUrl, copyTextToClipboard } from "../utils/documentosShare";
import "../styles/documentos.css";
import { ChecklistModeloResumo } from "../interfaces/IChecklistModeloResumo";
import { ClienteDocumentacaoDetalhe } from "../interfaces/IClienteDocumentacaoDetalhe";
import { DocumentoClienteRow } from "../interfaces/IDocumentoClienteRow";

export function DocumentosPage() {
  const [exerciseYear, setExerciseYear] = useState(() => readStoredCarteiraAno());
  const [rows, setRows] = useState<DocumentoClienteRow[]>([]);
  const [modelos, setModelos] = useState<ChecklistModeloResumo[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");
  const [assignClienteId, setAssignClienteId] = useState<number | null>(null);
  const [assignModeloId, setAssignModeloId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [viewClienteId, setViewClienteId] = useState<number | null>(null);
  const [detalhe, setDetalhe] = useState<ClienteDocumentacaoDetalhe | null>(null);
  const [detalheLoading, setDetalheLoading] = useState(false);
  const [bloqueandoId, setBloqueandoId] = useState<number | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_CARTEIRA_ANO_KEY, String(exerciseYear));
    } catch {
      /* ignore */
    }
  }, [exerciseYear]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [list, mods] = await Promise.all([
        fetchDocumentosClientes(exerciseYear),
        fetchChecklistModelos(),
      ]);
      setRows(list);
      setModelos(mods);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao carregar documentos");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [exerciseYear]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.nome.toLowerCase().includes(q) ||
        (r.cpf || "").replace(/\D/g, "").includes(q.replace(/\D/g, "")),
    );
  }, [rows, filtro]);

  const openAssign = (clienteId: number, modeloId?: number | null) => {
    setAssignClienteId(clienteId);
    setAssignModeloId(modeloId ? String(modeloId) : modelos[0] ? String(modelos[0].id) : "");
    setInfo(null);
    setErr(null);
  };

  const confirmAssign = async () => {
    if (assignClienteId == null || !assignModeloId) return;
    setAssigning(true);
    setErr(null);
    try {
      await atribuirChecklistCliente(assignClienteId, Number(assignModeloId));
      setInfo("Checklist atribuído ao cliente.");
      setAssignClienteId(null);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao atribuir checklist");
    } finally {
      setAssigning(false);
    }
  };

  const ensureLink = async (row: DocumentoClienteRow): Promise<string | null> => {
    if (row.portal_url) return row.portal_url;
    try {
      const link = await gerarLinkDocumentosCliente(row.cliente_manual_id);
      await load();
      return link.portal_url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao gerar link");
      return null;
    }
  };

  const onCopyLink = async (row: DocumentoClienteRow) => {
    const url = await ensureLink(row);
    if (!url) return;
    const ok = await copyTextToClipboard(url);
    setInfo(ok ? "Link copiado para a área de transferência." : "Não foi possível copiar o link.");
  };

  const onWhatsApp = async (row: DocumentoClienteRow) => {
    const url = await ensureLink(row);
    if (!url) return;
    window.open(buildWhatsAppUrl(row.telefone, url, row.nome), "_blank", "noopener,noreferrer");
  };

  const openVisualizar = async (clienteId: number) => {
    setViewClienteId(clienteId);
    setDetalhe(null);
    setDetalheLoading(true);
    setErr(null);
    try {
      setDetalhe(await fetchDocumentoClienteDetalhe(clienteId));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao carregar documentos");
      setViewClienteId(null);
    } finally {
      setDetalheLoading(false);
    }
  };

  const onToggleBloqueio = async (row: DocumentoClienteRow) => {
    const novo = !row.portal_bloqueado;
    const msg = novo
      ? "Bloquear o portal? O cliente deixará de poder enviar, substituir ou alterar documentos."
      : "Desbloquear o portal? O cliente voltará a poder enviar e substituir ficheiros.";
    if (!window.confirm(msg)) return;
    setBloqueandoId(row.cliente_manual_id);
    setErr(null);
    try {
      await setPortalDocumentosBloqueado(row.cliente_manual_id, novo);
      setInfo(novo ? "Portal bloqueado para o cliente." : "Portal desbloqueado.");
      if (viewClienteId === row.cliente_manual_id && detalhe) {
        setDetalhe({ ...detalhe, portal_bloqueado: novo });
      }
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao alterar bloqueio");
    } finally {
      setBloqueandoId(null);
    }
  };

  const formatBytes = (n: number | null | undefined) => {
    if (n == null || n <= 0) return "";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  const onRegenerarLink = async (row: DocumentoClienteRow) => {
    if (!row.documentacao_id) return;
    if (!window.confirm("Gerar novo link? O link anterior deixa de funcionar.")) return;
    try {
      await gerarLinkDocumentosCliente(row.cliente_manual_id, true);
      setInfo("Novo link gerado.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao regenerar link");
    }
  };

  return (
    <>
      <header className="top-bar">
        <div>
          <h2>Documentos</h2>
          <p className="top-bar-meta">
            Acompanhe a entrega de documentos por cliente e partilhe o link do portal de envio.
          </p>
        </div>
        <div className="top-bar-actions">
          <div className="year-cycle-nav" aria-label="Ano-calendário">
            <button
              type="button"
              disabled={exerciseYear <= ANO_MIN || loading}
              onClick={() => setExerciseYear((y) => Math.max(ANO_MIN, y - 1))}
            >
              −
            </button>
            <span className="year-cycle-label">{anoExercicioLabel(exerciseYear)}</span>
            <button
              type="button"
              disabled={exerciseYear >= ANO_MAX || loading}
              onClick={() => setExerciseYear((y) => Math.min(ANO_MAX, y + 1))}
            >
              +
            </button>
          </div>
          <button type="button" className="btn btn-primary" disabled={loading} onClick={() => void load()}>
            Atualizar
          </button>
        </div>
      </header>
      <main className="content-area">
        {err ? <div className="error-toast">{err}</div> : null}
        {info ? <div className="info-toast">{info}</div> : null}

        {!modelos.length ? (
          <div className="declaracoes-hint-banner">
            Crie pelo menos um modelo de checklist em <strong>Configurações → Preferências → Checklists</strong> antes de
            atribuir aos clientes.
          </div>
        ) : null}

        <div className="documentos-toolbar">
          <label>
            Pesquisar cliente
            <input
              type="search"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Nome ou CPF"
            />
          </label>
        </div>

        <div className="table-wrap">
          <table className="data-table documentos-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Checklist</th>
                <th>Progresso</th>
                <th>Último envio</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.cliente_manual_id} className={!row.ativo ? "cliente-row-inativa" : undefined}>
                  <td>
                    <div className="cell-strong">{row.nome}</div>
                    <div className="cell-sub">{row.cpf ?? "—"}</div>
                  </td>
                  <td>
                    {row.modelo_nome ?? <span className="doc-muted">Não atribuído</span>}
                    {row.portal_bloqueado ? (
                      <span className="doc-badge-locked" title="Portal bloqueado para o cliente">
                        Bloqueado
                      </span>
                    ) : null}
                  </td>
                  <td>
                    {row.documentacao_id ? (
                      <div className="doc-progress-cell">
                        <div className="doc-progress-bar" role="progressbar" aria-valuenow={row.percentual}>
                          <div className="doc-progress-fill" style={{ width: `${row.percentual}%` }} />
                        </div>
                        <span className="doc-progress-label">
                          {row.itens_entregues}/{row.total_itens} ({row.percentual}%)
                        </span>
                      </div>
                    ) : (
                      <span className="doc-muted">—</span>
                    )}
                  </td>
                  <td>{formatDateTimeIso(row.ultimo_upload_em ?? null) ?? "—"}</td>
                  <td>
                    <div className="doc-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-small"
                        onClick={() => openAssign(row.cliente_manual_id, row.modelo_id)}
                      >
                        {row.modelo_id ? "Alterar checklist" : "Atribuir checklist"}
                      </button>
                      {row.documentacao_id ? (
                        <>
                          {row.tem_entregas ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-small"
                              onClick={() => void openVisualizar(row.cliente_manual_id)}
                            >
                              Visualizar
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className={`btn btn-ghost btn-small${row.portal_bloqueado ? " doc-btn-locked" : ""}`}
                            disabled={bloqueandoId === row.cliente_manual_id}
                            title={
                              row.portal_bloqueado
                                ? "Desbloquear envio pelo cliente"
                                : "Impedir alterações pelo cliente"
                            }
                            onClick={() => void onToggleBloqueio(row)}
                          >
                            {bloqueandoId === row.cliente_manual_id
                              ? "…"
                              : row.portal_bloqueado
                                ? "Desbloquear"
                                : "Bloquear link"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-small"
                            onClick={() => void onCopyLink(row)}
                          >
                            Copiar link
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-small"
                            onClick={() => void onWhatsApp(row)}
                          >
                            WhatsApp
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-small"
                            title="Novo link (invalida o anterior)"
                            onClick={() => void onRegenerarLink(row)}
                          >
                            Novo link
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && !loading ? <p className="empty">Nenhum cliente neste exercício.</p> : null}
        </div>

        {viewClienteId !== null ? (
          <div className="modal-backdrop" role="presentation" onClick={() => setViewClienteId(null)}>
            <div
              className="modal-card doc-view-modal"
              role="dialog"
              aria-labelledby="doc-view-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="doc-view-title">Documentos enviados</h2>
              {detalheLoading ? (
                <p className="monitor-hint">A carregar…</p>
              ) : detalhe ? (
                <>
                  <p className="monitor-hint" style={{ marginTop: 0 }}>
                    <strong>{detalhe.nome}</strong> — {detalhe.modelo_nome} ({detalhe.percentual}%)
                    {detalhe.portal_bloqueado ? (
                      <span className="doc-badge-locked" style={{ marginLeft: "0.5rem" }}>
                        Portal bloqueado
                      </span>
                    ) : null}
                  </p>
                  <ul className="doc-view-list">
                    {detalhe.itens.map((it) => (
                      <li key={it.checklist_item_id} className={it.entregue ? "doc-view-item--ok" : ""}>
                        <div className="doc-view-item-head">
                          <span className="cell-strong">{it.titulo}</span>
                          {it.entregue ? (
                            <span className="portal-doc-status-ok">Enviado</span>
                          ) : (
                            <span className="portal-doc-status-pend">Pendente</span>
                          )}
                        </div>
                        {it.entregue && it.entrega_id ? (
                          <div className="doc-view-file-row">
                            <span className="cell-sub">
                              {it.arquivo_nome}
                              {it.uploaded_at ? ` · ${formatDateTimeIso(it.uploaded_at)}` : ""}
                              {it.tamanho_bytes ? ` · ${formatBytes(it.tamanho_bytes)}` : ""}
                            </span>
                            <a
                              className="btn btn-ghost btn-small"
                              href={documentoEntregaArquivoUrl(it.entrega_id)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Abrir / transferir
                            </a>
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              <div className="actions-row">
                <button type="button" className="btn btn-ghost" onClick={() => setViewClienteId(null)}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {assignClienteId !== null ? (
          <div className="modal-backdrop" role="presentation" onClick={() => setAssignClienteId(null)}>
            <div
              className="modal-card doc-assign-modal"
              role="dialog"
              aria-labelledby="doc-assign-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="doc-assign-title">Atribuir checklist</h2>
              <label className="field">
                Modelo
                <select value={assignModeloId} onChange={(e) => setAssignModeloId(e.target.value)}>
                  {modelos.map((m) => (
                    <option key={m.id} value={String(m.id)}>
                      {m.nome} ({m.itens_count} itens)
                    </option>
                  ))}
                </select>
              </label>
              <div className="actions-row">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={assigning || !assignModeloId}
                  onClick={() => void confirmAssign()}
                >
                  {assigning ? "A guardar…" : "Confirmar"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setAssignClienteId(null)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </>
  );
}

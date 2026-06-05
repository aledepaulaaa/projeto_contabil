import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPortalPublico, uploadDocumentoPortal } from "../api/client";
import { formatDateTimeIso } from "../utils/formatDateTime";
import "../styles/documentos.css";
import { PortalPublico } from "../interfaces/IPortalPublico";

export function PortalClienteDocumentosPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PortalPublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setErr(null);
    try {
      setData(await fetchPortalPublico(token));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Link inválido ou indisponível.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const onPickFile = (itemId: number) => {
    fileRefs.current[itemId]?.click();
  };

  const onFileChange = async (itemId: number, file: File | undefined) => {
    if (!token || !file) return;
    setUploadingId(itemId);
    setErr(null);
    try {
      await uploadDocumentoPortal(token, itemId, file);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao enviar ficheiro");
    } finally {
      setUploadingId(null);
      const input = fileRefs.current[itemId];
      if (input) input.value = "";
    }
  };

  return (
    <div className="portal-doc-page">
      <header className="portal-doc-header">
        <h1>Carteira IRPF</h1>
        <p>Envio seguro de documentos para a sua declaração</p>
      </header>

      <main className="portal-doc-main">
        {loading ? <p className="portal-doc-loading">A carregar…</p> : null}
        {err ? <div className="portal-doc-error">{err}</div> : null}

        {data ? (
          <>
            <h2 className="portal-doc-title">{data.titulo_portal}</h2>
            <div className="doc-progress-cell portal-doc-progress">
              <div className="doc-progress-bar" role="progressbar" aria-valuenow={data.percentual}>
                <div className="doc-progress-fill" style={{ width: `${data.percentual}%` }} />
              </div>
              <span className="doc-progress-label">{data.percentual}% concluído</span>
            </div>
            {data.portal_bloqueado ? (
              <div className="portal-doc-locked">
                O escritório bloqueou alterações neste link. Os documentos já enviados não podem ser substituídos nem
                removidos.
              </div>
            ) : (
              <p className="portal-doc-hint">
                Para cada item abaixo, anexe PDF, Word ou foto (JPG/PNG). Pode substituir um ficheiro enviando outro no
                mesmo item.
              </p>
            )}
            <ul className="portal-doc-list">
              {data.itens.map((it) => (
                <li key={it.checklist_item_id} className={it.entregue ? "portal-doc-item--done" : ""}>
                  <div className="portal-doc-item-head">
                    <span className="portal-doc-item-title">
                      {it.titulo}
                      {it.obrigatorio ? <span className="portal-doc-badge">Obrigatório</span> : null}
                    </span>
                    {it.entregue ? (
                      <span className="portal-doc-status-ok">Enviado</span>
                    ) : (
                      <span className="portal-doc-status-pend">Pendente</span>
                    )}
                  </div>
                  {it.arquivo_nome ? (
                    <p className="portal-doc-file">
                      Ficheiro: <strong>{it.arquivo_nome}</strong>
                      {it.uploaded_at ? (
                        <span className="cell-sub"> — {formatDateTimeIso(it.uploaded_at)}</span>
                      ) : null}
                    </p>
                  ) : null}
                  {!data.portal_bloqueado ? (
                    <>
                      <input
                        ref={(el) => {
                          fileRefs.current[it.checklist_item_id] = el;
                        }}
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif,image/*,application/pdf"
                        className="sr-only"
                        onChange={(e) => void onFileChange(it.checklist_item_id, e.target.files?.[0])}
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-small"
                        disabled={uploadingId === it.checklist_item_id}
                        onClick={() => onPickFile(it.checklist_item_id)}
                      >
                        {uploadingId === it.checklist_item_id
                          ? "A enviar…"
                          : it.entregue
                            ? "Substituir ficheiro"
                            : "Anexar ficheiro"}
                      </button>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </main>
    </div>
  );
}

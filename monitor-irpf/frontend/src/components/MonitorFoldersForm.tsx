import { useCallback, useEffect, useState } from "react";
import { fetchMonitorStatus, putMonitorPaths } from "../api/client";
import { MonitorStatus } from "../interfaces/IMonitorStatus";

function draftFromStatus(m: MonitorStatus): string[] {
  const paths = Array.isArray(m.irpf_root_paths) ? m.irpf_root_paths : [];
  if (paths.length > 0) {
    return paths.map((p) => p);
  }
  if (m.irpf_root_path) {
    return [m.irpf_root_path];
  }
  return [""];
}

export function MonitorFoldersForm() {
  const [status, setStatus] = useState<MonitorStatus | null>(null);
  const [draft, setDraft] = useState<string[]>([""]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    const m = await fetchMonitorStatus();
    setStatus(m);
    setDraft(draftFromStatus(m));
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Erro ao carregar monitor");
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const addRow = () => {
    setDraft((rows) => [...rows, ""]);
    setSavedOk(false);
  };

  const removeRow = (index: number) => {
    setDraft((rows) => rows.filter((_, i) => i !== index));
    setSavedOk(false);
  };

  const setPathAt = (index: number, value: string) => {
    setDraft((rows) => rows.map((p, i) => (i === index ? value : p)));
    setSavedOk(false);
  };

  const save = async () => {
    const paths = draft.map((p) => p.trim()).filter(Boolean);
    setSaving(true);
    setErr(null);
    setSavedOk(false);
    try {
      const m = await putMonitorPaths(paths);
      setStatus(m);
      setDraft(paths.length > 0 ? paths : [""]);
      setSavedOk(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="content-card">
        <h3>Monitor — Pastas IRPF</h3>
        <p className="empty">A carregar…</p>
      </div>
    );
  }

  return (
    <div className="content-card">
      <h3>Monitor — Pastas IRPF</h3>
      <p className="monitor-hint">
        Indique o <strong>caminho completo</strong> de cada pasta (ex.: instalação GovBox). Pode monitorar{" "}
        <strong>várias pastas</strong>. O navegador não expõe o caminho ao &quot;abrir&quot; pastas; copie o caminho
        a partir do Explorador de ficheiros (Windows: barra de endereço ou Shift+clique direito → Copiar como
        caminho).
      </p>

      {err ? <div className="error-toast">{err}</div> : null}
      {savedOk ? <div className="info-toast">Pastas monitoradas guardadas com sucesso.</div> : null}

      <div className="config-folder-rows">
        {draft.map((path, index) => (
          <div key={index} className="config-folder-row">
            <label className="sr-only" htmlFor={`folder-path-${index}`}>
              Pasta monitorada {index + 1}
            </label>
            <input
              id={`folder-path-${index}`}
              type="text"
              className="mono-path"
              placeholder="C:\Program Files (x86)\GOVBOX\irpf-2026"
              value={path}
              onChange={(e) => setPathAt(index, e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => removeRow(index)}
              disabled={draft.length === 1}
              title="Remover esta pasta"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      <div className="config-folder-actions">
        <button type="button" className="btn btn-ghost" onClick={addRow}>
          + Inserir nova pasta monitorada
        </button>
        <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={saving}>
          {saving ? "A guardar…" : "Guardar pastas"}
        </button>
      </div>

      {status ? (
        <dl className="insight-dl" style={{ marginTop: "1.25rem" }}>
          <dt>Monitor ativo</dt>
          <dd>{status.monitor_enabled ? "Sim" : "Não"}</dd>
          <dt>Último scan</dt>
          <dd>{status.last_scan_at ?? "—"}</dd>
        </dl>
      ) : null}
    </div>
  );
}

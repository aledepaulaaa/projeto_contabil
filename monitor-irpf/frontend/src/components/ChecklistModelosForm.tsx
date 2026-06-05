import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  createChecklistModelo,
  deleteChecklistModelo,
  fetchChecklistModelo,
  fetchChecklistModelos,
  updateChecklistModelo,
} from "../api/client";
import { ChecklistItemIn } from "../interfaces/IChecklistItemIn";
import { ChecklistModelo } from "../interfaces/IChecklistModelo";
import { ChecklistModeloResumo } from "../interfaces/IChecklistModeloResumo";

type ItemDraft = ChecklistItemIn & { _key: string };

function emptyItem(ordem: number): ItemDraft {
  return { _key: `i-${Date.now()}-${ordem}`, titulo: "", descricao: "", ordem, obrigatorio: true };
}

function itemsFromModelo(m: ChecklistModelo): ItemDraft[] {
  return m.itens.map((it, idx) => ({
    _key: `e-${it.id}`,
    titulo: it.titulo,
    descricao: it.descricao ?? "",
    ordem: it.ordem ?? idx,
    obrigatorio: it.obrigatorio,
  }));
}

export function ChecklistModelosForm() {
  const [resumo, setResumo] = useState<ChecklistModeloResumo[]>([]);
  const [selectedId, setSelectedId] = useState<number | "new" | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [itens, setItens] = useState<ItemDraft[]>([emptyItem(0)]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const loadResumo = useCallback(async () => {
    const list = await fetchChecklistModelos();
    setResumo(list);
    return list;
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await loadResumo();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Erro ao carregar modelos");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadResumo]);

  const openNew = () => {
    setSelectedId("new");
    setNome("");
    setDescricao("");
    setItens([emptyItem(0), emptyItem(1)]);
    setErr(null);
    setOkMsg(null);
  };

  const openEdit = async (id: number) => {
    setErr(null);
    setOkMsg(null);
    try {
      const m = await fetchChecklistModelo(id);
      setSelectedId(id);
      setNome(m.nome);
      setDescricao(m.descricao ?? "");
      setItens(itemsFromModelo(m).length ? itemsFromModelo(m) : [emptyItem(0)]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao abrir modelo");
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    setOkMsg(null);
    const payloadItens = itens
      .map((it, idx) => ({
        titulo: it.titulo.trim(),
        descricao: (it.descricao || "").trim() || null,
        ordem: idx,
        obrigatorio: Boolean(it.obrigatorio),
      }))
      .filter((it) => it.titulo.length > 0);
    if (!nome.trim()) {
      setErr("Indique o nome do modelo.");
      setSaving(false);
      return;
    }
    if (!payloadItens.length) {
      setErr("Adicione pelo menos um documento ao checklist.");
      setSaving(false);
      return;
    }
    try {
      if (selectedId === "new") {
        const created = await createChecklistModelo({
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          itens: payloadItens,
        });
        await loadResumo();
        setSelectedId(created.id);
        setOkMsg("Modelo criado.");
      } else if (typeof selectedId === "number") {
        await updateChecklistModelo(selectedId, {
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          itens: payloadItens,
        });
        await loadResumo();
        setOkMsg("Modelo guardado.");
      }
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (typeof selectedId !== "number") return;
    if (!window.confirm("Apagar este modelo de checklist? Clientes que o usam impedem a eliminação.")) return;
    setSaving(true);
    setErr(null);
    try {
      await deleteChecklistModelo(selectedId);
      await loadResumo();
      setSelectedId(null);
      setOkMsg("Modelo apagado.");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro ao apagar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="monitor-hint">A carregar modelos…</p>;

  return (
    <div className="checklist-config">
      <p className="monitor-hint">
        Crie <strong>modelos de checklist</strong> com os documentos que o cliente deve enviar. Depois atribua um modelo
        a cada cliente no menu <strong>Documentos</strong>.
      </p>
      {err ? <div className="error-toast">{err}</div> : null}
      {okMsg ? <div className="info-toast">{okMsg}</div> : null}

      <div className="checklist-config-layout">
        <aside className="checklist-config-list">
          <button type="button" className="btn btn-primary btn-small" onClick={openNew}>
            + Novo modelo
          </button>
          <ul>
            {resumo.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className={`checklist-config-list-btn${selectedId === m.id ? " active" : ""}`}
                  onClick={() => void openEdit(m.id)}
                >
                  <span className="cell-strong">{m.nome}</span>
                  <span className="cell-sub">{m.itens_count} itens</span>
                </button>
              </li>
            ))}
            {!resumo.length ? <li className="cell-sub">Nenhum modelo ainda.</li> : null}
          </ul>
        </aside>

        {selectedId !== null ? (
          <form className="checklist-config-editor" onSubmit={(e) => void onSubmit(e)}>
            <div className="form-grid cols-2">
              <div className="field">
                <label htmlFor="ck-nome">Nome do modelo</label>
                <input
                  id="ck-nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex.: Documentos IRPF 2025"
                />
              </div>
              <div className="field">
                <label htmlFor="ck-desc">Descrição (opcional)</label>
                <input
                  id="ck-desc"
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>
            </div>

            <h4 style={{ margin: "1rem 0 0.5rem" }}>Documentos do checklist</h4>
            <div className="checklist-items-table-wrap">
              <table className="data-table checklist-items-table">
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Obrigatório</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {itens.map((it, idx) => (
                    <tr key={it._key}>
                      <td>
                        <input
                          type="text"
                          value={it.titulo}
                          placeholder="Ex.: Informe de rendimentos"
                          onChange={(e) =>
                            setItens((rows) =>
                              rows.map((r, i) => (i === idx ? { ...r, titulo: e.target.value } : r)),
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={Boolean(it.obrigatorio)}
                          onChange={(e) =>
                            setItens((rows) =>
                              rows.map((r, i) => (i === idx ? { ...r, obrigatorio: e.target.checked } : r)),
                            )
                          }
                          aria-label="Obrigatório"
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost btn-small"
                          disabled={itens.length <= 1}
                          onClick={() => setItens((rows) => rows.filter((_, i) => i !== idx))}
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-small"
              style={{ marginTop: "0.5rem" }}
              onClick={() => setItens((rows) => [...rows, emptyItem(rows.length)])}
            >
              + Adicionar documento
            </button>

            <div className="actions-row">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "A guardar…" : "Guardar modelo"}
              </button>
              {typeof selectedId === "number" ? (
                <button type="button" className="btn btn-danger" disabled={saving} onClick={() => void onDelete()}>
                  Apagar modelo
                </button>
              ) : null}
              <button type="button" className="btn btn-ghost" onClick={() => setSelectedId(null)}>
                Fechar
              </button>
            </div>
          </form>
        ) : (
          <p className="monitor-hint">Selecione um modelo à esquerda ou crie um novo.</p>
        )}
      </div>
    </div>
  );
}

import { FormEvent, useCallback, useEffect, useState } from "react";
import { createUsuario, deleteUsuario, fetchUsuarios } from "../api/client";
import { Usuario } from "../interfaces/IUsuario";

export function UsuariosPage() {
  const [list, setList] = useState<Usuario[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      setList(await fetchUsuarios());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await createUsuario({ nome: nome.trim(), email: email.trim(), ativo: true });
      setNome("");
      setEmail("");
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro ao criar");
    }
  }

  async function onDel(id: number) {
    if (!confirm("Remover usuário?")) return;
    setErr(null);
    try {
      await deleteUsuario(id);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro ao remover");
    }
  }

  return (
    <>
      <header className="top-bar">
        <div>
          <h2>Usuários</h2>
          <p className="top-bar-meta">Responsáveis pela carteira</p>
        </div>
      </header>
      <main className="content-area">
        {err ? <div className="error-toast">{err}</div> : null}
        <div className="content-card">
          <h3>Novo usuário</h3>
          <form className="toolbar-inline" onSubmit={onSubmit}>
            <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            <input type="text" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button type="submit" className="btn btn-primary">
              Adicionar
            </button>
          </form>
        </div>
        <div className="content-card" style={{ marginTop: "1rem" }}>
          <h3>Lista</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Ativo</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nome}</td>
                    <td>{u.email}</td>
                    <td>{u.ativo ? "Sim" : "Não"}</td>
                    <td>
                      <button type="button" className="btn btn-small btn-danger" onClick={() => void onDel(u.id)}>
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <>
      <header className="top-bar">
        <div>
          <h2>{title}</h2>
          <p className="top-bar-meta">{description}</p>
        </div>
      </header>
      <main className="content-area">
        <div className="content-card">
          <p className="monitor-hint">
            Esta área pode ser expandida depois (CRUD, integrações externas, etc.). O backend já expõe
            rotas em <code>/api</code> conforme necessário.
          </p>
        </div>
      </main>
    </>
  );
}

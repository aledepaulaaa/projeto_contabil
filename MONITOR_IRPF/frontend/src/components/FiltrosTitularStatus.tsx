export type FiltroStatusOption = { value: string; label: string };

type FiltrosTitularStatusProps = {
  titular: string;
  onTitularChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  statusOptions: FiltroStatusOption[];
  titularPlaceholder?: string;
  statusLabel?: string;
};

export function FiltrosTitularStatus({
  titular,
  onTitularChange,
  status,
  onStatusChange,
  statusOptions,
  titularPlaceholder = "Nome ou CPF…",
  statusLabel = "Status",
}: FiltrosTitularStatusProps) {
  const ativo = Boolean(titular.trim() || status);

  function limpar() {
    onTitularChange("");
    onStatusChange("");
  }

  return (
    <div className="lista-filtros-bar" role="search">
      <label className="filter-label">
        Titular
        <input
          type="search"
          value={titular}
          onChange={(e) => onTitularChange(e.target.value)}
          placeholder={titularPlaceholder}
          autoComplete="off"
        />
      </label>
      <label className="filter-label">
        {statusLabel}
        <select value={status} onChange={(e) => onStatusChange(e.target.value)} aria-label={statusLabel}>
          <option value="">Todos</option>
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      {ativo ? (
        <button type="button" className="btn btn-ghost btn-small lista-filtros-limpar" onClick={limpar}>
          Limpar filtros
        </button>
      ) : null}
    </div>
  );
}

import { useMemo } from "react";

interface PaginacaoProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (limit: number) => void;
}

const ITEMS_OPTIONS = [10, 20, 50, 100];

/**
 * Componente reutilizável de paginação client-side.
 * Exibe indicador "Exibindo X a Y de Z itens", seletor de quantidade
 * e botões de navegação com reticências.
 */
export function Paginacao({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
}: PaginacaoProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(safeCurrentPage * itemsPerPage, totalItems);

  /** Gera a lista de páginas com reticências (…). */
  const pageButtons = useMemo(() => {
    const pages: (number | "...")[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push("...");
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safeCurrentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, safeCurrentPage]);

  if (totalItems === 0) return null;

  return (
    <div
      className="paginacao-container"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        padding: "0.75rem 0",
        fontSize: "0.85rem",
        color: "var(--muted)",
      }}
    >
      {/* Info esquerda */}
      <span>
        Exibindo <strong style={{ color: "var(--text)" }}>{startItem}</strong> a{" "}
        <strong style={{ color: "var(--text)" }}>{endItem}</strong> de{" "}
        <strong style={{ color: "var(--text)" }}>{totalItems}</strong> itens
      </span>

      {/* Centro: botões de navegação */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
        <button
          type="button"
          className="btn btn-ghost btn-small"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange(safeCurrentPage - 1)}
          aria-label="Página anterior"
          style={{ minWidth: "2rem", padding: "0.25rem 0.5rem" }}
        >
          ‹
        </button>

        {pageButtons.map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} style={{ padding: "0 0.35rem", userSelect: "none" }}>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`btn btn-small ${p === safeCurrentPage ? "btn-primary" : "btn-ghost"}`}
              onClick={() => onPageChange(p)}
              aria-label={`Página ${p}`}
              aria-current={p === safeCurrentPage ? "page" : undefined}
              style={{ minWidth: "2rem", padding: "0.25rem 0.5rem" }}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          className="btn btn-ghost btn-small"
          disabled={safeCurrentPage >= totalPages}
          onClick={() => onPageChange(safeCurrentPage + 1)}
          aria-label="Próxima página"
          style={{ minWidth: "2rem", padding: "0.25rem 0.5rem" }}
        >
          ›
        </button>
      </div>

      {/* Direita: seletor de itens por página */}
      {onItemsPerPageChange ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span>Itens/pág:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            style={{
              padding: "0.25rem 0.5rem",
              borderRadius: "var(--radius, 4px)",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            {ITEMS_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}

import { useCallback, useMemo, useState } from "react";

/**
 * Hook que encapsula a lógica client-side de paginação.
 * Retorna os dados paginados + props prontas para <Paginacao />.
 */
export function usePaginacao<T>(items: T[], defaultLimit = 20) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  // Reset para página 1 se exceder
  const safePage = Math.min(page, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * limit;
    return items.slice(start, start + limit);
  }, [items, safePage, limit]);

  const resetPage = useCallback(() => setPage(1), []);

  const onPageChange = useCallback((p: number) => setPage(p), []);
  const onItemsPerPageChange = useCallback(
    (newLimit: number) => {
      setLimit(newLimit);
      setPage(1);
    },
    [],
  );

  return {
    paginatedItems,
    paginacaoProps: {
      totalItems,
      itemsPerPage: limit,
      currentPage: safePage,
      onPageChange,
      onItemsPerPageChange,
    },
    resetPage,
  };
}

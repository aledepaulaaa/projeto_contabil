/** Filtra linhas por nome do titular ou trecho do CPF (apenas dígitos). */
export function filtrarPorTitular<T>(
  rows: T[],
  busca: string,
  getNome: (row: T) => string,
  getCpf?: (row: T) => string | null,
): T[] {
  const q = busca.trim();
  if (!q) return rows;
  const lower = q.toLowerCase();
  const digits = q.replace(/\D/g, "");
  return rows.filter((row) => {
    const nome = getNome(row).toLowerCase();
    if (nome.includes(lower)) return true;
    if (digits.length >= 3 && getCpf) {
      const cpf = (getCpf(row) ?? "").replace(/\D/g, "");
      if (cpf.includes(digits)) return true;
    }
    return false;
  });
}

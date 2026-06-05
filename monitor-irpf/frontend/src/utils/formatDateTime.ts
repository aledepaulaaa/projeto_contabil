/** Formata ISO (UTC ou local) para exibição em pt-BR. */
export function formatDateTimeIso(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR");
}

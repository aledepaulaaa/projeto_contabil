export interface DashboardResumo {
  por_status: Record<string, number>;
  por_resultado: Record<string, number>;
  por_ano: { ano_calendario: string; quantidade: number }[];
  disco: { areas: { label: string; total_bytes: number; truncado?: boolean }[] };
}
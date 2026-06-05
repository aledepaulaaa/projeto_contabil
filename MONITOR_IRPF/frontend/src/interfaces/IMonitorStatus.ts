export interface MonitorStatus {
  /** Todas as pastas monitoradas (preferir este campo). */
  irpf_root_paths?: string[];
  /** Primeira pasta; mantido para compatibilidade. */
  irpf_root_path: string | null;
  monitor_enabled: boolean;
  last_scan_at: string | null;
}